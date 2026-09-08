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
| **Last completed** | 14.1 |
| **Next session** | 14.2 |
| **Phase** | P14 Shell |
| **Sessions remaining in phase** | 7 |

---

## Next session brief (agent: read SHELL_PLAN.md §5 for the full row)

**14.2 — Tab chrome: rail + bottom bar.**

Tab store: Chats / Calls / Profile. Desktop left rail (full height, edge-stuck).
Mobile bottom bar (full width, three equal tabs, edge-stuck, safe-area). Switching
a tab replaces the main surface — never both Calls and Profile. Stub Calls/Profile
panes (empty or “coming in 14.5/14.6”). Hide bar when a nested chat/layer is open.
Tests for exclusive destinations + bar visibility.

Docs: SHELL_TARGET §1; DESIGN_SYSTEM §6; `docs/shell-mockup.html`. Do not start
14.3 in this session.

---

## Completed sessions

| Session | Deliverable | Notes |
| --- | --- | --- |
| docs | SHELL_AUDIT / TARGET / GAP / PLAN + mockup | Visual lock: `docs/shell-mockup.html` |
| 14.1 | AuthGate Google GIS + password + OTP/magic/passkey | GIS popup → `POST /auth/google` `{ code }`, JWT in body (F-25). Google button hidden without `VITE_GOOGLE_CLIENT_ID`. OTP/magic/passkey use existing endpoints (server still enforces `passwordless_auth` / `passkey_auth`). `/auth/magic` consumes mailed tokens. Pages CSP allows `accounts.google.com`. |

---

## Agent: how to update this file

At the end of your session, replace the "Current state" table and "Next
session brief" with the *next* row from SHELL_PLAN.md §5. Add a row to
"Completed sessions". Do not change anything else.

In the session report, include a proposed commit message (session-id prefix,
e.g. `Session 14.1: …`). Do not create the commit unless the user asks.
