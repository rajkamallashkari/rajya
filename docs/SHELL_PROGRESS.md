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
| **Last completed** | 14.2 |
| **Next session** | 14.3 |
| **Phase** | P14 Shell |
| **Sessions remaining in phase** | 6 |

---

## Next session brief (agent: read SHELL_PLAN.md §5 for the full row)

**14.3 — Chats geometry: empty column + overlays.**

Chats destination: always list + chat-or-empty welcome. Desktop details as
right overlays (~420px), not a column that appears only when a layer exists.
Settings must not occupy the chat pane. Restore last conversation when returning
from Calls/Profile. First load: most recent chat if any. Stop auto-open fighting
empty welcome.

Docs: SHELL_TARGET §1.3, §6; SHELL_AUDIT §2; DESIGN_SYSTEM §6; legacy
`legacy/botverse/src/pages/HomePage.tsx`, `PanelHost.tsx`, `PanelShell.tsx`.
Do not start 14.4 in this session.

---

## Completed sessions

| Session | Deliverable | Notes |
| --- | --- | --- |
| docs | SHELL_AUDIT / TARGET / GAP / PLAN + mockup | Visual lock: `docs/shell-mockup.html` |
| 14.1 | AuthGate Google GIS + password + OTP/magic/passkey | GIS popup → `POST /auth/google` `{ code }`, JWT in body (F-25). Google button hidden without `VITE_GOOGLE_CLIENT_ID`. OTP/magic/passkey use existing endpoints (server still enforces `passwordless_auth` / `passkey_auth`). `/auth/magic` consumes mailed tokens. Pages CSP allows `accounts.google.com`. |
| 14.2 | Tab chrome: rail + bottom bar | Destination store Chats / Calls / Profile. Desktop left rail, mobile bottom bar (hidden on nested Chats layers). Exclusive panes; Calls/Profile stubs for 14.5/14.6. |

---

## Agent: how to update this file

At the end of your session, replace the "Current state" table and "Next
session brief" with the *next* row from SHELL_PLAN.md §5. Add a row to
"Completed sessions". Do not change anything else.

In the session report, include a proposed commit message (session-id prefix,
e.g. `Session 14.1: …`). Do not create the commit unless the user asks.
