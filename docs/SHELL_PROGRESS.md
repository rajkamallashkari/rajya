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
| **Last completed** | 14.4 |
| **Next session** | 14.5 |
| **Phase** | P14 Shell |
| **Sessions remaining in phase** | 4 |

---

## Next session brief (agent: read SHELL_PLAN.md §5 for the full row)

**14.5 — Profile tab + inline edit.**

Profile tab: photo, name, username, bio; email/phone only when privacy
prefs allow. Header **Edit** (inline form, Cancel/Save at bottom) and
**Settings** (push hub layer). Remove settings gear and `/dev/*` links from
the Chats header. Account switcher: long-press/right-click on identity.

Docs: SHELL_TARGET §3; SHELL_AUDIT §3 AccountDrawer; legacy `NavBar.tsx`,
`ProfileContent.tsx`, `ProfileEditPanel.tsx`, `AccountSwitcher.tsx`.
Do not start 14.6 in this session.

---

## Completed sessions

| Session | Deliverable | Notes |
| --- | --- | --- |
| docs | SHELL_AUDIT / TARGET / GAP / PLAN + mockup | Visual lock: `docs/shell-mockup.html` |
| 14.1 | AuthGate Google GIS + password + OTP/magic/passkey | GIS popup → `POST /auth/google` `{ code }`, JWT in body (F-25). Google button hidden without `VITE_GOOGLE_CLIENT_ID`. OTP/magic/passkey use existing endpoints (server still enforces `passwordless_auth` / `passkey_auth`). `/auth/magic` consumes mailed tokens. Pages CSP allows `accounts.google.com`. |
| 14.2 | Tab chrome: rail + bottom bar | Destination store Chats / Calls / Profile. Desktop left rail, mobile bottom bar (hidden on nested Chats layers). Exclusive panes; Calls/Profile stubs for 14.5/14.6. |
| 14.3 | Chats geometry: empty column + overlays | Always list + chat or empty welcome. Desktop details are 420px right overlays, not a third column. Settings overlay the chat pane. Returning from Calls/Profile restores the last conversation. First desktop load opens the most recent chat. |
| 14.4 | Compose menu + New message / New group | Header bubble+plus menu (channel/broadcast Soon). New message layer: bots + people search; select opens/creates a DM. New group uses existing create-group. Empty-list and welcome CTAs open the same menu. |

---

## Agent: how to update this file

At the end of your session, replace the "Current state" table and "Next
session brief" with the *next* row from SHELL_PLAN.md §5. Add a row to
"Completed sessions". Do not change anything else.

In the session report, include a proposed commit message (session-id prefix,
e.g. `Session 14.1: …`). Do not create the commit unless the user asks.
