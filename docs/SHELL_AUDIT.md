# SHELL_AUDIT.md — What the Rajya shell does today

> **Shell planning Step 1.** Observation only. Target chrome is
> [`SHELL_TARGET.md`](SHELL_TARGET.md). Diff is [`SHELL_GAP.md`](SHELL_GAP.md).
> Visual lock: [`shell-mockup.html`](shell-mockup.html) (open in a browser).
>
> Original port (sessions 0.1–13.3) is complete. This audit is **chrome,
> placement, and the two local-testing holes** (sign-in methods, New Chat).
> Do not re-litigate schema, messaging, or bots.

---

## §1 Visual source of truth

[`shell-mockup.html`](shell-mockup.html) is the approved placeholder for:

- Desktop left rail + exclusive Chats / Calls / Profile destinations
- Mobile full-width bottom bar (hides in a nested chat or stack layer)
- Compose control (bubble + plus) with New message / New group (channel and
  broadcast marked Soon)
- Calls as a log only; a row opens a **contact profile layer**
- Profile as identity only; edit in place; settings as a **stack**

The real app must match this placement. Token colours may follow
`DESIGN_SYSTEM.md`; the mockup is not a pixel spec.

---

## §2 Rajya shell today

| Surface | File | What it does |
| --- | --- | --- |
| App chrome | `frontend/src/app/shell.tsx` | Auth gate, onboarding, `LayerHost`, auto-opens first conversation when the inbox is non-empty |
| Columns | `frontend/src/app/navigation/layer-host.tsx` | Desktop: list column always; chat column **only if** a conversation layer exists; details as a **third column**. Settings with no open chat therefore sit where the chat pane should be |
| Layer store | `frontend/src/shared/lib/navigation/layer-store.ts` | Kinds: `conversation`, `gallery`, `profile`, `settings`. One stack. `partitionLayers` treats non-conversation as “details” |
| Chat list | `frontend/src/features/conversations/components/conversation-list.tsx` | Logo + “Chats” + **settings gear** + `/dev/gallery` + `/dev/accounts`. Search field. Bot icon → bot directory sheet. Filter icon. Empty-list **New chat** button |
| Bot directory | `frontend/src/features/bots/components/bot-directory-sheet.tsx` | Lists bots; `createConversation({ account_id, kind: "direct" })` — **bots only** |
| Settings hub | `frontend/src/features/settings/components/settings-panel.tsx` | Appearance, Chats, Devices, Stickers (+ admin link). Not the Botverse Account drawer list |
| Auth gate | `frontend/src/features/auth/components/auth-gate.tsx` | Email + password register/login **only** |
| Calls | `frontend/src/features/calls/` | In-call UI, incoming banner, PiP. **No Calls tab. No call-log list.** `routes.rb` exposes `calls` create/show, not index |

### 2.1 New Chat is a no-op

`lists.empty_action` copy is “New chat”. The handler is `setQuery("")`
([`conversation-list.tsx`](../frontend/src/features/conversations/components/conversation-list.tsx)).
It does not open a panel, search people, or create a DM.

People search **API and client helper already exist**: `GET /api/v1/accounts/search`
and `searchPeople()` in `frontend/src/features/search/api/http.ts`. Direct
create already exists via `useStartDirectChat` (used only from the bot sheet).

Legacy behaviour to port (placement + flow, not structure):
[`legacy/botverse/src/components/sidebar/NewChatPanel.tsx`](../../legacy/botverse/src/components/sidebar/NewChatPanel.tsx)
— bots + people; selecting a row opens or creates a DM and closes the panel.

### 2.2 Sign-in methods vs what the gate shows

Session **2.2** shipped backend Google GIS: `POST /auth/google` with an auth
code in the body (F-25 — no `GET /google/callback`). Password, email OTP, and
magic link exist. Session **2.3** shipped passkeys.

The SPA gate never calls `/auth/google`. There is **no GIS script, no Google
button, and no `VITE_GOOGLE_CLIENT_ID`**. `.env.example` has commented
`GOOGLE_CLIENT_ID` / `GOOGLE_CLIENT_SECRET` for Rails only.

OTP, magic link, and passkey login are also absent from `AuthGate`.

**Local two-browser testing** (Chrome profile A + profile B, two Google
accounts on the same Wi-Fi) cannot use Google until the gate posts the GIS
code to `/auth/google`. Password register still works as a workaround; it
does not make New Chat work.

---

## §3 Botverse placement (legacy, read-only)

| Piece | Path | Behaviour to keep |
| --- | --- | --- |
| Home | `legacy/botverse/src/pages/HomePage.tsx` | Always list **and** chat-or-empty. Empty welcome + New chat |
| Panels | `PanelHost.tsx` / `PanelShell.tsx` | ~480px overlays on the right — **not** a replacement for the chat column |
| NavBar | `legacy/botverse/src/components/layout/NavBar.tsx` | Avatar click → self profile; long-press / right-click → account switcher |
| Settings list | `legacy/botverse/src/components/sidebar/AccountDrawer.tsx` | Full list: edit, notifications, privacy, security, display, AI, starred, scheduled, bots, manage accounts |
| New chat | `NewChatPanel.tsx` | Bots + people search → `openOrCreateDm` |

Botverse has **no** Chats/Calls/Profile rail and **no** call-log tab. Those
are new (locked in the mockup).

---

## §4 What we are not auditing

Messaging, receipts, bots engine, WebRTC mesh, admin, schema, NR-16/NR-17,
NR-F6 Status/stories. See [`MASTER_PLAN.md`](MASTER_PLAN.md) and
[`PRESERVATION.md`](PRESERVATION.md).
