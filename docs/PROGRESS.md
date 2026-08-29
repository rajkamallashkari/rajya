# PROGRESS.md — Session state

> **Agent: read this at the start of every session. Update the "Last completed"
> line and "Next session" block at the end of your session before stopping.**
> User: attach this file alongside SESSION_STARTER.md and type `Continue.`

---

## Current state

| Field | Value |
| --- | --- |
| **Last completed** | 1.4 |
| **Next session** | 1.5 |
| **Phase** | P1 — Design system & chat shell |
| **Sessions remaining in phase** | 1 (1.5) |

---

## Next session brief (agent: read §5 of MASTER_PLAN.md for the full row)

**Session 1.5 — The fourteen new-feature components and the personalisation surface**

Deliverable: **The fourteen new-feature components** and the personalisation
surface: `PollCard`, `ReactionDetailsSheet`, `SelectionToolbar`, the unified
picker sheet (emoji/sticker/GIF/saved-reply tabs), `LocationCard`, `ContactCard`,
`TranscriptBlock`, `SlashCommandMenu`, `WallpaperPicker`, `QrSheet`, `ReportSheet`,
`SessionListItem`

Docs: `DESIGN_SYSTEM §4 (additions), §5.2, §8.1, §8.2, DS-8/DS-9/DS-10/DS-12/DS-13; SCHEMA §12 for the shapes they render`

Legacy to read:
- `legacy/botverse/src/components/chat/EmojiPickerSheet.tsx`
- `legacy/botverse/src/components/chat/MessageInfoBottomSheet.tsx`
- `legacy/botverse/src/components/chat/ForwardModal.tsx` — the sheet patterns the new components must reuse rather than reinvent; emoji stays in the picker, not as composer chrome

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
| 1.3 | Composer, voice UI, long-press, context menu, ChatListItem | **DS-13** three-element row (mic · textarea · send). Send long-press/right-click: attach, schedule, rewrite, silent send. Mic takes over the row for voice. Preview: waveform above the clock, played bars highlighted, `elapsed / total` while playing or after seek. Chips + schedule bar above. Swipe/pin/unread list, lifted bubble + message menu. Presentation only. |
| 1.4 | `useLayer` navigation, error boundaries, list states, MSW, shortcuts | History-backed layer stack (mobile overlay + desktop panels). Scroll kept per layer; buried layers stay mounted and `inert`. List empty/loading/error, impersonation/offline banners, typed MSW `/health`+`/up`. NR-46: Escape, `/`, ArrowUp, Enter. Composer chrome unchanged (**DS-13**). |

---

## How to update this file (agent instructions)

At the end of your session, replace the "Current state" table and "Next session
brief" block above with the values for the *next* session (look up the §5 table
in MASTER_PLAN.md). Add a row to "Completed sessions". Do not change anything
else in this file.

In the session report, include a proposed commit message (session-id prefix,
1–2 sentences on why). Do not create the commit unless the user asks.
