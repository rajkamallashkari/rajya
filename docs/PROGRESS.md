# PROGRESS.md — Session state

> **Agent: read this at the start of every session. Update the "Last completed"
> line and "Next session" block at the end of your session before stopping.**
> User: attach this file alongside SESSION_STARTER.md and type `Continue.`

---

## Current state

| Field | Value |
| --- | --- |
| **Last completed** | 0.4 |
| **Next session** | 1.1 |
| **Phase** | P1 — Design system & chat shell |
| **Sessions remaining in phase** | 5 (1.1 → 1.5) |

---

## Next session brief (agent: read §5 of MASTER_PLAN.md for the full row)

**Session 1.1 — Primitives on Radix, `/dev/gallery`**

Deliverable: All shared UI primitives built on Radix + shadcn, a `/dev/gallery`
route showing every component in isolation.

Docs: `DESIGN_SYSTEM.md §4 (component list), §2, §7`

Legacy to read:
- `legacy/botverse/src/components/shared/`

Extract: inventory the 291 hand-rolled buttons being replaced — understand
patterns to supersede, not code to copy.

---

## Completed sessions

| Session | Deliverable | Notes |
| --- | --- | --- |
| 0.1 | Repo layout, legacy move, Compose, CI stub, brand | — |
| 0.2 | Rails layers, full schema, factories | — |
| 0.3 | OpenAPI pipeline, health endpoints, Tier 1 config stack, CI guards | — |
| 0.4 | Vite scaffold, token layers, applyTheme, deriveTypography, i18next, lint rules, Vitest gate | — |

---

## How to update this file (agent instructions)

At the end of your session, replace the "Current state" table and "Next session
brief" block above with the values for the *next* session (look up the §5 table
in MASTER_PLAN.md). Add a row to "Completed sessions". Do not change anything
else in this file.
