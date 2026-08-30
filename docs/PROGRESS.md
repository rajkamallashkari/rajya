# PROGRESS.md — Session state

> **Agent: read this at the start of every session. Update the "Last completed"
> line and "Next session" block at the end of your session before stopping.**
> User: attach this file alongside SESSION_STARTER.md and type `Continue.`

---

## Current state

| Field | Value |
| --- | --- |
| **Last completed** | 3.3 |
| **Next session** | 3.4 |
| **Phase** | P3 — Conversations & messaging core |
| **Sessions remaining in phase** | 3 (3.4–3.6) |

---

## Next session brief (agent: read §5 of MASTER_PLAN.md for the full row)

**Session 3.4 — Polls (NR-15) with the transactional single-choice rule, plus `message_locations` and `message_contacts` as message children (NR-30, NR-31)**

Deliverable: **Polls (NR-15)** with the transactional single-choice rule, plus `message_locations` and `message_contacts` as message children (NR-30, NR-31)

Docs: `SCHEMA §12.1, §12.4, S-12, S-13, S-16`

Legacy to read:
- None — new features. Read `message_attachment.rb` only for the message-child pattern to imitate

---

## Completed sessions

| Session | Deliverable | Notes |
| --- | --- | --- |
| 0.1 | Repo layout, legacy move, Compose, CI stub, brand | — |
| 0.2 | Rails layers, full schema, factories | — |
| 0.3 | OpenAPI pipeline, health endpoints, Tier 1 config stack, CI guards | — |
| 0.4 | Vite scaffold, token layers, applyTheme, deriveTypography, i18next, lint rules, Vitest gate | — |
| 1.1 | Primitives on Radix, `/dev/gallery` | Shared UI kit on Radix; gallery at `/dev/gallery`. Visual values derive from token layers so density/settings can restyle without component variants. |
| 1.2 | Message thread surface: bubble, group, content, ticks, system, dividers | Symmetric DS-6 formatting (sent = received, human = bot); spoilers; jumbo emoji; NR-2 ticks; TypingBubble. |
| 1.3 | Composer, voice UI, long-press, context menu, ChatListItem | **DS-13** three-element row (mic · textarea · send). Send long-press/right-click: attach, schedule, rewrite, silent send. Mic takes over the row for voice. Preview: waveform above the clock, played bars highlighted, `elapsed / total` while playing or after seek. Chips + schedule bar above. Swipe/pin/unread list, lifted bubble + message menu. Presentation only. |
| 1.4 | `useLayer` navigation, error boundaries, list states, MSW, shortcuts | History-backed layer stack (mobile overlay + desktop panels). Scroll kept per layer; buried layers stay mounted and `inert`. List empty/loading/error, impersonation/offline banners, typed MSW `/health`+`/up`. NR-46: Escape, `/`, ArrowUp, Enter. Composer chrome unchanged (**DS-13**). |
| 1.5 | Fourteen new-feature components and DS-8 personalisation | Polls, reaction details, selection toolbar, unified picker (emoji/sticker/GIF/saved-reply tabs), location/contact/transcript, slash menu, wallpaper, QR, report, session list — on mocks. Appearance is token overrides, never component variants. Composer chrome unchanged (**DS-13**). Presentation only. |
| 2.1 | `accounts`/`users`/`bots`, JWT, epoch on HTTP and Cable, Rack::Attack | `current_user` vs `current_account` from JWT. `credentials_epoch` rejects stale tokens on HTTP **and** Cable (F-6). Rack::Attack covers `/auth/*` plus messages/general API; limits from `app_settings` (F-2). Last-active symmetry (BR-42/43) and discoverability flags (BR-45…47) live on Account via preferences. |
| 2.2 | Google GIS, password, OTP, magic link; enumeration and `SecureRandom` fixes | GIS is POST `/auth/google` with the JWT in the body; `GET /google/callback` is not routed (F-25). Password register/login/forgot/reset. Email OTP and magic link. Codes from `SecureRandom` (F-23). Request endpoints return the same accepted body for existing and missing accounts, with dummy bcrypt on the miss path (F-24). |
| 2.3 | Passkeys, App Lock, credential management, last-credential guard | Unauthenticated passkey login plus authenticated register/list/rename/destroy. App Lock overlay (passkey + password) does not mint a JWT. Last-credential guard (S-10 / F-8) spans password, Google, email, and passkeys. Security settings panel and Playwright passkey login wait for P12 / 2.4. |
| 2.4 | Onboarding, multi-account isolation, NR-9 WhatsApp verification, `blocks` | Onboarding: profile → optional password → optional passkey. One active JWT; IndexedDB/outbox namespaced by `account_id` (D-7). WhatsApp click-to-verify (NR-9 / D-6) with sender number as ground truth and admin fallback; poll until Cable (P4.1). `blocks` 404 for mutual profile invisibility (NR-1); DM/search gates wait for P3/P8. Playwright isolation at `/dev/accounts`. |
| 2.5 | `sessions` with per-token `jti` (NR-44), device list, nicknames (NR-41) | Each login persists a `sessions` row and embeds `jti`. Individual and bulk revoke; revoked-`jti` cache fails closed. `credentials_epoch` still signs out every device (S-20). Contact nicknames are owner-private and never appear on Account/Me/Session/Block payloads (S-22). Device/nickname settings panels wait for P12.3. |
| 3.1 | Conversations, memberships, the §3.1 permission matrix in Pundit | Unique `direct_key` closes the DM race (F-13). Sidebar reads denormalized `last_message_id` / `last_activity_at` with a reconcile job (F-4). Pundit enforces SCHEMA §3.1; generated policy spec covers every cell; 403s on conversation HTTP. NR-1 blocks new DMs with 404. Add/remove/leave mutations wait for 6.1; send/edit/pin 403s wait for 3.2. |
| 3.2 | Position/revision allocators, idempotent send, edit, unsend, forward, react, pin, save, schedule | Sequencer `UPDATE … RETURNING` for send (position+revision) and mutations (revision). `(conversation_id, client_nonce)` unique (F-3). Unsend is a tombstone (BR-1). Forward copies independently (BR-10–14). Reactions/pins/saves and one-shot schedule. 403s on every write. Recurring RRULE waits for 3.5; cursor pagination and TanStack Query wait for 3.3. |
| 3.3 | Cursor pagination, message queries, TanStack Query layer replacing mocks | Position cursors (`before`/`after`) plus jump (`around_id`/`around_at`). Page size 50, jump window 60 (BR-108); client cache 200 newest (BR-107). TanStack Query owns server state with optimistic send/edit/react/pin/save/unsend rollback. Message info from watermarks (shape only). Catch-up/IndexedDB wait for P4; exact ticks wait for P5. |

---

## How to update this file (agent instructions)

At the end of your session, replace the "Current state" table and "Next session
brief" block above with the values for the *next* session (look up the §5 table
in MASTER_PLAN.md). Add a row to "Completed sessions". Do not change anything
else in this file.

In the session report, include a proposed commit message (session-id prefix,
1–2 sentences on why). Do not create the commit unless the user asks.
