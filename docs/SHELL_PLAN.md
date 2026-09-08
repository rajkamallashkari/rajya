# SHELL_PLAN.md — P14 chrome revamp

> **Shell planning Step 4.** Execution plan for the shell only.
> Original port: [`MASTER_PLAN.md`](MASTER_PLAN.md) (frozen at 13.3).
> Agent contract: [`CONVENTIONS.md`](CONVENTIONS.md) + [`SESSION_STARTER.md`](SESSION_STARTER.md).
> Progress: [`SHELL_PROGRESS.md`](SHELL_PROGRESS.md).
>
> One session = one §5 brief. Do not start the next session unprompted.
> Visual lock: [`shell-mockup.html`](shell-mockup.html).

---

## §1 Scope

Rebuild **placement and chrome** to match [`SHELL_TARGET.md`](SHELL_TARGET.md).
Reuse Rajya APIs (conversations, accounts search, GIS `POST /auth/google`,
preferences, calls create/show). Add only what the gap table names
([`SHELL_GAP.md`](SHELL_GAP.md)).

Non-goals: NR-F6, NR-16/NR-17, new IdPs, channel/broadcast products.

---

## §2 Sequencing

14.1 (sign-in) before two-profile verification of 14.4.
14.2 (tabs) before 14.3–14.6 (they assume exclusive destinations).
14.5 (Profile tab) before 14.7 (settings stack hangs off the Profile gear).
14.6 may ship a thin call log from existing `calls` rows once index exists.

---

## §3 Phase map

| Session | Theme | Gap |
| --- | --- | --- |
| 14.1 | Auth gate: Google GIS + existing methods | G-1 |
| 14.2 | Tab chrome: rail + bottom bar | G-2 |
| 14.3 | Chats geometry: empty column + overlays | G-3 |
| 14.4 | Compose menu + New message / New group | G-4 |
| 14.5 | Profile tab + inline edit | G-5 |
| 14.6 | Calls tab + index + contact layer | G-6 |
| 14.7 | Settings stack completeness | G-7 |
| 14.8 | Playwright + two-profile DM | G-8 |

---

## §4 Session rules

Same as MASTER_PLAN: 100% coverage on touched tests, RuboCop on changed Ruby,
i18n for copy, OpenAPI before new HTTP, stop and ask if product is ambiguous.
Never implement Status/stories. Never edit `legacy/`.

Definition of done for each session: the Deliverable column, plus tests green.

---

## §5 Session briefs

| Session | Deliverable | Docs | Legacy to read |
| --- | --- | --- | --- |
| **14.1** | **AuthGate shows Google GIS** (popup → `POST /auth/google` `{ code }`, persist JWT, F-25). Keep password. Surface OTP/magic and passkey **using existing endpoints** when their flags are on. `VITE_GOOGLE_CLIENT_ID` from repo-root `.env`. README: Cloud Console JS origins `http://localhost:5173` + `127.0.0.1:5173`; two Chrome profiles = two Google users. If `GOOGLE_CLIENT_ID` is unset, hide the Google button (do not crash). | SHELL_TARGET §5; SHELL_AUDIT §2.2; TARGET F-25; session 2.2 notes in PROGRESS.md | Botverse login GIS if present; do not copy structure |
| **14.2** | Tab store: Chats / Calls / Profile. Desktop **left rail** (full height, edge-stuck). Mobile **bottom bar** (full width, three equal tabs, edge-stuck, safe-area). Switching a tab **replaces** the main surface — never both Calls and Profile. Stub Calls/Profile panes (empty or “coming in 14.5/14.6”). Hide bar when a nested chat/layer is open. Tests for exclusive destinations + bar visibility. | SHELL_TARGET §1; DESIGN_SYSTEM §6; [`shell-mockup.html`](shell-mockup.html) | — |
| **14.3** | Chats destination: **always** list + chat-or-empty welcome. Desktop details as **right overlays** (~420px), not a column that appears only when a layer exists. Settings must not occupy the chat pane. Restore last conversation when returning from Calls/Profile. First load: most recent chat if any. Stop auto-open fighting empty welcome. | SHELL_TARGET §1.3, §6; SHELL_AUDIT §2; DESIGN_SYSTEM §6 | `legacy/botverse/src/pages/HomePage.tsx`, `PanelHost.tsx`, `PanelShell.tsx` |
| **14.4** | Replace list FABs and the no-op empty **New chat** (`setQuery("")`). Header **compose** control (bubble+plus) → menu: New message, New group, Channel/Broadcast disabled Soon. New message layer: bots + **people** (`searchPeople` + `useStartDirectChat` / `createConversation`). Selecting a person or bot opens/creates the DM and pops the layer. New group uses existing create-group operation. Empty-state CTA opens compose. **DoD:** two signed-in humans can find each other and start a DM. | SHELL_TARGET §2; SHELL_AUDIT §2.1 | `legacy/botverse/src/components/sidebar/NewChatPanel.tsx`, Sidebar FABs |
| **14.5** | Profile tab: photo, name, username, bio; email/phone only when privacy prefs allow. Header **Edit** (inline form, Cancel/Save at bottom) and **Settings** (push hub layer). Remove settings gear and `/dev/*` links from the Chats header. Account switcher: long-press/right-click on identity. | SHELL_TARGET §3; SHELL_AUDIT §3 AccountDrawer | `NavBar.tsx`, `ProfileContent.tsx`, `ProfileEditPanel.tsx`, `AccountSwitcher.tsx` |
| **14.6** | `GET /api/v1/calls` paginated index (OpenAPI + operation + Pundit + serializer). Calls tab = log only. Row click → **peer profile layer** (not self profile). Live call overlays stay global. | SHELL_TARGET §4; SCHEMA calls table; existing create/show | Botverse has no Calls tab — do not invent WhatsApp extras beyond log + profile |
| **14.7** | Settings hub rows matching Botverse `AccountDrawer` (notifications, privacy, security, display, AI, starred, scheduled, devices, stickers, chats, bots, manage accounts). Each row is a stack layer over **existing** Rajya panels/APIs. Do not invent features. Privacy toggles for profile email/phone must actually hide those fields on the Profile tab. | SHELL_TARGET §3; SHELL_AUDIT §3 | `legacy/botverse/src/components/sidebar/AccountDrawer.tsx` and the named panels |
| **14.8** | Playwright (two contexts): sign-in (password always; Google when env present), compose New message, DM appears on both sides, tab exclusive, overlay back, mobile bar hidden in chat. i18n. RuboCop/Vitest on touched files. | SHELL_TARGET §7 | — |

### Sessions that must not be merged

- **14.1 and 14.4.** Auth and compose are different failure modes; merged, Google setup is skipped and New Chat still cannot be verified with two real users.
- **14.2 and 14.3.** Tab chrome without exclusive panes will recreate the mockup bug (Calls + Profile painted together). Geometry needs a working destination switch.
- **14.6 and anything.** New HTTP index + Pundit needs the whole session.

---

## §6 Local verification (not a session)

Until 14.1+14.4 ship, two Chrome profiles **cannot** Google-sign-in and **cannot**
start a human DM from New Chat. Workaround: password register two emails, then
still no people picker until 14.4 — only the bot directory.

After those sessions:

```
docker compose -f docker-compose.dev.yml up -d
cd backend && bin/rails db:prepare
cd .. && bin/dev
```

Open `http://localhost:5173` in two Chrome profiles. Google or password. Compose
→ New message → search the other display name / username.

---

## §7 Handoff

`SESSION_STARTER.md` Continue. attaches this file + `SHELL_PROGRESS.md` until
14.8 completes. Then restore MASTER_PLAN/PROGRESS as historical; do not delete
them.
