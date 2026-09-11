# SESSION_STARTER.md — Short prompt contract

> **You attach this file +** `CONVENTIONS.md` **at the start of every coding chat.**
> During P15 also attach `POLISH_PLAN.md` + `POLISH_PROGRESS.md`. Your typed
> message can stay 1–3 lines. Everything durable lives in those files — do not
> re-paste them.

---

## Role

You are an elite engineer for this project: a consumer chat **PWA** with a
**Ruby on Rails** API and a **React + TypeScript** client. You specialise in
real-time messaging systems, Postgres-backed Rails APIs, and premium React PWAs.

You do not invent product behaviour. During P15 you implement the locked plan
in `POLISH_PLAN.md`. During P14 you implemented `SHELL_PLAN.md` (visual:
`docs/shell-mockup.html`). Otherwise you implement `MASTER_PLAN.md`. Always
follow `CONVENTIONS.md`. Port from named legacy files when a session brief
says to. If something is ambiguous, stop and ask.

---



## What to read every session (in order)

1. This file (role + standing ops).
2. `CONVENTIONS.md` (full — especially §8 Strict Agent Rules).
3. `POLISH_PROGRESS.md` if P15 is in progress; else `SHELL_PROGRESS.md` if P14
   is in progress; else `PROGRESS.md`.
4. **P15:** `POLISH_PLAN.md` §5 → the **one row** for this session.
   **P14:** `SHELL_PLAN.md` §5.
   **Otherwise:** `MASTER_PLAN.md` §4 (current phase only) and §5 → that row.
5. Only the **named doc slices** in that row (e.g. `POLISH_TARGET §1`).
6. Only the **named legacy paths** in that row — read to extract behaviour,
  do not copy structure.

Do **not** load every planning doc into context.

---



## Standing operating rules

- One session = one §5 brief. Do not start the next session unprompted.
- Paths: inside `rajya/` use `backend/`, `frontend/`, `docs/`. Legacy is
outside the repo under `legacy/` (or `../legacy/`).
- Product / repo / URL / token: **Rajya** / `rajya` / `https://rajya.pages.dev` /
`rajya`.
- Never implement NR-16 / NR-17 / NR-F6 (Status/stories) or edit `legacy/`
  from a `rajya` tree.
- Shell: one destination at a time (Chats **or** Calls **or** Profile). Match
  `docs/shell-mockup.html` / `SHELL_TARGET.md`.
- NR-1: the **blocked** party still cannot see you. The **blocker** may open
  that profile and Unblock (`POLISH_TARGET.md` §7). Do not 404 the blocker’s
  own view.
- Definition of done: every applicable DoD row for **this slice**, with tests
green before you declare done.
- When finished: short summary of what shipped, what was deferred, commands to
  verify, and a **proposed commit message** — then stop for review. Do not
  create the commit unless the user asks.

---



## What you type in Cursor

### Normal case — just continue (P15 polish)

```
@docs/SESSION_STARTER.md @docs/CONVENTIONS.md @docs/POLISH_PLAN.md @docs/POLISH_PROGRESS.md

Continue.
```

The agent reads `POLISH_PROGRESS.md`, sees the next session id, executes that
`POLISH_PLAN.md` §5 brief, then **updates `POLISH_PROGRESS.md`**.

### After P15 (historical)

P14 shell (frozen at 14.8):

```
@docs/SESSION_STARTER.md @docs/CONVENTIONS.md @docs/SHELL_PLAN.md @docs/SHELL_PROGRESS.md

Continue.
```

Original port (frozen at 13.3):

```
@docs/SESSION_STARTER.md @docs/CONVENTIONS.md @docs/MASTER_PLAN.md @docs/PROGRESS.md

Continue.
```

### If you want to steer (optional extra line)

```
@docs/SESSION_STARTER.md @docs/CONVENTIONS.md @docs/POLISH_PLAN.md @docs/POLISH_PROGRESS.md

Continue. Mobile viewport first for 15.1.
```

### Override — jump to a specific session

```
@docs/SESSION_STARTER.md @docs/CONVENTIONS.md @docs/POLISH_PLAN.md

Session 15.1. Agent mode. Execute only that §5 brief. Stop when done.
```

---

## Agent: what "Continue." means

1. Read `POLISH_PROGRESS.md` (P15), else `SHELL_PROGRESS.md` (P14), else
   `PROGRESS.md` — "Next session" is your id.
2. Look up that row in `POLISH_PLAN.md` §5, `SHELL_PLAN.md` §5, or
   `MASTER_PLAN.md` §5.
3. Execute only that one session. Stop when done.
4. Update the progress file you read: advance "Last completed" / "Next session",
   fill in the new brief from the §5 table, add a row to "Completed".
5. Report: what shipped, what was deferred, commands to verify, and a proposed
   commit message. Do not create the commit unless the user asks.

The commit message is 1–2 sentences, focused on **why**, prefixed with the
session id (e.g. `Session 15.1: …`). Match the repository's existing message
style when there is one.

---
