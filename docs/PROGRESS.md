# PROGRESS.md — Session state

> **Agent: read this at the start of every session. Update the "Last completed"
> line and "Next session" block at the end of your session before stopping.**
> User: attach this file alongside SESSION_STARTER.md and type `Continue.`

---

## Current state

| Field | Value |
| --- | --- |
| **Last completed** | 7.4 |
| **Next session** | 8.1 |
| **Phase** | P8 — Search |
| **Sessions remaining in phase** | 2 (8.1, 8.2) |

---

## Next session brief (agent: read §5 of MASTER_PLAN.md for the full row)

**Session 8.1 — FTS, global and in-chat search, jump navigation, discoverability gates**

Deliverable: FTS, global and in-chat search, jump navigation, discoverability gates

Docs: SCHEMA §4 (`search_vector`); GAP §2; AUDIT §1.2, §2.4 (BR-45, BR-46), §5 (F-15)

Legacy to read: `cognify/app/controllers/api/v1/search_controller.rb`, `botverse/src/components/chat/ChatSearchBar.tsx`, `SearchResultsPanel.tsx`

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
| 3.4 | Polls (NR-15), static location and contact message children (NR-30, NR-31) | Polls are message children: unsend tombstones the parent and omits poll/location from JSON (BR-7). Single-choice is a locked `Polls::Vote` transaction (S-12); anonymity is serializer-only (S-13). Locations are static points (S-16). Vote follows react; close is author or group admin/owner. Composer poll/location pickers wait so DS-13 stays intact; Playwright poll create/vote waits for that attach UI. |
| 3.5 | Permalinks (NR-19), bulk actions (NR-20), silent send (NR-23), recurring schedules (NR-26), reaction details (NR-27) | Permalinks resolve through membership (`GET /messages/:id` 404s for non-members). Bulk unsend/forward/save is all-or-nothing (BR-1 tombstones). Silent persists on send and still advances delivered. Recurring uses the documented RRULE subset in the account timezone. Reaction details query existing `reactions`. Composer schedule/recurrence picker, conversation-picker for bulk forward, push suppression, and Playwright bulk-forward wait for later (P10.2 / phase DoD / DS-13). |
| 3.6 | Personal organization: pinned conversations (NR-21), mark-as-unread (NR-22), reminders (NR-24), saved replies (NR-25), P8 filter indexes (NR-43) | Pins and unread live on the viewer's membership only. Reminders upsert per account+message and dispatch on a one-minute job (no Web Push yet). Saved replies expand from the composer slash menu. Sender filter index exists for P8; EXPLAIN waits for P8.2. Wallpaper (NR-42), reminder push (P10.2), saved-reply settings UI (P12.3), and full reminder/saved-reply drawers wait. |
| 4.1 | Channels, `Realtime.publish`, `after_commit` flush, batched fanout | `ConversationChannel` / `AccountChannel` / `PresenceChannel` / `SignalingChannel` scaffold. `Realtime.publish` flushes after commit so rolled-back writes never broadcast. Conversation fanout is one member query and one broadcast per stream, plus one `Push::FanoutJob` with the recipient list (F-19). Presence counters, BR-44 offline grace, and privacy-gated broadcasts. Adapter parity covers Redis and Solid Cable. Typed client router waits for 4.2; outbox for 4.3; Web Push delivery for 10.2. |
| 4.2 | Typed event union and router, cache writes, reconnect and catch-up | Exhaustive Cable event union fails the client build on an unhandled backend type. The router writes fetched messages into TanStack Query. Reconnect catch-up uses `after_revision` so send/edit/tombstone/react converge (BR-26, BR-30, BR-33). IndexedDB/outbox/Background Sync wait for 4.3; Playwright offline-send waits for that layer. |
| 4.3 | IndexedDB per account, outbox single-flight, Background Sync | Per-account IndexedDB (`rajya:{accountId}`) holds outbox, a 200-message cache (BR-107), and SW auth. Outbox is `queued → sending → failed` under a Web Lock so tab drain and Background Sync cannot double-send (F-3). Playwright: offline send three, reconnect once in order; dual drain one row. Real SW dual-drain waits for a non-MSW Playwright project. |
| 5.1 | Watermarks, `receipt_marks`, tick computation incl. bots, unread counts | Two-watermark split (BR-36): `last_seen` always, `last_read` only with receipts on; `from_position` holes so enabling receipts never discloses prior private views. Exact info times from covering `receipt_marks` (D-5). Server ticks `sent`/`delivered`/`read`; groups MIN over active humans; bots excluded from the group set and consume their own watermarks (S-9). Delivery via live socket, fetch/catch-up ack, or push acceptance including muted (Q-5; real Web Push is P10.2). `POST /receipts`, `receipts_updated`, unread reconcile job. Tick UI, typing, and nineteen system-event writers wait for 5.2. |
| 5.2 | Typing and granular activity, system-event writers, tick UI | Ephemeral typing (NR-3) plus activity kinds (NR-40) on one cache key — TTL/throttle from Settings, no DB row, no cleanup job. `SystemEvents::Write` covers the 18 SCHEMA §4 events (`disappearing_timer_changed` was cut with NR-16); pin/create-group/update emit theirs with catalog copy. Thread ticks follow `receipts_updated` (own receipts skipped). Playwright two-context: accent ticks, typing bubble, system line. Leave-group write waits for 6.1; live Cable (non-MSW) Playwright waits for a later project. |
| 6.1 | Roles, add/remove, leave guards, the §3.2 lifecycle | Soft `left`/`removed` rows; rejoin flips the unique membership and keeps watermarks (BR-50). Last admin/owner cannot leave while others remain, with no auto-transfer (BR-51). Last member leave retains the conversation (changes BR-52). Remove cannot drop below `min_members` (BR-53). Owner-only promote/demote/transfer; bots stay members. System events for add/remove/leave/role. Invites wait for 6.2; folders/archive/mute UI wait for 6.3. |
| 6.2 | Invites with atomic redemption, public preview, join requests, QR codes (NR-38) | Atomic `UPDATE … SET uses_count = uses_count + 1 WHERE …` (F-14). Public `GET /api/v1/invites/:token` returns title, avatar, member count (BR-59). Join requests reset to pending on re-request (BR-60). Client `/invite/:token` landing, invite manager + QR (NR-38), `join_request` realtime. Playwright create-group → QR → join → approve waits for the P6 flow. |
| 6.3 | Folders, archive (NR-14), mute, blocking enforcement | Custom folders persist (All/Unread/Archived are client tabs). Archive is per-account `archived_at`, auto-unarchives on new activity, orthogonal to mute. Mute durations 1h/8h/24h/until-on. Blocking: reverse new-DM 404, groups still work. Playwright create-group → archive → block waits for the P6 flow. |
| 6.4 | Granular permission overrides (NR-34), `@everyone`/`@admins` (NR-35), slow mode (NR-36), forwarding restrictions (NR-37) | Overrides may only narrow the §3.1 matrix (S-17); generated KEYS × ACTORS spec. Mentions rate-limited behind `mention_everyone`. Slow mode uses persisted `last_message_at` (S-18); admins/owners exempt. Copy/forward hidden when restricted; export waits for P7. Playwright restrict-permissions waits for the P6 flow. |
| 6.5 | Reporting (NR-39) submission: report sheet, pending-subject dedupe, admin mail and `report_created` | Second pending report by the same reporter on the same subject is `conflict`; a new one is accepted after resolve. Reasons come from `app_settings` (S-21). Wired from message and profile menus. Playwright P6 flow (including report) waits; the admin queue waits for P12.6. |
| 7.1 | Upload, buckets, quotas, processing pipeline, MIME sniffing, authorization | Presign + Marcel sniff (BR-89), per-type caps (BR-88), checksum reuse (BR-90), lowest-priority bucket routing (BR-91), membership-checked 5-min URLs (BR-94, F-16). Quota charges on first blob use only; unsend does not decrement (BR-92); reconcile repairs unique owned blobs (F-5). Processing failures set `processing_status=failed` with catalog copy (F-17); `thumbnail_blob_id` is gone (F-18). Lightbox, galleries, and failed-state UI wait for 7.2. |
| 7.2 | Progressive rendering, album grid, lightbox, galleries, voice playback | Blurhash → thumb → full without layout shift; Telegram mosaic album; lightbox zoom/prev/next; per-chat Media/files/links gallery (`gallery_page_size`); one global voice player with speed and seek; failed attachments retry. Composer still uses chips (DS-13). Stickers/GIFs wait for 7.3. Playwright send-photo/voice/file waits for phase DoD. |
| 7.3 | Sticker packs and custom emoji (NR-28), GIF proxy (NR-29) | Packs with S-19 quota attribution (system packs charge the global bucket; first sticker add charges, send reuses the blob). GIF search via Tenor behind `gif_search` (default off; flag-off 404). Composer opens the picker from `/sticker` and `/gif` only (DS-13). Admin pack UI waits for 12.6. Playwright send-sticker/GIF waits for phase DoD. |
| 7.4 | Voice transcription (NR-33), location/contact rendering (NR-30, NR-31), export jobs (NR-32) | Groq `whisper-large-v3` via a thin AI registry, low-priority queue, `voice_transcription` default on; quota/provider errors set `transcript_status=failed` with UI retry (F-17). OSM tiles with attribution and a client request cap; in-app contacts open the profile layer. `export_jobs` API/job charges requester quota, TTL 7 days, honours `restrict_forwarding`, excludes left memberships. Export UI waits for 12.3; import is not built (S-23 / NR-F8). Playwright send-photo/voice/file/sticker/GIF/location waits for phase DoD. |

---

## How to update this file (agent instructions)

At the end of your session, replace the "Current state" table and "Next session
brief" block above with the values for the *next* session (look up the §5 table
in MASTER_PLAN.md). Add a row to "Completed sessions". Do not change anything
else in this file.

In the session report, include a proposed commit message (session-id prefix,
1–2 sentences on why). Do not create the commit unless the user asks.
