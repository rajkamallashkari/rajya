# PROGRESS.md — Session state

> **Agent: read this at the start of every session. Update the "Last completed"
> line and "Next session" block at the end of your session before stopping.**
> User: attach this file alongside SESSION_STARTER.md and type `Continue.`

---

## Current state

| Field | Value |
| --- | --- |
| **Last completed** | 1.2 |
| **Next session** | 1.3 |
| **Phase** | P1 — Design system & chat shell |
| **Sessions remaining in phase** | 3 (1.3 → 1.5) |

---

## Next session brief (agent: read §5 of MASTER_PLAN.md for the full row)

**Session 1.3 — `Composer`, voice UI, long-press, context menu, `ChatListItem`**

Deliverable: `Composer`, voice UI, long-press, context menu, `ChatListItem` with
swipe, pin and unread affordances.

Docs: `DESIGN_SYSTEM §5.1, §5.3, §7; AUDIT §1.2`

Legacy to read:
- `legacy/botverse/src/components/chat/ChatInput.tsx`
- `legacy/botverse/src/components/chat/VoiceRecorder.tsx`
- `legacy/botverse/src/components/chat/MessageContextMenu.tsx`
- `legacy/botverse/src/hooks/useLongPress.ts`
- `legacy/botverse/src/hooks/useVoiceRecorder.ts`
- `legacy/botverse/src/hooks/usePressHold.ts`

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

---

## How to update this file (agent instructions)

At the end of your session, replace the "Current state" table and "Next session
brief" block above with the values for the *next* session (look up the §5 table
in MASTER_PLAN.md). Add a row to "Completed sessions". Do not change anything
else in this file.
