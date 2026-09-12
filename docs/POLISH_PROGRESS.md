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
| **Last completed** | 15.7 |
| **Next session** | 15.8 |
| **Phase** | P15 Polish |
| **Sessions remaining in phase** | 3 |

---

## Next session brief (agent: read POLISH_PLAN.md §5 for the full row)

**15.8 — Blocker profile + Unblock + banner.**

Split NR-1 profile authorization: a blocker can open the blocked account's
profile and Unblock, while the blocked party still gets 404. Keep the chat
header working, add the thread banner, and make Privacy blocked-list rows open
profiles. Search and new-DM gates stay unchanged. Do not start 15.9 in this
session.

Docs: POLISH_TARGET §7; POLISH_AUDIT §9; CONVENTIONS §7.
Legacy: none — Botverse has no block list; do not invent extras beyond Unblock,
the banner, and Privacy-list navigation.

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

---

## Agent: how to update this file

At the end of your session, replace the "Current state" table and "Next
session brief" with the *next* row from POLISH_PLAN.md §5. Add a row to
"Completed sessions". Do not change anything else.

In the session report, include a proposed commit message (session-id prefix,
e.g. `Session 15.1: …`). Do not create the commit unless the user asks.
