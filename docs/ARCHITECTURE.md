# ARCHITECTURE.md — As-built Rajya

> Regenerated in session **13.3** from the running `rajya` tree. This is the
> system that exists, not the planning target. Planning docs stay in `docs/`
> (`TARGET_ARCHITECTURE.md`, `SCHEMA_DESIGN.md`, `MASTER_PLAN.md`). The stale
> Botiverse write-up remains at `legacy/ARCHITECTURE.md` and must not settle a
> behavioural question.

**Product:** Rajya · **Repo:** `rajya` · **URL:** `https://rajya.pages.dev` ·
**Token:** `rajya`

---

## 1. Layout

```
rajya/
  backend/          Rails 8.1 API-only (Ruby 4.0)
  frontend/         React 19 + TypeScript + Vite PWA (Node 22)
  docs/             Planning + this file
  ops/              Backup restore + coturn placeholders
  docker-compose.dev.yml    Postgres, Redis, Mailpit
  docker-compose.yml        Production (Oracle / self-host)
```

Legacy `cognify/` and `botverse/` live **outside** the repo (`../legacy/`).

## 2. Stack

| Layer | Choice |
| --- | --- |
| API | Rails 8.1, Puma, Postgres (`citext`, `pgvector`) |
| Jobs | Solid Queue |
| Cache / Cable | Redis when present; Solid Cache / Solid Cable fallback |
| Auth | JWT (HS256) + `jti` sessions + `credentials_epoch`; Google GIS; password; email OTP; magic link; WebAuthn |
| Authorization | Pundit; `verify_authorized` |
| JSON | Alba serializers |
| Writes | `app/operations/` returning `Result` |
| Reads | `app/queries/` |
| Realtime | ActionCable: `ConversationChannel`, `AccountChannel`, `PresenceChannel`, `SignalingChannel` |
| Push | Web Push (VAPID) |
| Storage | Active Storage → R2 (S3 API) or local |
| AI | `Ai::Provider` chain (Groq → Gemini → Ollama floor) |
| Client | React 19, TanStack Query, Zustand (client-only), i18next, Radix/shadcn |
| Offline | IndexedDB `rajya:{accountId}`, outbox, Background Sync |
| Contract | rswag → OpenAPI → `openapi-typescript` |

## 3. Identity

`users` authenticate. `accounts` participate (humans and bots). Policies and messaging authorize `current_account`. Impersonation: `current_user` is the admin, `current_account` is the target; every mutation is audited first.

## 4. Backend layering

A controller authenticates, authorizes, calls **one** operation, and renders **one** serializer. Domain events broadcast through `Realtime.publish` after commit.

HTTP errors are `{ "error": { "code", "message", "details" } }` with codes from CONVENTIONS.md §2.3.

## 5. Messaging and sync

Conversations are `direct`, `group`, or `channel`. Positions and revisions are allocated with `UPDATE … RETURNING`. Idempotent send uses `(conversation_id, client_nonce)`. Unsend is a tombstone (`deleted_at`). Catch-up uses `after_revision` and includes tombstones and reactions.

Read state: `last_seen_position` always; `last_read_position` only with receipts on (`receipt_marks.from_position` so enabling receipts does not disclose prior private views). Ticks are computed; there is no `messages.status`.

## 6. Frontend

Feature folders under `frontend/src/features/`. Server state is TanStack Query only. Route-level code splitting for settings, admin, calls, picker, bot builder, and the map. The message thread is `GroupedVirtuoso`. Incoming calls: Web Push + service-worker deep link (`?account=`).

## 7. Runtime configuration (Tier 1)

| Category | Store |
| --- | --- |
| Feature toggles | `feature_flags` |
| Constants | `app_settings` via `Settings.fetch` |
| Strings | `translation_strings` + catalog |
| Colours | `theme_overrides` merged in `applyTheme()` |

Admin editors live in the same PWA, gated by `users.is_admin`.

## 8. Hosting

Local: Compose deps + `bin/dev`. Production: Oracle Always Free (or self-host) for the API/worker, Cloudflare Pages for the SPA, Cloudflare Tunnel for the API origin. CSP `connect-src` covers Pages, Tunnel/Cable, R2, OSM, and Tenor.

## 9. Testing

RSpec (100% line and branch, SimpleCov) · Vitest (100% V8) · Playwright for critical flows and axe. The preservation walk is `backend/spec/preservation/walk_spec.rb`.

## 10. Explicit non-goals

NR-16 disappearing messages, NR-17 view-once media, E2EE, stories, live location, chat import, SFU, screenshot detection, command palette. Seams: `docs/PRESERVATION.md`.
