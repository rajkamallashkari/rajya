# Rajya

Consumer chat PWA — **Rails 8** API + **React 19 / TypeScript / Vite** client.

| | |
| --- | --- |
| Product | Rajya |
| Repo | `rajya` |
| Public URL | `https://rajya.pages.dev` |
| Token | `rajya` |

Session **0.4** shipped the Vite PWA shell: four token layers, `applyTheme` /
`deriveTypography`, i18next, shadcn `Button`, ESLint guards, and the 100% Vitest
gate.

---

---

## Layout

```
rajya/
  backend/                 Rails 8 API-only (session 0.2+)
  frontend/                React PWA
  docs/                    Planning + session contracts
  ops/                     Backup restore + coturn placeholders
  docker-compose.dev.yml   Postgres + Redis + Mailpit
  docker-compose.yml       Production stack (Oracle / self-host)
  .tool-versions           Ruby + Node via mise
  Procfile.dev             bin/dev: web, worker, vite
```

Legacy apps live **outside** this repo at `../legacy/{cognify,botverse}`
(workspace-relative). Never edit them from a `rajya` session.

---

## Prerequisites

- [Docker Desktop](https://www.docker.com/products/docker-desktop/) (Compose v2+)
- [mise](https://mise.jdx.dev/) for Ruby / Node versions from `.tool-versions`
  (`brew install mise` — then `mise install` in this directory)
- Optional: [cloudflared](https://developers.cloudflare.com/cloudflare-one/connections/connect-apps/) for phone HTTPS over WiFi

```bash
# Install toolchains declared in .tool-versions
mise install

# Start stateful deps only (hybrid DX — TARGET §1.2)
docker compose -f docker-compose.dev.yml up -d

# Health
docker compose -f docker-compose.dev.yml ps
open http://localhost:8025   # Mailpit UI
```

Postgres: `postgres://postgres:postgres@localhost:55432/rajya_development` (host port 55432, not 5432 — avoids clashing with a native Postgres)  
Redis: `redis://localhost:6380/0` (host port 6380, not 6379 — same reason)  
Mailpit SMTP: `localhost:1025` · UI: `http://localhost:8025`

Copy `.env.example` → `.env` when you start Rails (0.2).

---

## Working with the Agent

Every coding chat:

1. Attach `@docs/SESSION_STARTER.md` `@docs/CONVENTIONS.md` `@docs/MASTER_PLAN.md`
2. Type only the session id, e.g.:

```text
Session 0.2. Agent mode. Execute only that §5 brief. Stop when done.
```

Do not invent product behaviour. Port from named `legacy/` paths when the brief
says to. Full rules: `docs/CONVENTIONS.md` §8.

---

## Hosting (manual — session 0.1)

Oracle Always Free + Cloudflare Pages/Tunnel are **operator steps**. Capacity
refusal at Oracle signup is common (P0 risk R-1); fall back to self-host +
Tunnel using the same `docker-compose.yml`. Do not block local work on cloud.

### Cloudflare Pages

1. Create a Pages project named **`rajya`** (output URL `https://rajya.pages.dev`).
2. Connect this GitHub repo; build root `frontend/`; build command `npm run build`;
   output directory `dist`.
3. Custom domain is optional and out of the $0 default path.

### Cloudflare Tunnel (API / Cable)

1. Install `cloudflared` on the Oracle (or home) box.
2. Create a tunnel; route a hostname (or trycloudflare quick tunnel for smoke tests)
   to `http://localhost:3000` (web) — WebSockets must be enabled (default on free).
3. Production CORS / ActionCable allowlist: `https://rajya.pages.dev`.
4. Dev phone testing: `cloudflared tunnel --url http://localhost:5173` (and a
   second tunnel for the API). Add `https://*.trycloudflare.com` to CORS in 0.2.

### Oracle Always Free

1. Sign up (card for identity only — stay on free-only, not PAYG).
2. Create an ARM Ampere A1 instance (2 OCPU / 12 GB if available).
3. Clone this repo; install Docker; `docker compose up -d` once images exist.
4. Point Tunnel at the box. Open coturn UDP/TCP only as documented in
   `ops/coturn/` when calls land (P11).

### Postgres backup → R2

Until automation lands with the live DB:

1. `pg_dump -Fc` into `ops/backups/`.
2. Sync dumps to an R2 bucket (rclone or `wrangler`).
3. Restore check: `./ops/backups/restore.sh /path/to.dump rajya_scratch` then
   diff schema against production (P0 DoD).

### Meta WhatsApp app review (long-lead)

Submit `whatsapp_business_messaging` review during P0 (TARGET §4.8 / NR-9).
Not required to finish session 0.1; do not forget before P2.

---

## Brand

See `docs/BRAND_IDENTIFIERS.md`. Logos live under
`frontend/src/assets/brand/` (light/dark), copied from legacy botverse.

---

## Verify session 0.4

```bash
cd frontend
npm test                  # Vitest + 100% coverage
npm run lint              # ESLint including the five Rajya rules
npm run prove:lint        # each deliberate violation fails
npm run prove:coverage-gate
npm run typecheck
npm run test:e2e          # Playwright (installs Chromium on first run)
npm run dev               # Vite on http://localhost:5173
```

From the repo root, `bin/dev` starts Rails + the worker + Vite.

---

## What is deliberately not here yet

P0 foundation sessions 0.1–0.4 are done. Domain UI and auth start in **P1 / P2**.
