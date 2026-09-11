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
| **Last completed** | 15.1 |
| **Next session** | 15.2 |
| **Phase** | P15 Polish |
| **Sessions remaining in phase** | 9 |

---

## Next session brief (agent: read POLISH_PLAN.md §5 for the full row)

**15.2 — Voice note send.**

Wire `LiveThread` to `onVoiceSend`; presign and upload the recording; send
`attachment_signed_ids`, `voice_duration_ms`, and `voice_waveform`. Add an
optimistic voice bubble with rollback on failure. Update OpenAPI/generated
types only if the current client is missing the voice fields. Do not start 15.3
in this session.

Docs: POLISH_TARGET §2; POLISH_AUDIT §4.

---

## Completed sessions

| Session | Deliverable | Notes |
| --- | --- | --- |
| docs | POLISH_AUDIT / TARGET / GAP / PLAN | P14 frozen; visual chrome still `docs/shell-mockup.html` |
| 15.1 | Mobile overlay pointer-events + back | Mobile frames restore pointer events; Profile, Calls, and Chats overlay/back coverage is green |

---

## Agent: how to update this file

At the end of your session, replace the "Current state" table and "Next
session brief" with the *next* row from POLISH_PLAN.md §5. Add a row to
"Completed sessions". Do not change anything else.

In the session report, include a proposed commit message (session-id prefix,
e.g. `Session 15.1: …`). Do not create the commit unless the user asks.
