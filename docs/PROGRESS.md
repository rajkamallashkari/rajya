# PROGRESS.md — Session state

> **Agent: read this at the start of every session. Update the "Last completed"
> line and "Next session" block at the end of your session before stopping.**
> User: attach this file alongside SESSION_STARTER.md and type `Continue.`

---

## Current state

| Field | Value |
| --- | --- |
| **Last completed** | 1.1 |
| **Next session** | 1.2 |
| **Phase** | P1 — Design system & chat shell |
| **Sessions remaining in phase** | 4 (1.2 → 1.5) |

---

## Next session brief (agent: read §5 of MASTER_PLAN.md for the full row)

**Session 1.2 — `MessageBubble`, grouping, formatting, ticks, system messages**

Deliverable: `MessageBubble`, `MessageGroup`, `MessageContent` with the symmetric
formatting set and spoilers, `TickIndicator`, `SystemMessage`, dividers.

Docs: `DESIGN_SYSTEM.md §4 (incl. the DS-6 formatting table), §5.1, §5.2; AUDIT §1.2`

Legacy to read:
- `legacy/botverse/src/components/chat/MessageBubble.tsx`
- `legacy/botverse/src/components/chat/MessageView.tsx`
- `legacy/botverse/src/components/chat/SystemEventBubble.tsx`
- `legacy/botverse/src/components/chat/CallMessageBubble.tsx`

Extract: grouping rules, jumbo-emoji branch, tick rendering, **and the
incoming-formatted / sent-plain inconsistency being fixed**.

---

## Completed sessions

| Session | Deliverable | Notes |
| --- | --- | --- |
| 0.1 | Repo layout, legacy move, Compose, CI stub, brand | — |
| 0.2 | Rails layers, full schema, factories | — |
| 0.3 | OpenAPI pipeline, health endpoints, Tier 1 config stack, CI guards | — |
| 0.4 | Vite scaffold, token layers, applyTheme, deriveTypography, i18next, lint rules, Vitest gate | — |
| 1.1 | Primitives on Radix, `/dev/gallery` | Shared UI kit on Radix; gallery at `/dev/gallery`. Visual values derive from token layers so density/settings can restyle without component variants. |

---

## How to update this file (agent instructions)

At the end of your session, replace the "Current state" table and "Next session
brief" block above with the values for the *next* session (look up the §5 table
in MASTER_PLAN.md). Add a row to "Completed sessions". Do not change anything
else in this file.
