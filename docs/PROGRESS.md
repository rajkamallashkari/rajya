# PROGRESS.md — Session state

> **Agent: read this at the start of every session. Update the "Last completed"
> line and "Next session" block at the end of your session before stopping.**
> User: attach this file alongside SESSION_STARTER.md and type `Continue.`

---

## Current state

| Field | Value |
| --- | --- |
| **Last completed** | 2.1 |
| **Next session** | 2.2 |
| **Phase** | P2 — Identity & auth |
| **Sessions remaining in phase** | 4 (2.2–2.5) |

---

## Next session brief (agent: read §5 of MASTER_PLAN.md for the full row)

**Session 2.2 — Google GIS, password, OTP, magic link; enumeration and `SecureRandom` fixes**

Deliverable: Google GIS, password, OTP, magic link; enumeration and `SecureRandom` fixes

Docs: `SCHEMA §2; GAP §1; AUDIT §1.1, §5 (F-2, F-8, F-23, F-24, F-25)`

Legacy to read:
- `legacy/cognify/app/controllers/api/v1/sessions_controller.rb`
- `legacy/cognify/app/controllers/api/v1/otp_auth_controller.rb`
- `legacy/cognify/app/controllers/api/v1/password_auth_controller.rb`
- `legacy/cognify/app/controllers/sessions_controller.rb` (the legacy redirect **not** being ported)

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

---

## How to update this file (agent instructions)

At the end of your session, replace the "Current state" table and "Next session
brief" block above with the values for the *next* session (look up the §5 table
in MASTER_PLAN.md). Add a row to "Completed sessions". Do not change anything
else in this file.

In the session report, include a proposed commit message (session-id prefix,
1–2 sentences on why). Do not create the commit unless the user asks.
