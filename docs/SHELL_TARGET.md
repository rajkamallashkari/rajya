# SHELL_TARGET.md — Locked shell IA

> **Shell planning Step 2.** Product chrome after P14. Visual:
> [`shell-mockup.html`](shell-mockup.html). Amend
> [`DESIGN_SYSTEM.md`](DESIGN_SYSTEM.md) §6 to match this file.
>
> Status/stories (NR-F6) is **out**. Channel and broadcast **menus** may exist
> as disabled “Soon”; do not invent those products.

---

## §1 Primary destinations

Exactly three: **Chats**, **Calls**, **Profile**. Switching a destination
**replaces the entire main surface** (everything right of the desktop rail /
above the mobile bar). Never paint two destinations at once.

| Destination | Main surface |
| --- | --- |
| **Chats** | Chat list + always-visible chat **or** empty welcome. Overlays/layers for compose, peer profile, gallery |
| **Calls** | Call log only. A row pushes a **contact profile** onto the layer stack. No settings, no self-profile chrome |
| **Profile** | Self: photo, display name, username, bio. Email and phone **only** if that account’s privacy prefs expose them. Header: **Edit** and **Settings** |

### 1.1 Desktop

- Left **rail** stuck to the left edge, full height: Chats / Calls / Profile.
- Chats: list (~340px) | chat column (flex) | stack layers ~420px from the right over the chat (Botverse `PanelHost`, not a third *column* that appears only when a layer exists).
- Calls / Profile: remaining width is that destination alone.

### 1.2 Mobile

- Bottom bar **full width**, three equal tabs, stuck to the bottom edge
  (WhatsApp-style, safe-area padded). Not floating.
- Bar **hides** while a conversation is full-screen or a stack layer is open.
  Back returns to the tab’s root with the bar visible.
- Nested surfaces are full-screen layers with back (history: one pop per back).

### 1.3 Restore

- Leaving Chats for Calls/Profile and returning **restores the last open
  conversation**.
- First load: open the most recently active conversation if the inbox is
  non-empty; otherwise empty welcome (logo + New chat).

---

## §2 Chats compose

No FABs over the list.

Header control: **message bubble with a plus**. Opens a menu:

| Item | Action |
| --- | --- |
| New message | Layer: bots + people (`GET /api/v1/accounts/search` + existing bot list). Select → `createConversation` direct (or open existing) and close the layer |
| New group | Layer: pick people → existing `Conversations::CreateGroup` |
| New channel | Disabled, “Soon” (`broadcast_channels` stays a flag; no UI) |
| New broadcast | Disabled, “Soon” |

Empty-inbox “New chat” opens the same menu (or New message directly).

Search field on the list **filters the inbox**; it is not people-search.

---

## §3 Profile

- **View:** avatar, name, username, bio; email/phone rows iff privacy toggles
  allow (`preferences.data.privacy` — do not invent new columns).
- **Edit:** same fields become inputs; **Cancel** / **Save** at the bottom of
  the pane. Uses existing `PATCH /api/v1/users/me` (and avatar upload if
  already wired).
- **Settings:** gear pushes the **full settings hub** as a stack (Botverse
  `AccountDrawer` rows, wired to existing Rajya panels/APIs). A row pushes
  another layer; back pops one.

Avatar long-press / right-click on identity chrome still opens the **account
switcher** (existing multi-account store). Avatar click on the Chats header
is not required; Profile is a tab.

Strip `/dev/gallery` and `/dev/accounts` from production chrome. Routes stay.

---

## §4 Calls

- Log of this account’s calls (needs `GET /api/v1/calls` index — create/show
  already exist).
- Row click → contact (or group) profile **layer**, not a self-profile view.
- Live call UI (banner, full-screen, PiP) stays **global**, above tabs.

---

## §5 Sign-in (blocking for two-profile tests)

AuthGate must expose **every method the backend already has**, not only
password:

| Method | Backend | Gate |
| --- | --- | --- |
| Google GIS | `POST /auth/google` `{ code }` (F-25) | **Must ship** — GIS popup, JWT in body |
| Email + password | `/auth/register`, `/auth/login` | Keep |
| Email OTP / magic link | passwordless_auth | Surface if flags on |
| Passkey | `passkey_auth` | Surface if flags on |

**Local Google (two Chrome profiles):**

1. Google Cloud OAuth client (Web). Authorized JavaScript origins:
   `http://localhost:5173` and `http://127.0.0.1:5173`. Authorized redirect
   URIs unused (GIS code flow, no redirect).
2. `GOOGLE_CLIENT_ID` and `GOOGLE_CLIENT_SECRET` in `rajya/.env` (Rails).
3. `VITE_GOOGLE_CLIENT_ID` in the same `.env` (Vite `envDir` is repo root) —
   same client id string.
4. Profile A signs in with Google account A; profile B with Google account B.
   Each profile has its own origin storage → two JWTs. Then New message can
   find the other account via people search (discoverability prefs permitting).

Password register remains valid for agents/CI without Google credentials.

Do not add Apple, GitHub, or other IdPs.

---

## §6 History and layers

Inside a destination, layers keep the session **1.4** contract: each push is
a history entry; browser back and edge-swipe pop one; scroll preserved;
buried layers mounted and inert.

**Tab switches are not layer pushes.** They swap the destination. The Chats
conversation restore is destination state, not a stack entry.

Desktop details are **overlays** (stacked panels), not
`LayerHost`’s current “add a column only when details exist”.

---

## §7 Verification clients

Same Wi-Fi:

1. Chrome profile A — laptop
2. Chrome profile B — laptop
3. Optional: Chrome on a phone (LAN or `cloudflared`; TARGET §1.2)

Minimum: A and B can both sign in, search each other, start a DM, and message.
