# Brand identifiers — Rajya

Product name: **Rajya**  
Repository: `rajya`  
Public PWA URL: `https://rajya.pages.dev`  
Identifier token: `rajya` (replaces legacy `il` / `cognify` / `botverse` / `botiverse`)

## Seeded names (use these in sessions 0.2+)

| Surface | Value |
| --- | --- |
| Postgres development DB | `rajya_development` |
| Postgres test DB | `rajya_test` |
| Postgres production DB | `rajya_production` |
| Solid / Redis cache prefix | `rajya` |
| Cookie / session key prefix | `_rajya` |
| IndexedDB database name | `rajya` (namespaced further by `account_id` per CONVENTIONS) |
| Service worker cache prefix | `rajya-` |
| PWA manifest `name` / `short_name` | `Rajya` |
| `index.html` `<title>` | `Rajya` |

## Assets (copied in session 0.1)

| File | Source |
| --- | --- |
| `frontend/src/assets/brand/logo_light.png` | `legacy/botverse/src/assets/images/logo_light.png` |
| `frontend/src/assets/brand/logo_dark.png` | `legacy/botverse/src/assets/images/logo_dark.png` |
| `frontend/public/icons/icon-192.png` | legacy PWA icon |
| `frontend/public/icons/icon-512.png` | legacy PWA icon |
| `frontend/public/icons/badge-96.png` | legacy notification badge |
| `frontend/public/favicon.ico` | legacy favicon |

A theme-aware `Logo` component is built in session 0.4 / readiness Step 3.8;
until then these files are the brand seed only (replaceable later).
