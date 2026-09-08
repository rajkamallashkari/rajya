# SHELL_PROGRESS.md — P14 session state

> **Agent: read this at the start of every P14 session.** Update the "Last
> completed" line and "Next session" block before stopping.
> User: attach this file alongside SESSION_STARTER.md and type `Continue.`
>
> Original port history remains in [`PROGRESS.md`](PROGRESS.md) (complete at 13.3).
> Do not reuse that file’s “Next session” for shell work.

---

## Current state

| Field | Value |
| --- | --- |
| **Last completed** | 14.3 |
| **Next session** | 14.4 |
| **Phase** | P14 Shell |
| **Sessions remaining in phase** | 5 |

---

## Next session brief (agent: read SHELL_PLAN.md §5 for the full row)

**14.4 — Compose menu + New message / New group.**

Replace list FABs and the no-op empty New chat (`setQuery("")`). Header
compose control (bubble+plus) → menu: New message, New group, Channel/Broadcast
disabled Soon. New message layer: bots + people (`searchPeople` +
`useStartDirectChat` / `createConversation`). Selecting a person or bot
opens/creates the DM and pops the layer. New group uses existing create-group
operation. Empty-state CTA opens compose. **DoD:** two signed-in humans can
find each other and start a DM.

Docs: SHELL_TARGET §2; SHELL_AUDIT §2.1; legacy
`legacy/botverse/src/components/sidebar/NewChatPanel.tsx`, Sidebar FABs.
Do not start 14.5 in this session.

---

## Completed sessions

| Session | Deliverable | Notes |
| --- | --- | --- |
| docs | SHELL_AUDIT / TARGET / GAP / PLAN + mockup | Visual lock: `docs/shell-mockup.html` |
| 14.1 | AuthGate Google GIS + password + OTP/magic/passkey | GIS popup → `POST /auth/google` `{ code }`, JWT in body (F-25). Google button hidden without `VITE_GOOGLE_CLIENT_ID`. OTP/magic/passkey use existing endpoints (server still enforces `passwordless_auth` / `passkey_auth`). `/auth/magic` consumes mailed tokens. Pages CSP allows `accounts.google.com`. |
| 14.2 | Tab chrome: rail + bottom bar | Destination store Chats / Calls / Profile. Desktop left rail, mobile bottom bar (hidden on nested Chats layers). Exclusive panes; Calls/Profile stubs for 14.5/14.6. |
| 14.3 | Chats geometry: empty column + overlays | Always list + chat or empty welcome. Desktop details are 420px right overlays, not a third column. Settings overlay the chat pane. Returning from Calls/Profile restores the last conversation. First desktop load opens the most recent chat. |

---

## Agent: how to update this file

At the end of your session, replace the "Current state" table and "Next
session brief" with the *next* row from SHELL_PLAN.md §5. Add a row to
"Completed sessions". Do not change anything else.

In the session report, include a proposed commit message (session-id prefix,
e.g. `Session 14.1: …`). Do not create the commit unless the user asks.
