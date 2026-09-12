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
| **Last completed** | 15.10 |
| **Next session** | — (P15 complete) |
| **Phase** | P15 Polish |
| **Sessions remaining in phase** | 0 |

---

## Next session brief (agent: read POLISH_PLAN.md §5 for the full row)

**P15 complete.** Treat `POLISH_*` as history. Do not start MASTER_PLAN or new
P14/P15 work from this file.

---

## Completed sessions

| Session | Deliverable | Notes |
| --- | --- | --- |
| docs | POLISH_AUDIT / TARGET / GAP / PLAN | P14 frozen; visual chrome still `docs/shell-mockup.html` |
| 15.1 | Mobile overlay pointer-events + back | Mobile frames restore pointer events; Profile, Calls, and Chats overlay/back coverage is green |
| 15.2 | Voice note send | LiveThread `onVoiceSend` → presign upload → send with voice fields; optimistic voice bubble + rollback |
| 15.3 | Send-arrow attach + schedule | Attach opens a hidden picker → media previews → `attachment_signed_ids`; Schedule appears for text drafts and Confirm posts immediately. Per-chat scheduled count/list added; Rewrite/silent and DS-13 untouched |
| 15.4 | Date chips → JumpDateSheet | Thread date chips are keyboard-focusable buttons that open the existing jump sheet; the header calendar action is removed and `around_at` jumping is preserved |
| 15.5 | Call controls + Return to call | Voice/video chrome starts visible, idle-hides, and toggles from the call surface. Reloaded active calls offer Return to call with fresh media, PeerConnections, and signaling; impossible rejoins hang up without the amber End-only bar |
| 15.6 | Profile scroll, members, invites, common groups | Profile bodies scroll independently; group profiles list cached conversation members alongside invite management, and direct/bot profiles open common groups derived from the conversation query cache |
| 15.7 | Compose: drop bot icon, collapsible, group chips | Removed the chat-list Bot shortcut; New Message sections start open and collapse independently; new-group selections show responsive avatar chips with desktop-hover/mobile-tap identity details and click/X removal |
| 15.8 | Blocker profile + Unblock + banner | Profile show now distinguishes block direction: blockers receive the profile plus `blocked_by_viewer` and can Unblock, while reverse and mutual blocks remain 404. Direct threads show a blocked banner, and Privacy blocked-account rows open profiles |
| 15.9 | Profile edit: username debounce, avatar | Profile edit now checks username availability after a debounce and supports validated avatar selection, local preview, direct upload, persisted display, and removal through the documented profile contract |
| 15.10 | Playwright / Vitest / i18n | Playwright covers mobile overlay back, voice bubbles, date-chip jump, reload-without-stuck-bar, blocker unblock, and username/avatar edit; catalog keys are asserted and P15 Ruby is RuboCop-clean |

---

## Agent: how to update this file

At the end of your session, replace the "Current state" table and "Next
session brief" with the *next* row from POLISH_PLAN.md §5. Add a row to
"Completed sessions". Do not change anything else.

In the session report, include a proposed commit message (session-id prefix,
e.g. `Session 15.1: …`). Do not create the commit unless the user asks.
