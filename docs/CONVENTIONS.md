# CONVENTIONS.md — Agent Session Contract

> **Step 5 deliverable.** Feed this file to the Agent at the start of **every**
> coding session, together with the phase brief from `MASTER_PLAN.md`.
>
> Companions: [`TARGET_ARCHITECTURE.md`](TARGET_ARCHITECTURE.md),
> [`SCHEMA_DESIGN.md`](SCHEMA_DESIGN.md), [`DESIGN_SYSTEM.md`](DESIGN_SYSTEM.md),
> [`MASTER_PLAN.md`](MASTER_PLAN.md), [`READINESS_CHECKLIST.md`](READINESS_CHECKLIST.md).
>
> Product / repo / URL / identifier token: **Rajya** / `rajya` /
> `https://rajya.pages.dev` / `rajya`.

---

## §0 How to use this document

1. Read this file fully before writing code.
2. Read only the `MASTER_PLAN.md` phase section for the current session — not the whole plan.
3. Pull the named AUDIT / SCHEMA / DESIGN slices listed in that phase's session brief.
4. If a rule here conflicts with improvisation, **this file wins**.
5. If a product decision is unclear, **stop and ask** — do not invent.

---

## §1 Repository layout (locked)

Single git repository named **`rajya`**:

```
rajya/
  backend/          Rails 8 API-only
  frontend/         React 19 + TypeScript + Vite PWA
  docs/             All planning markdown (this file lives here once moved)
  .github/workflows/
  docker-compose.yml
  docker-compose.dev.yml
  .tool-versions
  Procfile.dev
  README.md
```

Legacy `cognify/` and `botverse/` live **outside** the repo as read-only
reference (`../legacy/…`). Never edit them from a `rajya` session.

Paths in docs: `backend/`, `frontend/`, `docs/` are relative to the `rajya/` root.

---

## §2 Backend (Rails) standards

### 2.1 Layering — one rule

> A controller authenticates, authorizes, delegates to **exactly one** operation,
> and renders **one** serializer. Everything else is a violation.

| Layer | Path | May | Must not |
| --- | --- | --- | --- |
| Controllers | `app/controllers/api/v1/` | Auth, `authorize` / `policy_scope`, call one operation, render | Business logic, SQL, JSON assembly, enqueue fanout inline |
| Operations | `app/operations/` | All writes; return `Result` | Render HTTP; know about request objects |
| Queries | `app/queries/` | Complex reads | Writes |
| Serializers | `app/serializers/` (Alba) | Define JSON shape | Load associations ad hoc — preload in the query/operation |
| Policies | `app/policies/` | Permission matrix | Side effects |
| Models | `app/models/` | Persistence, associations, invariants | JSON payloads, complex queries, broadcasting |
| Channels | `app/channels/` | Subscribe, authorize, relay | Business writes (call an operation) |
| Jobs | `app/jobs/` | Thin wrappers calling operations | Duplicate operation logic |
| Services | `app/services/` | Cross-cutting infra (`Ai::`, `Storage::`, `Push::`, `Realtime::`) | Domain use-cases that belong in operations |

Target: **≤15 lines per controller action.**

### 2.2 Operations and `Result`

```ruby
module Messages
  class Send < ApplicationOperation
    def call(...)
      return failure(:blank_message) if ...
      success(message)
    end
  end
end
```

- One public `#call` per operation class.
- Failures use **symbolic codes** from the taxonomy below — never raw strings as the contract.
- Reusable from HTTP, Cable, jobs, and (later) agents — never assume a human `current_user` without also accepting an account.

### 2.3 Error taxonomy → HTTP

| Code | Status |
| --- | --- |
| `:not_found` | 404 |
| `:unauthenticated` | 401 |
| `:forbidden` | 403 |
| `:validation_failed` | 422 |
| `:conflict` | 409 |
| `:rate_limited` | 429 |
| `:quota_exceeded` | 507 |
| `:upstream_failed` | 502 |

**Response body shape (always):**

```json
{ "error": { "code": "forbidden", "message": "…", "details": {} } }
```

`message` is resolved through the string catalog (`t(...)`) — never a hardcoded
user-facing sentence in the controller.

Success bodies are Alba serializer output. Do not invent ad-hoc hashes.

### 2.4 `current_user` vs `current_account`

| Method | Means |
| --- | --- |
| `current_user` | The **human who authenticated** (`users` row). Used for admin, credentials, impersonation audit. |
| `current_account` | The **participant acting in conversations** (`accounts` row). Policies and messaging always use this. |

During impersonation: `current_user` = admin, `current_account` = impersonated
account. **Policies always authorize `current_account`.** Logging always records
both.

### 2.5 Authorization

- `after_action :verify_authorized` (and verify policy scope on index) in the API base controller.
- A missing `authorize` call **fails the test suite**, not production silently.
- Permission matrix: `SCHEMA_DESIGN.md` §3.1 — policies are written against that table.
- **Every authorized endpoint has a 403 request spec.** Non-negotiable (`F-1`).

### 2.6 Realtime

- All broadcasts go through `Realtime.publish` and flush **after commit**.
- Never broadcast from a model callback for domain events.
- Cable connections must check `credentials_epoch` (and session `jti` revocation) the same way HTTP does.

### 2.7 RSpec conventions

| Spec type | Location | Rule |
| --- | --- | --- |
| Operation | `spec/operations/...` | Success **and** every failure branch |
| Query | `spec/queries/...` | Correctness + N+1 assertion (`n_plus_one_control`) |
| Policy | `spec/policies/...` | Full role matrix |
| Serializer | `spec/serializers/...` | Shape snapshot |
| Request | `spec/requests/...` | Every endpoint; **403 mandatory**; rswag annotations |
| Channel | `spec/channels/...` | Subscribe auth + payload shape |
| Job | `spec/jobs/...` | Retry + idempotency |

**Naming:** describe the behaviour, not the method —  
`describe Messages::Send` / `it "rejects a blank body without attachments"`.

**Factories:** FactoryBot only. No fixtures. No parallel Minitest suite.

**Coverage:** SimpleCov `minimum_coverage line: 100, branch: 100` from the first
commit. Exclusion list is closed — see `MASTER_PLAN.md` §8. Every example must
assert (no expectation-free specs).

### 2.8 Soft-delete (`BR-1`)

Messages are **never hard-deleted** via the API. Unsend sets `deleted_at` and
bumps `revision`. Children (pins, saves, reactions, attachments) survive.

**There is no sanctioned exception.** Disappearing-message purge (NR-16) was cut
in Step 5. Do not add a hard-delete path for "ephemeral" messages.

### 2.9 Naming — forbidden legacy names

Use the `SCHEMA_DESIGN.md` §9 map. These old names must **not** appear in new code:

`chats`, `chat_participants`, `identities`, `message_seq`, `change_seq`,
`client_id` (use `client_nonce`), `parent_id` (use `reply_to_message_id`),
`users.token`, `session_version`, `starred_messages`, `storage_ledgers`,
`login_credentials` (split), `is_forwarded`, `messages.status`, `chat_type`,
`broadcast` (conversation kind is `channel`).

---

## §3 Frontend (React + TypeScript) standards

### 3.1 Feature-based folders

```
frontend/src/
  app/                 providers, router, shell, error boundaries
  features/
    auth/
    conversations/
    messages/
    composer/
    calls/
    bots/
    media/
    settings/
    admin/
    search/
      api/             TanStack Query hooks — the only place fetch happens
      components/
      hooks/
      store/           Zustand — client-only state
      model/           types, mappers, pure logic
  shared/
    ui/                design-system primitives (shadcn) — only place for raw <button>
    lib/               generated API client, cable, db, outbox, i18n
    hooks/
  styles/              tokens, base, motion
```

Cross-feature imports go through `shared/` or an explicit feature `index.ts`.

### 3.2 Server state vs client state

| Kind | Owner | Examples |
| --- | --- | --- |
| Server state | TanStack Query | conversations, messages, profiles, settings, bots |
| Client state | Zustand (per feature) | reply target, edit draft, panel stack, call UI |
| Ephemeral UI | React local state | hover, focus, open/closed |
| Durable offline | IndexedDB | message cache, outbox, drafts — **namespaced by `account_id`** |

**Rules:**

- No server entity is ever copied into Zustand.
- Realtime events write to the **query cache**, not a store.
- Optimistic updates use `onMutate` / `onError` / `onSettled`.
- Message history is `useInfiniteQuery` with cursor pagination.

### 3.3 Component naming

- Primitives: `Button`, `Input`, … in `shared/ui/`.
- Feature components: domain noun + role — `MessageBubble`, `ChatListItem`, `Composer`.
- Hooks: `use` + behaviour — `useLayer`, `useConversationChannel`.
- Files match the default export name.

### 3.4 Design tokens

- Components may only use **semantic** tokens (`DESIGN_SYSTEM.md` §3).
- **No** raw `<button>` outside `shared/ui/` (ESLint).
- **No** hex / `rgb()` / `hsl()` outside the token file (ESLint).
- **No** magic z-index literals — use `--z-*` scale.
- Typography sliders store −5…+5; CSS is derived only in `deriveTypography()` (NR-13).
- Personalisation overrides **token values**, never component variants (DS-8).

### 3.5 Strings and i18n

Every user-facing string goes through `t('key')` / the string catalog. Hardcoded
UI copy fails the build. Interpolation and plurals via i18next.

### 3.6 Formatting (DS-6 / NR-18)

One restricted set for **humans and bots, sent and received**:

Bold, italic, strikethrough, inline code, fenced code blocks, lists, blockquotes,
spoilers (`||…||`), links, mentions, emoji.

**Not** supported: headings, tables, images, raw HTML. Out-of-set markup renders
literally.

### 3.7 Calls and push (PWA)

- Incoming calls: **Web Push + Service Worker** notification → click opens a
  deep link into the app (no native wrapper).
- WebRTC signaling stays on `SignalingChannel`; mesh cap 4 humans.
- No Capacitor/React Native in this roadmap.

### 3.8 Vitest conventions

- Co-locate or mirror under `features/...` / `__tests__/`.
- Testing Library for components; no enzyme.
- Mock the generated API client / MSW typed from OpenAPI — not hand-rolled fetch.
- Coverage gate: lines / branches / functions / statements all **100%**.
- Playwright owns critical flows; do not duplicate full E2E in Vitest.

### 3.9 Explicit non-goals (UI)

Do **not** implement:

- Disappearing messages / timers
- View-once media
- Any ephemeral feature that implies screenshot-proof confidentiality (NR-16 / NR-17)

(DS-12 / NR-16 / NR-17 / NR-F11 — cut in Step 5.)

---

## §4 Migrations, schema, and data

1. Schema changes match `SCHEMA_DESIGN.md` — FKs, CHECKs, partial indexes, `timestamptz`.
2. **Every FK has an explicit `ON DELETE`.** See SCHEMA §13.
3. Enums are **text + CHECK**, not integer enums.
4. Unique business rules are database constraints (e.g. `direct_key`,
   `(conversation_id, client_nonce)`).
5. New preference keys go in the **preferences registry** (JSONB) — no new columns
   on `preferences` for each setting.
6. New tunable constants go in the **Tier 1** `app_settings` registry — no magic
   numbers in operations/models.
7. Adding a column and the model/spec that uses it happens in the **same** PR /
   session — never "migrate now, test later".
8. Denormalized counters get a recompute job in the same change (SCHEMA §10 rule 6).

---

## §5 Tier 1 config (feature flags, constants, copy, colours)

| Category | Store | Read API |
| --- | --- | --- |
| Feature toggles | `feature_flags` | `FeatureFlag.enabled?(:key, account:)` |
| Constants / limits | `app_settings` | `Settings.fetch(:message_edit_window)` |
| User-facing strings | `translation_strings` | `t('…')` |
| Colours | `theme_overrides` | merged in `applyTheme()` |

**Rules:**

- Code-defined defaults; DB overrides; aggressive cache; invalidate on write.
- Unregistered setting/flag keys raise in test and development.
- CI rejects numeric literals in `app/operations`, `app/queries`, `app/policies`,
  `app/models` except `0`, `1`, `-1`, or an annotated disable with reason.
- Frontend bans magic numbers outside token/config modules.
- Build-time exceptions only: PWA manifest name/colours, `index.html` title,
  service-worker precache (SCHEMA §8).

---

## §6 Testing expectations (TDD / definition of done)

1. **Write or update the failing spec first** for behaviour changes when practical;
   never merge behaviour without specs.
2. A phase / session is **not done** until its tests are green — including 403s,
   coverage gate, and the phase's Playwright flow.
3. Run the relevant suite before finalizing:
   - Backend: `bundle exec rspec` on touched files, then full if contract-related.
   - Frontend: `vitest` on touched files; Playwright when the phase lists a flow.
4. After schema changes: migrate + model/request specs in the same session.
5. OpenAPI / generated TS types must stay in sync — drift fails CI.
6. Do not defer tests to "a later pass" (`IMPROVEMENTS.md` anti-pattern).

---

## §7 Privacy rules that must not be "simplified" (R-12)

These look like bugs to a hurried agent. They are product rules. Changing them
requires an explicit decision record, not a drive-by cleanup.

| Rule | Behaviour |
| --- | --- |
| **BR-36** | `last_seen_position` always advances on view; `last_read_position` only when read receipts are on. Turning receipts on does **not** disclose prior private views. |
| **BR-37** | Accent read ticks require **both** parties to have read receipts enabled. |
| **BR-42** | Last-active visibility is **symmetric**. |
| **NR-1** | Blocks: mutual invisibility in search/profiles; no new DMs; **groups unaffected**. |
| **NR-11 / DS-1** | Bot memory is fully shared — UI must disclose ("Remembers what everyone tells it"). |

---

## §8 Strict Agent Rules (non-negotiable)

Copy this checklist mentally at the start of every session:

1. **Always run tests before finalizing** the session's deliverable.
2. **No magic strings** for user-facing copy — use `t()` / catalog keys.
3. **No magic numbers** for limits/windows/thresholds — use Tier 1 `Settings.fetch`.
4. **Always update schema + model + spec together** for structural changes.
5. **Always authorize** — `verify_authorized`; add the 403 request spec in the same change.
6. **Never put business logic in controllers** or assemble JSON outside Alba.
7. **Never copy server entities into Zustand.**
8. **Never hard-delete messages** via the API (`BR-1` absolute).
9. **Never invent API fields** — change goes through rswag → OpenAPI → generated client.
10. **Never edit `legacy/`** from a `rajya` working tree.
11. **Never implement NR-16 (disappearing) or NR-17 (view-once).**
12. **Never add a second HTTP client** beside the generated OpenAPI client.
13. **Never broadcast before commit** — use `Realtime.publish`.
14. **Comments must not assert behaviour a test does not** (`F-33`) — fix the test or delete the comment.
15. **If ambiguous, stop and ask** — do not guess product intent.
16. **Preserve numbered `BR-n` rules** listed in the phase's audit checklist unless the phase documents a deliberate change.
17. **Incoming call UX is PWA Web Push + SW deep link** — do not introduce native wrappers.
18. **Coverage gate stays at 100%** — do not add exclusions without an explicit decision updating `MASTER_PLAN.md` §8.

---

## §9 Session start template

Do **not** paste a long prompt each time. Attach
[`SESSION_STARTER.md`](SESSION_STARTER.md) + this file + `MASTER_PLAN.md`, then
type only the session id (see `SESSION_STARTER.md` for the exact one-liners).

When opening a coding session, the Agent should confirm:

```
Repo: rajya (backend/ + frontend/ + docs/)
Phase / session: P?.?
Docs loaded: SESSION_STARTER + CONVENTIONS + MASTER_PLAN §? + [named slices]
Out of scope this session: …
Tests I will run before done: …
```

---

**End of CONVENTIONS.md.** Updates to this file are themselves a decision —
prefer appending clarified rules over silent reinterpretation.
