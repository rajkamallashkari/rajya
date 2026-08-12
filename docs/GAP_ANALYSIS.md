# GAP_ANALYSIS.md — Current State → Target State

> **Step 3 of the MASTER_PLAN process.** A domain-by-domain diff between what
> exists today ([`AUDIT_REPORT.md`](AUDIT_REPORT.md)) and what Step 2 designed
> ([`TARGET_ARCHITECTURE.md`](TARGET_ARCHITECTURE.md),
> [`SCHEMA_DESIGN.md`](SCHEMA_DESIGN.md),
> [`DESIGN_SYSTEM.md`](DESIGN_SYSTEM.md), including Step 2.5 consistency fixes).
>
> This is **not** a phased roadmap — that is Step 4. This document answers:
> *what must change, and why?*

**References:** findings `F-n`, business rules `BR-n`, schema problems `P-n`,
new requirements `NR-n` / future `NR-Fn`, decisions `D-n` / `S-n` / `DS-n`.

---

## How to read each domain

| Subsection | Meaning |
| --- | --- |
| **Current** | What the code does today |
| **Target** | What the Step 2 docs specify |
| **Gap** | Concrete changes and why |
| **Preserve** | Edge cases / behaviours that must survive the rebuild |
| **New / future** | `NR-*` that ship in the rebuild; `NR-F*` designed-for but not built yet |

---

## Table of contents

- [§1 Auth & Identity](#1-auth--identity)
- [§2 Messaging](#2-messaging)
- [§3 Media](#3-media)
- [§4 Bots / AI](#4-bots--ai)
- [§5 Calls](#5-calls)
- [§6 Privacy / Settings](#6-privacy--settings)
- [§7 Notifications & Push](#7-notifications--push)
- [§8 Real-time Infrastructure](#8-real-time-infrastructure)
- [§9 Frontend Architecture](#9-frontend-architecture)
- [§10 Design System](#10-design-system)
- [§11 Backend / Platform](#11-backend--platform)
- [§12 Summary matrix](#12-summary-matrix)
- [§13 NR / NR-F coverage checklist](#13-nr--nr-f-coverage-checklist)
- [§14 Open questions for Step 4](#14-open-questions-for-step-4)

---

## §1 Auth & Identity

### Current

- Seven login paths: Google (GIS + legacy redirect), email/password, email OTP,
  magic link, phone/SMS OTP (production deliverer **raises** — AUDIT §1.1),
  WebAuthn passkeys, plus a prod-excluded dev login.
- Passkey App Lock is client-only and does not revoke the JWT.
- Multi-account = multiple JWTs in `localStorage`; server has no session registry.
- Identity model is half-unified: polymorphic `identities` + duplicated
  `users.username` / `identities.username` (`P-1`, `P-2`).
- `login_credentials` stores OTP codes and passkeys in one nullable-heavy table
  (`P-9`).
- `session_version` checked on HTTP, **not** on ActionCable (`F-6`).
- Phone can be set via `PATCH /users/me` without verification (`F-7`).
- Auth endpoints sit outside Rack::Attack throttles (`F-2`).
- Removing the only login method has no guard (`F-8`).
- Account deletion hard-destroys and can fail on FKs (`F-22`).
- OTP codes generated with `rand(10**6)`, not `SecureRandom` (`F-23`).
- OTP request returns `user_not_found`, leaking account existence; password login
  correctly does not (`F-24`).
- Legacy Google redirect returns the JWT **in a query string**, so it lands in
  server logs, browser history, and `Referer` headers (`F-25`).
- No user blocking.

### Target

- `accounts` (participant) + `users` (human auth) + `bots` (AI config) — S-1.
- `verification_codes` (email OTP only) + `passkeys` +
  `phone_verification_requests` (WhatsApp click-to-verify, D-6 / NR-9).
- Phone is a **verified profile/discovery** identity, not a login identity.
- Admin manual phone verify as fallback.
- `credentials_epoch` enforced on HTTP **and** Cable.
- Client-only multi-JWT with per-account IndexedDB/outbox isolation (D-7 /
  TARGET §5.7).
- `blocks` table; mutual invisibility; no new DMs; groups unaffected (NR-1).
- Auth rate limits in Rack::Attack, tunable via `app_settings` (TARGET §4.7).
- Account delete → deactivate; messages persist as “Deleted user” (S-3).
- All verification codes from `SecureRandom`; uniform enumeration-safe responses
  on every auth entry point.
- **Legacy Google server-redirect flow does not ship.** Google GIS
  (`create_from_code`) is the only Google path, and it returns the JWT in a POST
  response body, never a URL.

### Gap

| Change | Why |
| --- | --- |
| Collapse `identities` into `accounts` | End `user_id`/`identity_id` split-brain (`P-1`) |
| Split credentials into purpose-built tables | `P-9`; WhatsApp flow is inbound, not outbound OTP |
| Replace SMS OTP path with WhatsApp click-to-verify + admin manual | SMS/Meta auth templates are not free (NR-9 / D-6); close `F-7` |
| Wire `credentials_epoch` into Cable connect | Close `F-6` |
| Rate-limit `/auth/*` | Close `F-2` |
| Guard last-credential removal | Close `F-8` |
| `SecureRandom` for every code | Close `F-23`; `rand` is seeded and predictable |
| Uniform response whether or not the account exists | Close `F-24`; enumeration parity with the password path |
| Drop the legacy Google redirect entirely | Close `F-25` at the root — no JWT ever travels in a URL |
| Add `blocks` + search/profile/DM gates | NR-1 |
| Formalise multi-account client isolation | Preserve product behaviour; stop cache/outbox leaks across accounts (D-7) |
| Soft-deactivate accounts on delete | S-3; avoid FK explosions (`F-22`) |

**Explicit cut (approved by design):** SMS as a deliverable OTP channel does not
ship. Phone login does not ship. The **legacy Google server-redirect flow does not
ship either** — it existed only to bootstrap the ERB admin panel, which NR-5
replaces with React routes authenticated like any other client. Dropping it is
what actually closes `F-25`; keeping it "just for admin" would preserve the exact
code path that puts a JWT in a URL. Google login remains, via GIS only.

### Preserve

- All working login methods except broken SMS: Google GIS, password, email OTP,
  magic link, passkeys, App Lock UX.
- Onboarding wizard sequence; verified email change via OTP.
- Multi-account add / switch / remove / logout without forcing single-session.
- Username uniqueness and discoverability toggles (moved to preferences).

### New / future

- **Ship:** NR-1 (blocking), NR-9 (WhatsApp verify), S-3 account tombstone
  behaviour.
- **Not in this domain:** NR-F*.

---

## §2 Messaging

### Current

- Chat types: `direct`, `group`, `broadcast`. Rich message actions (AUDIT §1.2).
- Soft delete tombstones (`BR-1`); children survive (`BR-7`); sync includes
  deletes (`BR-30`).
- Three overlapping receipt mechanisms (`BR-35`–`BR-41`); `messages.status` is
  group-misleading (`BR-39`).
- `client_id` indexed but **not unique** — outbox idempotency is a lie (`F-3`,
  `P-4`).
- Nullable `seq` / dual sequence system (`P-4`, AUDIT §2.2).
- Sidebar loads all messages (`F-4`); no denormalized last-message columns.
- DM find-or-create races (`F-13`); invite `max_uses` is a check-then-increment
  with no lock, so concurrent joins overshoot the cap (`F-14` / `BR-58`).
- `GET /invites/:token` is documented as public but has no `skip_before_action`,
  so an unauthenticated invitee gets a 401 instead of a landing page (`BR-59`).
- Policies exist but are mostly uncalled (`F-1`); any member can edit/delete
  others’ messages and remove the owner.
- System event **rendering** exists; **writers do not** (NR-4 / P-10).
- Human typing absent; bot typing only (NR-3).
- Search is `ILIKE` without reliable trigram index (`F-15`, `P-3`).
- Pins: any member can pin (`BR-22`); max 5.
- Folders: `chat_folders` / `chat_folder_entries`.

### Target

- `conversations` with `kind` ∈ `direct|group|channel`; `direct_key` unique;
  `last_message_id` / `last_activity_at`; `next_position` / `next_revision`.
- `messages.position` NOT NULL; unique `(conversation_id, client_nonce)`;
  `reply_to_message_id` with FK; no `messages.status`.
- Watermarks on memberships + `receipt_marks` for exact info-sheet times (NR-2 /
  D-5 / SCHEMA §5).
- Permission matrix SCHEMA §3.1 enforced via Pundit (F-1 fix).
- System events written as `kind=system` messages (NR-4).
- Human typing on `ConversationChannel`, ephemeral (NR-3).
- Generated `tsvector` + GIN for search.
- `conversation_folders` / `conversation_folder_entries`;
  `scheduled_messages.conversation_id`.
- Unsend semantics documented (SCHEMA §4).
- **Archive (NR-14)**: `conversation_memberships.archived_at`, per-account,
  auto-unarchiving on new activity (SCHEMA §3, DESIGN_SYSTEM §5.3).
- Membership lifecycle under soft status made explicit (SCHEMA §3.2) — rejoin,
  empty groups, folder and scheduled-message side effects.

### Gap

| Change | Why |
| --- | --- |
| Rename chats → conversations; broadcast → channel | Naming clarity; persistent one-to-many model |
| Unique `client_nonce` + idempotent send operation | Make outbox correct (`F-3`) |
| NOT NULL `position`; atomic allocator | Ordering cannot be optional (`P-4`) |
| Replace triple receipts with watermarks + `receipt_marks` | Exact ticks at ~1% of rows (NR-2, D-5) |
| Delete `messages.status` | Cannot represent per-recipient state in groups |
| Denormalize sidebar fields + reconciliation job | Kill O(all messages) sidebar (`F-4`) |
| Unique `direct_key` | Structural fix for duplicate DMs (`F-13`) |
| Atomic conditional increment on invite redemption | Close `F-14` — `UPDATE … SET uses_count = uses_count + 1 WHERE id = $1 AND (max_uses IS NULL OR uses_count < max_uses) RETURNING id`; zero rows means the invite is spent. No lock, no race |
| Genuinely unauthenticated invite preview endpoint | Close `BR-59`; returns title, avatar and member count only — never messages |
| Enforce SCHEMA §3.1 (edit/unsend own only; admin remove; etc.) | Close `F-1` without relying on UI |
| Implement system-event writers | NR-4 — UI already expects them |
| Human typing protocol | NR-3 |
| FTS `search_vector` | Replace sequential `ILIKE` (`F-15`) |
| Rename folder tables / FKs | Consistency with conversations |
| Bump `revision` on reactions | Fix silent reaction sync miss (`BR-26`) |

### Preserve

- Edit window (move to `app_settings`, keep default 15 min); edit history.
- Soft-delete / tombstone / reply-to-deleted / pin-of-deleted (`BR-1`, `BR-7`,
  `BR-8`, `BR-23`, `BR-30`).
- Forward copies blob refs; pin max 5; star/save private; schedule CRUD;
  mentions (bot reply only when tagged in groups — `BR-83`); link previews with
  SSRF protection; jumbo emoji; jump-to-message/date; unread divider +
  summarize card; mute durations; invite links + join requests; leave blocked
  if last admin; Saved Messages / self-chat.
- Pin: **any active member** (BR-22) — locked in §3.1.
- **Regenerate (`BR-15`)** — kept, and scoped tighter than today: only a bot
  message, only by the account whose message prompted it. Soft-deletes the old
  reply and creates a new one; the tombstone remains. Re-rolling a
  nondeterministic model output is a standard AI-chat affordance and reuses the
  bot-reply operation wholesale — it is not "asking a person to redo their reply",
  because `BR-3` already makes bot messages non-editable by anyone.
- **Message body rendering** — **symmetric restricted formatting** for humans and
  bots alike (DS-6 / NR-18): bold, italic, strikethrough, inline code, fenced
  code blocks, lists, blockquotes, spoilers, links, mentions, emoji. No headings,
  tables, images or HTML. Fixes the current incoming-formatted / sent-plain bug;
  the earlier "bots get GFM, humans get plain" split is **retired**.

### New / future

- **Ship:** NR-2, NR-3, NR-4, NR-14 (archive).
- **Future seams:** none specific beyond messaging operations remaining callable
  without a human HTTP caller (supports NR-F4 later).

---

## §3 Media

### Current

- Direct browser→R2 presigned uploads; blurhash; variants; voice waveforms;
  galleries; 500 MB per-user quota; multi-bucket R2 routing (Q-6 keep).
- `StorageLedger#decrement!` never called — quotas only grow (`F-5` / `F-16`
  context).
- `ProcessAttachmentJob` swallows errors; video thumbnail writes a
  non-existent field (`F-17`, `F-18`).
- Non-AV media sometimes proxied through Rails (`F-16`).
- Soft-delete does not free storage (`BR-92`).
- **Download authorization is possession of the signed ID** — no per-request
  conversation-membership check, so any signed URL is shareable with anyone
  (`BR-94`).
- Uploads validated by **extension blocklist plus client-declared MIME prefix**;
  no magic-byte sniffing, no malware scanning (`BR-89`).

### Target

- `attachments` with `processing_status` ∈ pending|ready|failed;
  explicit `storage_bucket_id`; documented waveform shape.
- `storage_quotas` (renamed from ledgers) with `recomputed_at` + reconciliation
  job (principle: every denormalized counter has a recompute path).
- Keep `storage_buckets` + multi-account R2 routing.
- Blurhash → thumbnail → full on the client (DESIGN_SYSTEM / TARGET perf).
- **Membership-checked media access.** Every download resolves the attachment to
  its message and conversation and authorizes through `AttachmentPolicy` before
  issuing a short-lived (5 min) presigned URL. Signed URLs stay short-lived
  precisely because they remain shareable once issued.
- **Magic-byte sniffing on ingest** via Marcel, with the sniffed type — not the
  client's claim — persisted as `attachments.content_type`.

### Gap

| Change | Why |
| --- | --- |
| Add `processing_status` + surface failures in UI | Silent failure today (`F-17`) |
| Rename ledger → quota; call decrement / reconcile | Close permanent drift (`F-5`, `BR-92`) |
| Fix or remove dead thumbnail path | `F-18` |
| Prefer direct R2 URLs; avoid tempfile proxy | `F-16` |
| Bind attachment → bucket explicitly | Reliable attribution for quotas |
| Authorize every media request against conversation membership | Close `BR-94`. Step 2 makes enforced authorization the headline fix (`F-1` / Q-4); leaving media on possession-based access would be the one door left open |
| Sniff MIME on ingest; shorten URL TTL to 5 min | `BR-89`. Malware scanning stays **out of scope** — no free scanner exists at this budget, and it is honest to say so rather than imply coverage |

### Preserve

- Presigned direct upload; blurhash; album grid; lightbox; per-chat media
  galleries; voice waveforms; orphan blob cleanup; bucket health monitoring;
  500 MB default quota (tunable later via admin).

### New / future

- **Ship:** processing failure visibility; quota honesty.
- **Future:** NR-F2/NR-F3 consume the same attachment pipeline (no schema fork
  now).

---

## §4 Bots / AI

### Current

- Seeded + user-created bots; Bot Builder with admin approval; streaming
  ActionCable replies; cancel; conversation `context_summary`; rewrite /
  suggest / translate / summarize; style profile without consent (`F-11`).
- Single global model / env; no usage accounting (`F-12`); no shared memory
  (context is per-chat only).
- Fat `AiController` (~604 LOC) with inline prompts.
- Reply-target (`parent_id`) awareness unverified (NR-12).

### Target

- `Ai::Provider` interface with `stream_chat` / `chat` / `embed` /
  `generate_image` / `tools` / `images` (seams for NR-F2–F4).
- Model registry per capability + fallbacks (NR-8); **Groq-first** free
  inference (D-3); Ollama as floor for embeddings / fallback; OpenRouter demoted.
- Prompts in `prompt_templates` (admin-editable).
- `bot_memories` + pgvector; fully shared across users (NR-11); provenance
  columns unused for filtering today.
- Style profile in `preferences.data.ai.style_profile` with explicit opt-in
  (TARGET §6.6a; closes F-11).
- Reply-quoted context in bot prompts (NR-12).
- `ai_usage_events` for every attempt.
- NR-F1–F4: design seams only; **no `agent_tasks` table yet**.

### Gap

| Change | Why |
| --- | --- |
| Extract provider + capability operations | End god controller; enable multi-provider |
| Admin model registry + usage events | NR-8; cost/loop visibility (`F-12`) |
| DB prompt templates | Prompt iteration without deploys (Q-14) |
| `bot_memories` + retrieval in reply path | NR-11 product requirement |
| Consent gate + prefs blob for style profile | Close `F-11`; enable NR-F1 later |
| Pass reply_to into prompt assembly | NR-12 |
| Wire Groq-first registry + Ollama floor for embed / fallback | D-3; $0 quotas + local privacy for embeddings |
| Leave `tools`/`images`/`generate_image` on interface unused | Additive path for NR-F2–F4 |
| Do **not** build `agent_tasks` | Avoid speculative schema (TARGET §9) |

### Preserve

- Predefined + user bots; Bot Builder approval flow; streaming + cancel;
  **regenerate (`BR-15`)**; rolling context summary; rewrite / suggest /
  translate / summarize; group bots reply only when mentioned (`BR-83`); no
  bot-to-bot cascade; bots excluded from calls by policy; idempotent bot replies
  via a synthetic nonce (`BR-76`); partial text persisted on cancel (`BR-77`).
- **Bot personas are a content deliverable, not a port.** The ~30 seeded
  personalities in the legacy `db/seeds.rb` were never inventoried and are
  **deliberately not carried over** — fresh personas are written during the Bots
  phase. The *mechanism* (system bots with `owner_account_id IS NULL`, `BR-82`) is
  preserved; the copy is not.

### New / future

| ID | Treatment in rebuild |
| --- | --- |
| **NR-8, NR-11, NR-12** | **Ship** |
| **NR-F1** Replica bot | Seam: style_profile blob → future bot `persona_prompt`; **don’t build** |
| **NR-F2** Vision | Seam: `images:` on provider; **don’t build** |
| **NR-F3** Image gen | Seam: `generate_image` + attachment pipeline; **don’t build** |
| **NR-F4** Proactive agent | Seam: operations without human caller; deferred `agent_tasks`; **don’t build** |

**UI obligation (DS-1):** disclose that bot memory is shared (“Remembers what
everyone tells it” + first-message notice).

---

## §5 Calls

### Current

- WebRTC audio/video; group calls ≤4 mesh; full client engine; signaling via
  ActionCable; `CallLifecycleService` state machine; system-message call
  history UI; STUN/TURN (Metered or coturn); stuck-call recovery.
- `call_participants.user_id` (bots cannot participate at schema level of
  other tables’ split — calls already human-oriented).
- Elegant partial unique index: one live call per participant.
- **No ICE restart** (`F-32` / `BR-70`): a peer connection that fails is torn down,
  not recovered. A brief network change ends the call rather than reconnecting it.
- If the initiator’s WebSocket drops mid-ring, nothing cleans up — the call sits
  ringing until the 45 s sweep (`BR-66`).

### Target

- `calls` / `call_participants` renamed and pointed at `accounts`.
- Keep one-live-call partial unique index.
- Bots excluded by **policy**, not schema CHECK.
- `SignalingChannel` remains WebRTC-only.
- Call UI at `--z-call-overlay`; PiP; incoming above modals (DESIGN_SYSTEM).
- **ICE restart on `iceconnectionstate = failed`**, bounded retries, then a clean
  "call dropped" end state instead of a silent teardown.
- `unsubscribed` on `SignalingChannel` cancels a call the initiator is still
  ringing, rather than waiting for the sweep.

### Gap

| Change | Why |
| --- | --- |
| Rename session tables; `account_id` FKs | Consistency with identity model |
| Text enums → CHECK enums | SCHEMA policy |
| Ensure call system events are written | Align with NR-4 writers |
| Keep lifecycle service shape as an Operation | Already closest to target layering |
| Add ICE restart with bounded retries | Close `F-32`; a mobile network handover currently kills the call |
| Cancel on initiator disconnect during ring | Close `BR-66`; removes a 45 s phantom-ringing window |

### Preserve

- Full call UX and state transitions (AUDIT §1.6, §2.6); 4-party mesh limit;
  busy/timeout/decline; mute/camera/speaker; history bubbles; TURN config
  flexibility under $0 (self-hosted coturn on Oracle box preferred over paid
  Metered when possible).

### New / future

- None beyond shared system-event and design-system work.

---

## §6 Privacy / Settings

### Current

- Privacy booleans on `users` (`P-8`); `user_settings` wide table (`P-7`);
  separate `notification_preferences` with cascade merge (`BR-98`). The
  notification *delivery* half of this lives in [§7](#7-notifications--push);
  this section covers only where the preferences are stored.
- Typography: dual/legacy columns; sliders broken (Q-18 / NR-13).
- Feature flags YAML with many dead flags (Q-15 → drop as YAML).
- ERB admin: transcripts, bots, accents, fonts; XSS + no CSRF (`F-10`).
- No blocking; no impersonation; no runtime string catalog; no in-app admin.
- Hardcoded copy everywhere; no i18n.

### Target

- Single `preferences` JSONB document per account with validated registry
  (appearance including theme=`system` + density, privacy discoverability,
  chat, ai including style_profile, notifications).
- Typography: store −5…+5 slider positions; derive CSS in one function (NR-13 /
  DESIGN_SYSTEM §3.5).
- `app_settings` + `translation_strings` + `prompt_templates` (NR-6).
- In-app React admin (NR-5); unrestricted impersonation + `audit_events`
  (NR-7 / D-2).
- `blocks` (NR-1).
- String catalog + i18next; lint bans hardcoded user-facing strings.

### Gap

| Change | Why |
| --- | --- |
| Fold settings + notification prefs + privacy flags into `preferences` | `P-7`, `P-8`; migration-free growth |
| Fix typography model | NR-13 |
| Replace ERB admin with React admin | NR-5; close XSS/CSRF admin surface (`F-10`) while keeping intentional god-mode |
| Runtime config + string catalog | NR-6; Q-14 “every string” |
| Impersonation tokens + banner + audit log | NR-7 |
| Theme default `system` | DS-2 |
| Density preference | DS-5 |

### Preserve

- All settings panels’ *capabilities* (privacy, theme/split accents, fonts,
  date/time formats, quick reactions, security/passkeys/App Lock,
  notification levels including per-chat, AI toggles, profile edit).
- Admin ability to read any conversation (intentional, Q-14) — rebuilt safely
  in React with audit trail, not raw `html_safe`.

### New / future

- **Ship:** NR-1, NR-5, NR-6, NR-7, NR-13.
- Feature-flag YAML **retired**; toggles live in `app_settings` (Q-15 judgment).

---

## §7 Notifications & Push

> **Added in Step 3.1.** Notification delivery had no domain section: it was
> partly folded into Privacy/Settings as "notification levels", partly into
> Real-time as "fanout". Two findings (`F-9`, `F-21`) and eight business rules
> (`BR-98`–`BR-105`) had no target treatment as a result. It is a delivery
> pipeline with its own preference model, its own failure modes, and its own
> phase — not a settings panel.

### Current

- Web Push only (no APNs/FCM); TTL 24 h; expired subscriptions deleted on
  410-equivalent errors (`BR-103`).
- Multi-account routing on a shared browser endpoint: title prefixed
  `[@username]` (`BR-104`).
- Preference resolution is a **four-scope cascade** —
  `SYSTEM_DEFAULTS ← global ← type (dm/group/broadcast) ← chat:<id>` — merged as
  hashes (`BR-98`), over a fixed eight-key whitelist: `level`, `show_preview`,
  `sound`, `vibration`, `dnd_enabled`, `dnd_start`, `dnd_end`, `dnd_days`
  (`BR-99`).
- `level` is `all` | `mentions` | `none`.
- **`F-9` (High): "mentions only" suppresses mentions.** The enqueue path never
  passes `message_id`, so the evaluator inspects an empty message, finds no
  mention, and drops the push. Setting a group to "mentions only" silences it
  completely — the one setting that is strictly worse than useless, because the
  user believes they are still reachable.
- **`F-21`: Do Not Disturb evaluates in the server’s timezone**, not the user’s,
  despite a comment claiming otherwise (`BR-100`). There is no timezone stored
  for a user anywhere.
- Mute (`chat_participants.muted_until`) is checked twice — at enqueue and again
  in the job (`BR-101`).
- Broadcast chats never push (`BR-105`).
- Fanout is one job per recipient, unbatched (`F-19`).

### Target

- `notifications` namespace inside the single `preferences` document (SCHEMA §7),
  preserving **all four scopes** and all eight keys — the cascade becomes a pure
  function over one JSONB document instead of a merge across three tables.
- Scope keys: `defaults` (code-defined, never stored) → `global` →
  `kind:direct` | `kind:group` | `kind:channel` → `conversation:<id>`.
- `locale.timezone` added to preferences (IANA name, captured from the browser at
  onboarding and editable). DND evaluates in it.
- `Notifications::Resolve` operation returns the effective settings for
  `(account, conversation, message)` — **taking the message**, so mention
  detection is structurally available rather than accidentally omitted.
- `DeliveryChannel` interface with `WebPush` as the only implementation
  (TARGET §9); email or native push become adapters, not rewrites.
- Batched fanout: recipients resolved in one query, pushes enqueued as one job
  with a recipient list.
- Delivery acknowledgement from the push service advances
  `last_delivered_position` (SCHEMA §5, condition 3) — this is the seam where
  notifications and the NR-2 tick model meet.

### Gap

| Change | Why |
| --- | --- |
| Pass `message_id` into the resolver; make it a required argument | Close `F-9`. Typing the resolver so it *cannot* be called without the message is the actual fix; passing it once is just today’s bug not happening yet |
| Store `locale.timezone`; evaluate DND in it | Close `F-21`. A DND window is meaningless in a timezone the user does not live in |
| Fold four preference scopes into one document | `P-7`, `BR-98` — same cascade, one row read, testable as a pure function |
| Keep all eight whitelist keys | `BR-99`; the audit’s whitelist is the contract, not a starting point |
| Batch fanout | `F-19` |
| Single mute check inside the resolver | `BR-101` — two checks is two chances to disagree |
| Wire push acceptance to delivered watermark | NR-2 correctness: "delivered even if muted" (Q-5) needs a delivery signal that is independent of whether it made a sound |

### Preserve

- Web Push with VAPID; multi-account `[@username]` prefixing (`BR-104`);
  subscription cleanup on 410 (`BR-103`); 24 h TTL; per-conversation overrides;
  DND with time window **and day-of-week selection**; `all`/`mentions`/`none`
  levels; preview/sound/vibration toggles; channels never push (`BR-105`);
  mute honoured (`BR-101`).

### New / future

- **Ship:** `F-9` and `F-21` fixes, timezone-aware DND, batched fanout.
- **Future:** additional `DeliveryChannel` adapters (email digest, native push if
  a Capacitor wrapper ever happens — TARGET §2 rejected list). Interface only, no
  implementation.

---

## §8 Real-time Infrastructure

### Current

- ActionCable + **Solid Cable** (Postgres poll ~100 ms); Solid Queue inside
  Puma on Render free; Solid Cache.
- Channels: Chat, User, Presence (unused broadcast), Signaling.
- Broadcasts not consistently after_commit; per-participant fanout queries
  (`F-19`).
- No human typing; bot typing only.
- JWT on Cable query string; no epoch check (`F-6`).
- Render sleep drops every socket (hosting problem).

### Target

- Oracle Always Free (D-1); Docker Compose; Redis cable/cache when available,
  Solid fallbacks for portability.
- Solid Queue as **separate worker process**.
- Channels: `ConversationChannel`, `AccountChannel`, `PresenceChannel`
  (**kept**, D-8), `SignalingChannel`.
- `Realtime.publish` after_commit; batched fanout.
- Human typing via cache TTL (NR-3).
- Presence counters + privacy-gated broadcasts.

### Gap

| Change | Why |
| --- | --- |
| Move hosting to Oracle (or self-host fallback) | Always-on WebSockets; Redis; worker; disk (D-1) |
| Swappable Redis/Solid adapters | Portability if free-tier terms change |
| Separate worker | Jobs must not compete with Puma request threads |
| Rename/clarify channels; implement Presence | D-8; end dead channel |
| after_commit + batch fanout | Correctness + `F-19` |
| Typing + presence protocols | NR-3; online UX |
| Epoch check on connect | `F-6` |

### Preserve

- ActionCable as the app-facing API (not a separate Node realtime service).
- Signaling opacity for WebRTC (relay, authorize participants).
- Client reconnect + revision catch-up (extend to reactions).

### New / future

- **Ship:** NR-3, NR-10 health endpoints used by host supervision.
- No separate realtime microservice (rejected at this scale).

---

## §9 Frontend Architecture

### Current

- React 19 + TS + Vite + Zustand (no React Query); ~30k LOC.
- God stores: `chatStore` ~2198 LOC; hand-rolled API client ~1406 LOC.
- Offline: IndexedDB cache, outbox, Background Sync — good, but depends on
  broken server idempotency (`F-3`).
- Layer-stack navigation (Q-20 essential).
- Multi-account JWTs without strict store namespacing documented.
- ~291 hand-rolled buttons (`F-30`); scattered z-index; Vitest only, no
  Playwright.
- Silent drops of some Cable events (AUDIT realtime notes).
- **No `ErrorBoundary` anywhere in the React tree** (`F-27`) — a single render
  error blanks the entire app with no recovery path.

### Target

- Feature modules under `src/features/*`; TanStack Query for server state;
  Zustand only for client UI state.
- Realtime → typed event router → `queryClient.setQueryData`.
- Generated OpenAPI TS client (`openapi-fetch`).
- Keep virtuoso, outbox, IDB — with per-account namespacing (D-7); single-flight
  send lock.
- `useLayer` primitive + Playwright back-button contract.
- Route-level code splitting; lint against whole-store subscriptions.
- Error boundaries at three levels — app shell, route, and message list — so a
  malformed message cannot take down the conversation, and a broken route cannot
  take down the app (`F-27`).

### Gap

| Change | Why |
| --- | --- |
| Introduce TanStack Query; gut `chatStore` server entities | End hand-rolled cache bugs |
| OpenAPI-generated client | Contract fails the build, not production |
| Typed Cable event union | Prevent silently dropped events |
| Namespace offline stores by account | Multi-account correctness (D-7) |
| Formalise layer navigation + tests | Q-20; prevent regression |
| Playwright critical flows | Biggest testing gap today |
| i18n/`t()` everywhere | String catalog requirement |
| Layered error boundaries | Close `F-27`; blast radius of a render error becomes one component, not the app |

### Preserve

- PWA installability; service worker caching; web push multi-account routing;
  outbox states queued→sending→failed; Background Sync; jump/search UX;
  composer drafts in IDB; call engine behaviour; Bot Builder UI capabilities.

### New / future

- Frontend surfaces for NR-1 block lists, NR-2 ticks, NR-3 typing bubble,
  NR-4 system lines, NR-5 admin routes, NR-9 WhatsApp verify button,
  DS-1 bot disclosure.

---

## §10 Design System

### Current

- Tailwind v4 + semantic CSS variables + `html.dark` (correctly avoiding
  broken `dark:` variant).
- Accent via single CSS var + `color-mix()` — keep.
- Telegram-derived dark palette — keep intent.
- No spacing/radius/z/motion scales; ~291 raw buttons; typography pipeline
  broken; no shadcn.

### Target

- Token layers (primitive → semantic → component → runtime).
- shadcn/ui + Radix (DS-3); ESLint bans raw `<button>`, hex, z literals,
  hardcoded strings.
- Named elevation, motion, z-index scales.
- Message surfaces: grouping, tails (DS-4), NR-2 ticks, NR-3 typing bubble,
  NR-4 system messages, long-press + haptics.
- Theme default `system` (DS-2); density comfortable/compact (DS-5).
- Impersonation warning bar; WhatsApp verify waiting state.

### Gap

| Change | Why |
| --- | --- |
| Adopt token architecture + shadcn primitives | Premium + AI-agent-friendly; kill `F-30` |
| Rebuild MessageBubble / Composer / ChatListItem first | Highest-impact surfaces |
| Implement tick/typing/system visual contracts | NR-2, NR-3, NR-4 made tangible |
| Bot memory disclosure UI | DS-1 / NR-11 honesty |
| `applyTheme` single entry + FOUC script | Prevent theme flash; slider sync |

### Preserve

- Semantic CSS variable approach; `color-mix` accent derivation; split
  light/dark accents; font catalog from server; mobile-first density intent.

### New / future

- Visual language for future AI actions (single “AI” affordance) — ships with
  existing rewrite/suggest/translate regrouping; NR-F* UIs later.

---

## §11 Backend / Platform

### Current

- Rails 8.1 API; fat models/controllers; 19 uneven services; 0 serializers;
  Pundit mostly unused (`F-1`).
- JSON assembled ad hoc (`Chat.send(:message_payload, …)`).
- No OpenAPI; no `/up` or `/health` (NR-10).
- Dual test suites (RSpec + aging Minitest); no coverage gate; no request-spec
  403 discipline.
- Deploy: Render free, jobs in Puma (`SOLID_QUEUE_IN_PUMA`).
- `feature_flags.yml` largely historical.
- **Content Security Policy and Permissions Policy initializers are both
  commented out** (`F-31`) — no CSP, and no gate on camera/microphone/geolocation
  in an app that requests camera and microphone.
- Comments contradict code in at least four places (`F-33`): a Rack::Attack
  throttle documented as "Redis" is Solid Cache, `PersistLastSeenJob`’s claimed
  30-second uniqueness window does not exist, a heartbeat comment misattributes
  expiry, and `MOCK_AI` is documented on `AiService` but implemented elsewhere.

### Target

- Layers: controllers → operations → models; queries; Alba serializers;
  enforced Pundit; jobs thin.
- Result-based errors → stable HTTP taxonomy; messages via string catalog.
- rswag → OpenAPI → TS types.
- `GET /up` + `GET /health` (NR-10).
- SimpleCov gate; mandatory 403 tests; Playwright in CI; GitHub Actions.
- Oracle + Docker Compose + separate worker (D-1).
- Runtime `app_settings` replaces YAML flags.
- **CSP enabled and enforced**, plus a Permissions Policy that grants only
  `camera`/`microphone`/`display-capture` to self (calls need them; nothing else
  does). Both verified by request spec on header presence.
- A `CONVENTIONS.md` rule that a comment asserting a behaviour must be covered by
  a test asserting the same behaviour, or deleted (`F-33`).

### Gap

| Change | Why |
| --- | --- |
| Operations / queries / Alba / verify_authorized | Testability + close `F-1` |
| OpenAPI contract pipeline | Highest-leverage stack change for AI-assisted rebuild |
| Health endpoints | Host supervision (NR-10) |
| Drop parallel Minitest; enforce coverage | Confidence in rebuild |
| New deploy topology | Always-on + Redis + worker |
| Retire feature_flags.yml | NR-6 / Q-15 |
| Turn CSP + Permissions Policy on | Close `F-31`; a chat app taking camera/mic input with neither header is the gap most likely to matter first |
| Comment-or-test rule in CONVENTIONS | Close `F-33`; stale comments actively misled this audit |

### Preserve

- Rails + Postgres + Active Storage + Solid Queue (as technology choices).
- Validated business logic currently trapped in services like
  `CallLifecycleService` / membership — re-home into operations, don’t invent
  from scratch.

### New / future

- **Ship:** NR-10.
- Platform must not block NR-F4 later (operations reusable from jobs/agents).

---

## §12 Summary matrix

Relative **gap size** (work to close Current→Target) and **risk** (chance of
regressing tribal BR behaviour or shipping broken realtime/auth). For Step 4
sequencing only — not calendar estimates.

| Domain | Gap size | Risk | Notes |
| --- | --- | --- | --- |
| Auth & Identity | **L** | **High** | Identity split + phone path + epoch/Cable; easy to break login |
| Messaging | **XL** | **High** | Core product; receipts, idempotency, RBAC, sequences |
| Media | **M** | **Medium** | Quota honesty + processing status; R2 multi-bucket kept |
| Bots / AI | **XL** | **High** | Memory, providers, consent; NR-F seams must stay clean |
| Calls | **S** | **Medium** | Mostly rename/policy; WebRTC client already complex |
| Privacy / Settings | **L** | **Medium** | Preferences + string catalog invasive but mechanical |
| Notifications & Push | **M** | **Medium** | Cascade is mechanical; `F-9`/`F-21` are silent-failure bugs, so correctness is test-shaped, not design-shaped |
| Real-time Infrastructure | **L** | **High** | Hosting move + adapter swap + presence/typing |
| Frontend Architecture | **XL** | **High** | chatStore → Query; offline+multi-account isolation |
| Design System | **L** | **Low–Med** | Visible early; lower data-loss risk |
| Backend / Platform | **L** | **Medium** | Foundation for everything; OpenAPI+ops layering |

**Largest coupled risks:** Messaging ↔ Real-time ↔ Frontend (send/receipts/
outbox). Auth ↔ Real-time (epoch on Cable). Bots ↔ Schema (`bot_memories`,
prefs). Notifications ↔ Messaging (push acceptance is one of the three signals
that advance the delivered watermark, so a notification bug becomes a *tick* bug).
Admin/string catalog ↔ every UI surface (sequencing constraint from AUDIT §9).

---

## §13 NR / NR-F coverage checklist

Every item from AUDIT §9 “must add” / “explicitly future” appears below.

### Ship in rebuild (NR-*)

| ID | Domain section(s) | Target anchor |
| --- | --- | --- |
| NR-1 Blocking | §1 Auth, §6 Privacy | SCHEMA `blocks`; §3.1 invariants |
| NR-2 Delivery ticks | §2 Messaging, §7 Notifications, §10 Design | SCHEMA §5; DESIGN_SYSTEM §5.1 |
| NR-3 Human typing | §2, §8, §10 | TARGET §3 Typing; DESIGN_SYSTEM TypingBubble |
| NR-4 System events | §2, §5, §10 | SCHEMA system_event writers |
| NR-5 In-app admin | §6, §9 | TARGET §7.4 |
| NR-6 Runtime config | §6, §11 | `app_settings` / strings / prompts |
| NR-7 Impersonation | §6 | TARGET §7.3; DESIGN_SYSTEM banner |
| NR-8 AI models per feature | §4 | TARGET §6.3 |
| NR-9 Phone verification | §1 | WhatsApp click-to-verify D-6 |
| NR-10 Health checks | §8, §11 | TARGET §4.9 |
| NR-11 Bot shared memory | §4, §10 | SCHEMA `bot_memories`; DS-1 |
| NR-12 Reply-target AI | §4 | TARGET §6.6 |
| NR-13 Typography sliders | §6, §10 | SCHEMA prefs; DESIGN_SYSTEM §3.5 |
| NR-14 Conversation archive | §2, §6, §10 | SCHEMA `conversation_memberships.archived_at`; DESIGN_SYSTEM §5.3 |

### Feature-breadth additions (NR-15 … NR-48)

Added in Step 4.1 under a directive to make the product as feature-rich as
possible at zero budget. All are specified in `SCHEMA_DESIGN.md` §12 and scheduled
in `MASTER_PLAN.md` §6; listed here so this document remains the complete domain
index.

| ID | Requirement | Domain |
| --- | --- | --- |
| NR-15 | Polls with multiple-choice, anonymity and close | §2 Messaging |
| ~~NR-16~~ | ~~Disappearing messages~~ | **Cut** — see §14 |
| ~~NR-17~~ | ~~View-once media~~ | **Cut** — see §14 |
| NR-18 | Symmetric basic text formatting + spoilers | §10 Design System |
| NR-19 | Message permalinks / deep links | §2 Messaging |
| NR-20 | Multi-select with bulk actions | §2 Messaging |
| NR-21 | Pinned conversations in the sidebar | §2 Messaging |
| NR-22 | Mark as unread | §2 Messaging |
| NR-23 | Silent send (no push, still delivered) | §2, §7 |
| NR-24 | Message reminders | §2, §7 |
| NR-25 | Saved replies | §2 Messaging |
| NR-26 | Recurring scheduled messages | §2 Messaging |
| NR-27 | Reaction details sheet | §2, §10 |
| NR-28 | Sticker packs and custom emoji | §3 Media |
| NR-29 | GIF search (Tenor free tier) | §3 Media |
| NR-30 | Static location sharing | §3 Media |
| NR-31 | Contact / vCard sharing | §3 Media |
| NR-32 | Chat export | §6 Privacy / Settings |
| NR-33 | Voice-note transcription (flagged, **on by default**) | §3, §4 |
| NR-34 | Granular group permission overrides | §2 Messaging |
| NR-35 | `@everyone` / `@admins` mentions | §2 Messaging |
| NR-36 | Channel slow mode | §2 Messaging |
| NR-37 | Forwarding restrictions | §2 Messaging |
| NR-38 | QR codes for invites and profiles | §2 Messaging |
| NR-39 | Report + admin moderation queue | §6, §11 |
| NR-40 | Granular activity status (recording, uploading) | §8 Real-time |
| NR-41 | Per-contact nicknames | §6 Privacy / Settings |
| NR-42 | Per-conversation wallpapers | §6, §10 |
| NR-43 | Advanced search filters | §2 Messaging |
| NR-44 | Active session / device management | §1 Auth |
| NR-45 | Slash commands | §4 Bots / AI |
| NR-46 | Minimal desktop keyboard shortcuts | §9 Frontend |
| NR-47 | Screen sharing in 1:1 calls | §5 Calls |
| NR-48 | Admin-editable semantic colour tokens | §10, §11 |

### Design-for, do not build yet (NR-F*)

| ID | Domain | Seam documented |
| --- | --- | --- |
| NR-F1 Replica bot | §4 | `preferences.data.ai.style_profile` → future bot persona |
| NR-F2 Image understanding | §3, §4 | Provider `images:`; attachment metadata |
| NR-F3 Image generation | §3, §4 | `generate_image` → attachment pipeline |
| NR-F4 Proactive agent | §4, §11 | Operations w/o human caller; deferred `agent_tasks` |
| NR-F5 Slack-style thread views | §2 | `reply_to_message_id` already forms the tree; a thread view is a query and a surface, not a schema change. **Cut by explicit decision** — too much for now |
| NR-F6 Stories / Status | §3 | Would need an ephemeral media pipeline, viewer tracking and a separate surface. Declined at $0: storage is capped at 9.5 GB globally and stories are the highest-churn media type there is. Value is also lowest in a small private network |
| NR-F7 Live location | §3 | `message_locations` holds static points; live sharing needs a session lifecycle and its own privacy model (SCHEMA S-16) |
| NR-F8 Chat import | §6 | `export_jobs` produces a read-only projection; import would write into the §4 ordering invariants (SCHEMA S-23) |
| NR-F9 SFU for calls beyond 4 participants | §5 | `SignalingChannel` relays opaquely, so an SFU replaces the transport without touching the lifecycle. Declined at $0 — a media server does not fit the free instance alongside Postgres, Ollama and coturn |
| NR-F10 End-to-end encryption | §1, §2 | **Declined with reasons**, not deferred for cost. Structurally incompatible with three approved capabilities: server-side AI bots reading message content, server-side full-text search, and the admin transcript access Q-14 requires. Revisiting E2EE means giving up all three |
| NR-F11 Screenshot prevention and detection | §3 | **Impossible in a PWA**; native wrapper (if ever) is the only route. **NR-16 and NR-17 are cut entirely** — not shipped with caveats |
| NR-F12 Command palette | §9 | Deferred as mobile-first: a palette is a desktop-power-user affordance. A minimal shortcut set ships as NR-46 instead |

---

## §14 Open questions for Step 4

None that block writing the gap analysis. Items already resolved in Step 2.5
(D-3, D-7, D-8, DS-1…5, S-3, S-5–S-7) are treated as target truth here.

**Inputs Step 4 must decide (process, not product):**

1. Greenfield twin repos vs in-place transformation (MASTER_PLAN_PROMPT Step 4.4).
2. Phase order that shows premium UI early without lying about backend
   foundations (string catalog + tokens early; receipts/idempotency before
   trusting offline).
3. How to slice AI-agent sessions per domain using this file + AUDIT excerpts.

**Feature cuts, complete list.** Every one is a deliberate, stated decision:

1. **SMS as a deliverable OTP channel**, and **phone as a login identity** —
   replaced by WhatsApp click-to-verify (D-6) plus existing email / passkey /
   Google login.
2. **The legacy Google server-redirect flow** — it existed to bootstrap the ERB
   admin, which NR-5 replaces. Dropping it is what closes `F-25`.
3. **The ~30 seeded bot personalities** — the mechanism survives, the copy does
   not. Fresh personas are authored during the Bots phase.
4. **Leaving a direct conversation** — never actually offered today either;
   archive (NR-14) and blocking (NR-1) cover the real intents. Recorded as a cut
   because the §3.1 matrix previously implied it existed.
5. **Malware scanning of uploads** — never existed (`BR-89`) and is not added; no
   free scanner meets the $0 constraint. Magic-byte MIME sniffing *is* added.
6. **Disappearing messages (NR-16) and view-once media (NR-17)** — cut in Step 5
   because a PWA cannot prevent or detect screenshots/screen recordings. Shipping
   ephemeral UI would imply confidentiality we cannot provide. Revisit only
   behind a native wrapper, and only after the PWA is already in real use —
   **not on any roadmap now**.

**Capabilities declined rather than cut** (they never existed, and are not being
added): end-to-end encryption (`NR-F10`), Stories/Status (`NR-F6`), Slack-style
threads (`NR-F5`), live location (`NR-F7`), chat import (`NR-F8`), calls beyond
four participants (`NR-F9`), screenshot prevention or detection (`NR-F11`), and a
command palette (`NR-F12`). Each carries its reasoning in the table above. The two
worth restating because a reader may assume otherwise: **E2EE is declined on
grounds of incompatibility, not cost** — it cannot coexist with server-side AI,
server-side search and admin transcript access — and **screenshot detection is
impossible in a PWA**, which is why we cut NR-16/NR-17 rather than ship them with
caveats.

**Additions since the first draft of this document (Step 3.1).** A consistency
pass against `AUDIT_REPORT.md` found material that had been dropped between
Step 1 and Step 3, now restored: findings `F-9`, `F-14`, `F-21`, `F-23`, `F-24`,
the real `F-31` (CSP / Permissions Policy — the ID had been mis-bound to the
typography bug in three documents), `F-32`, `F-33`, and named treatment for
`F-25` and `F-27`; the **§7 Notifications & Push** domain with the full four-scope
cascade; message **regenerate** (`BR-15`); **markdown rendering asymmetry**;
media authorization (`BR-94`) and MIME sniffing (`BR-89`); the membership
lifecycle invariants now in `SCHEMA_DESIGN.md` §3.2; bot-conversation tick
semantics; and **NR-14 archive**.

**Additions in Step 4.1.** Four directives reshaped scope after Step 4 was
written: a single `rajya` monorepo replacing the two-repository plan
(`MASTER_PLAN.md` §1); product name **Rajya** at `rajya.pages.dev`; **NR-15 … NR-48**, thirty-four features drawn from what
mainstream chat applications ship, specified in `SCHEMA_DESIGN.md` §12; maximal
runtime configurability with CI enforcement (`SCHEMA_DESIGN.md` §8); and a **100%
line and branch coverage gate from the first commit** (`MASTER_PLAN.md` §8). DS-6
was reversed in the same pass — message formatting is now the same restricted set
for humans and bots, fixing the current incoming-formatted / sent-plain
inconsistency.

---

**End of Step 3.** Superseded for execution by `MASTER_PLAN.md` (Step 4) and the
Step 5 toolkit (`CONVENTIONS.md`, `READINESS_CHECKLIST.md`). Kept as the
domain-by-domain Current → Target diff.
