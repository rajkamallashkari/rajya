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

Compose runs `backup` as a sidecar: `pg_dump -Fc` every 24h into a volume,
pruned after `BACKUP_RETENTION_DAYS` (default 14). When `R2_ENDPOINT` is set and
`rclone` is on the image path, dumps are copied to `r2:rajya-backups`.

Restore drill (CI runs this against the test database). Client tools must be
Postgres 17; if the host `pg_dump` is older, the scripts run
`pgvector/pgvector:pg17` via Docker. Use a dump directory Docker can mount
(the repo `tmp/` path, not macOS `/var/folders`):

```bash
DATABASE_URL=postgres://postgres:postgres@localhost:55432/rajya_development \
  ./ops/backups/drill.sh
```

Manual restore into a scratch database:

```bash
DATABASE_URL=postgres://postgres:postgres@localhost:55432/rajya_production \
  ./ops/backups/restore.sh /path/to.dump rajya_scratch
```

Then diff schema (`pg_dump --schema-only`) against production before promoting.

### Monitoring

- **Uptime:** point UptimeRobot (or equivalent) at `GET /health` on the Tunnel
  hostname. `/up` is liveness only and will stay green while Postgres is down.
- **Errors:** set `SENTRY_DSN` (API) and `VITE_SENTRY_DSN` (Pages build). Both
  ends no-op when unset. Unhandled exceptions are logged either way.
- **Jobs:** the in-app admin dashboard (`/admin`) is the Solid Queue dashboard —
  ready/failed/scheduled/process counts.
- **Capacity (S-5):** `Monitoring::CapacityAlertJob` mails admins when an R2
  bucket or the disk at `DISK_ALERT_PATH` (default `/`) reaches
  `capacity_alert_threshold` (80%). Repeat mail is gated by
  `capacity_alert_cooldown`.

### Content Security Policy

Enforced on the API (Rails) and on Pages (`frontend/public/_headers`).
`connect-src` includes Pages, the Tunnel API / Cable (`wss:`), R2, OSM tiles,
and Tenor. Permissions-Policy grants `camera`, `microphone`, `display-capture`,
and `geolocation` to self. Set `VITE_API_ORIGIN` / `API_ORIGIN` to the Tunnel
hostname when it is not a `*.trycloudflare.com` URL.

### Web Push (session 10.2)

Set `VAPID_PUBLIC_KEY`, `VAPID_PRIVATE_KEY`, and `VAPID_SUBJECT` in `.env`
(generate with `bundle exec ruby -e 'k=WebPush.generate_key; puts k.public_key, k.private_key'`
from `backend/`). Manual check: install the PWA on a locked phone, send a DM,
tap the notification — it should open `/c/:id` for the right account. iOS only
delivers Web Push to an installed PWA, not a Safari tab.

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
