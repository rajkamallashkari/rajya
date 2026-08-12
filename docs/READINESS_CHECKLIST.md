# READINESS_CHECKLIST.md — Bridge to First Coding Session

> **Step 5 deliverable.** Short, ordered checklist from "planning approved" to
> the first green P0 commits. Full phase detail lives in `MASTER_PLAN.md`.
> Session rules live in `CONVENTIONS.md`.
>
> **Do not start Agent-mode implementation until this checklist's Gate 0 items
> are checked and you have explicitly green-lit coding.**

**Product / repo:** Rajya / `rajya` · **URL:** `https://rajya.pages.dev`

---

## Gate 0 — Planning freeze (this step)

- [x] Steps 1–4 approved (`AUDIT_REPORT`, `TARGET_ARCHITECTURE`, `SCHEMA_DESIGN`, `DESIGN_SYSTEM`, `GAP_ANALYSIS`, `MASTER_PLAN`)
- [x] Step 5 toolkit present: `CONVENTIONS.md`, refined schema/design, this checklist
- [x] Repo name locked: **`rajya`** (not `network`)
- [x] Call handling locked: **PWA Web Push + Service Worker** deep links (no native wrapper)
- [x] Tier 1 config locked: `app_settings` + `feature_flags` + `translation_strings` + `theme_overrides`
- [x] Testing locked: RSpec + Vitest (+ Playwright) inside every phase DoD; 100% coverage gate
- [x] NR-16 / NR-17 cut (no disappearing messages, no view-once media)
- [x] Message formatting: **symmetric** for humans and bots (DS-6)

**Your explicit "start coding" approval is still required after reviewing Step 5.**

---

## Step 1 — Scaffold the monorepo

| # | Task | Done when |
| --- | --- | --- |
| 1.1 | Create git repo `rajya/` with `backend/`, `frontend/`, `docs/` | Layout matches `MASTER_PLAN.md` §1 — **done (0.1)** |
| 1.2 | Move planning markdown into `docs/` | All seven planning docs + `CONVENTIONS.md` + this file versioned — **done (0.1)** |
| 1.3 | Move `cognify/` + `botverse/` to `../legacy/` (or workspace `legacy/`) **outside** the repo; set read-only | Agents cannot reach legacy from repo root — **done (0.1)** |
| 1.4 | Add root `README.md`, `.tool-versions` (Ruby + Node via mise), `.gitignore` | `mise install` works on both Macs — **done (0.1)** |
| 1.5 | Add `docker-compose.dev.yml` (Postgres, Redis, Mailpit) | `docker compose -f docker-compose.dev.yml up` healthy — **done (0.1)** |
| 1.6 | Add production `docker-compose.yml` skeleton (web, worker, postgres, redis, ollama, coturn) | File present; not required to deploy yet — **done (0.1)** |
| 1.7 | Path-filtered GitHub Actions stub | Docs-only change skips RSpec; placeholder jobs exist — **done (0.1)** |

**Exit:** Empty monorepo structure committed; legacy isolated. **Met in session 0.1.**

---

## Step 2 — Database and Rails API skeleton

| # | Task | Done when |
| --- | --- | --- |
| 2.1 | `rails new` API-only app in `backend/` (Rails 8) | Boots against Compose Postgres |
| 2.2 | Enable extensions: `citext`, `vector` (pgvector) | First migration |
| 2.3 | Wire Solid Queue (separate worker process), Redis cable/cache adapters with Solid fallbacks | Config matches `TARGET_ARCHITECTURE.md` §1–§3 |
| 2.4 | Layers stubbed: `operations/`, `queries/`, `serializers/` (Alba), policies with `verify_authorized` | Folder + base classes exist |
| 2.5 | `GET /up` + `GET /health` | NR-10 green locally |
| 2.6 | RSpec + SimpleCov 100% gate + FactoryBot + rswag | Empty suite green; gate enforced |
| 2.7 | RuboCop (incl. magic-number / string cops as planned) | CI fails on violation |
| 2.8 | Tier 1 registries stubbed: `Settings`, `FeatureFlag`, string catalog loader | Defaults load from code |

**Exit:** API boots; health endpoints; test gate on; no domain tables required yet beyond what P0.2 lists.

---

## Step 3 — Base frontend (Vite PWA)

| # | Task | Done when |
| --- | --- | --- |
| 3.1 | Vite + React 19 + TS app in `frontend/` | `bin/dev` / `npm run dev` works |
| 3.2 | Tailwind v4 + token file from `DESIGN_SYSTEM.md` §3 (concrete hex tables) | Light/dark via `html.dark`; no FOUC script stub |
| 3.3 | shadcn/ui + Radix primitives bootstrap in `shared/ui/` | `Button` exists; ESLint bans raw `<button>` outside `shared/ui/` |
| 3.4 | Feature folder skeleton + TanStack Query + Zustand pattern | Matches `CONVENTIONS.md` §3 |
| 3.5 | PWA manifest (`Rajya`), service worker shell, VAPID placeholder | Installable on localhost / cloudflared HTTPS |
| 3.6 | Vitest 100% gate + Testing Library + Playwright stub | Gates green on empty/smoke tests |
| 3.7 | i18next + `t()` + ESLint ban on hardcoded user-facing strings | Lint fails on literal copy |
| 3.8 | Brand: logo light/dark from legacy assets via shared `Logo` | Theme-aware |

**Exit:** Demoable empty shell with tokens, PWA shell, and test gates.

---

## Step 4 — Local DX glue (before domain work)

| # | Task | Done when |
| --- | --- | --- |
| 4.1 | Root `Procfile.dev` / `bin/dev` (web, worker, vite) | One command runs the stack |
| 4.2 | CORS + ActionCable origins: localhost + `*.trycloudflare.com` | Documented in README |
| 4.3 | OpenAPI generation pipeline stub + `openapi-typescript` | Drift check job exists (may be empty schema) |
| 4.4 | Copy `CONVENTIONS.md` session-start template into README "Working with the Agent" | Future sessions have a paste target |

**Exit:** Ready for `MASTER_PLAN.md` P0 session **0.1** (and remaining P0 items) in Agent mode.

---

## First Agent-mode session (after your go-ahead)

1. Feed: `docs/CONVENTIONS.md` + `docs/MASTER_PLAN.md` §1 + P0 / session 0.1 brief.
2. Execute P0.1 deliverables from the plan (hosting identifiers, Compose, CI, brand).
3. Do **not** skip ahead to messaging or UI polish until P0 definition of done is green.

---

## Quick reference — locked decisions

| Topic | Decision |
| --- | --- |
| Monorepo | `rajya/` → `backend/` + `frontend/` + `docs/` |
| Hosting | Oracle Always Free + Cloudflare Pages + Tunnel |
| Realtime | ActionCable (Redis when available) |
| Calls notify | Web Push + SW click-to-open |
| Config | Tier 1 (flags, settings, strings, theme overrides) |
| Tests | RSpec + Vitest + Playwright; 100% coverage; tests in every phase DoD |
| Formatting | Symmetric restricted markdown (DS-6) |
| Cut | NR-16 (disappearing messages), NR-17 (view-once media) |

---

**End of readiness checklist.** Stop here for review; implementation starts only on your explicit approval.
