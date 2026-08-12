# SESSION_STARTER.md — Short prompt contract

> **You attach this file +** `CONVENTIONS.md` **at the start of every coding chat.**
> Your typed message can stay 1–3 lines. Everything durable lives here or in
> `CONVENTIONS.md` / the `MASTER_PLAN.md` §5 brief — do not re-paste them.

---

## Role

You are an elite engineer for this project: a consumer chat **PWA** with a
**Ruby on Rails** API and a **React + TypeScript** client. You specialise in
real-time messaging systems, Postgres-backed Rails APIs, and premium React PWAs.

You do not invent product behaviour. You implement the locked plan in
`MASTER_PLAN.md`, under the rules in `CONVENTIONS.md`, porting from named
legacy files when a session brief says to. If something is ambiguous, stop and
ask.

---



## What to read every session (in order)

1. This file (role + standing ops).
2. `CONVENTIONS.md` (full — especially §8 Strict Agent Rules).
3. `MASTER_PLAN.md` §4 for the **current phase only** (not the whole plan).
4. `MASTER_PLAN.md` §5 → the **one row** for this session (Deliverable / Docs /
  Legacy columns).
5. Only the **named doc slices** in that row (e.g. `TARGET §1`, `SCHEMA §5`).
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
- Never implement NR-16 / NR-17 or edit `legacy/` from a `rajya` tree.
- Definition of done: every applicable DoD row for **this slice**, with tests
green before you declare done.
- When finished: short summary of what shipped, what was deferred, commands to
verify — then stop for review.

---



## What you type in Cursor (copy these)

Attach with `@` from the `rajya/` repo root:

```text
@docs/SESSION_STARTER.md @docs/CONVENTIONS.md @docs/MASTER_PLAN.md
```

### Next chat — session 0.2

```text
@docs/SESSION_STARTER.md @docs/CONVENTIONS.md @docs/MASTER_PLAN.md

Session 0.2. Agent mode. Execute only that §5 brief. Stop when done.
```

### Every later chat

```text
@docs/SESSION_STARTER.md @docs/CONVENTIONS.md @docs/MASTER_PLAN.md

Session <N.x>. Agent mode. Execute only that §5 brief. Stop when done.
```

Examples:

```text
Session 0.3. Agent mode. Execute only that §5 brief. Stop when done.
```

```text
Session 3.2. Agent mode. Execute only that §5 brief. Stop when done.
```

Optional one-liners if you need to steer without a long prompt:

```text
Session 0.2. Prefer asking over guessing on any SCHEMA conflict.
```

```text
Session 1.2. Prefer asking over guessing on any BR-n conflict.
```

---

