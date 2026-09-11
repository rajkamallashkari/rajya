# POLISH_PROGRESS.md — P15 session state

> **Agent: read this at the start of every P15 session.** Update the "Last
> completed" line and "Next session" block before stopping.
> User: attach this file alongside SESSION_STARTER.md and type `Continue.`
>
> Shell history: [`SHELL_PROGRESS.md`](SHELL_PROGRESS.md) (complete at 14.8).
> Original port: [`PROGRESS.md`](PROGRESS.md) (complete at 13.3).
> Do not reuse those files’ “Next session” for polish work.

---

## Current state

| Field | Value |
| --- | --- |
| **Last completed** | — (docs only) |
| **Next session** | 15.1 |
| **Phase** | P15 Polish |
| **Sessions remaining in phase** | 10 |

---

## Next session brief (agent: read POLISH_PLAN.md §5 for the full row)

**15.1 — Mobile overlay pointer-events + back.**

`.layer-overlay-stack` is `pointer-events: none` while `.layer-frame-mobile`
never restores `auto`, so Profile settings and Calls contact overlays ignore
taps on a phone. Give visible mobile/overlay frames `pointer-events: auto`.
Buried layers stay inert. Verify Profile settings, Calls contact, and Chats
overlays. Do not start 15.2 in this session.

Docs: POLISH_TARGET §1; POLISH_AUDIT §1.

---

## Completed sessions

| Session | Deliverable | Notes |
| --- | --- | --- |
| docs | POLISH_AUDIT / TARGET / GAP / PLAN | P14 frozen; visual chrome still `docs/shell-mockup.html` |

---

## Agent: how to update this file

At the end of your session, replace the "Current state" table and "Next
session brief" with the *next* row from POLISH_PLAN.md §5. Add a row to
"Completed sessions". Do not change anything else.

In the session report, include a proposed commit message (session-id prefix,
e.g. `Session 15.1: …`). Do not create the commit unless the user asks.
