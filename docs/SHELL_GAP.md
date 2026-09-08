# SHELL_GAP.md — Shell target minus Rajya today

> **Shell planning Step 3.** Each row is a session in [`SHELL_PLAN.md`](SHELL_PLAN.md).
> Evidence: [`SHELL_AUDIT.md`](SHELL_AUDIT.md). Target: [`SHELL_TARGET.md`](SHELL_TARGET.md).

---

| ID | Gap | Today | Target | Session |
| --- | --- | --- | --- | --- |
| G-1 | Sign-in chrome | `AuthGate` is email/password only. GIS backend exists; no SPA button. OTP/magic/passkey unused on the gate | Google GIS + existing methods on the gate. Two Chrome profiles can be two Google users | **14.1** |
| G-2 | Primary nav | No rail, no bottom bar, no Calls/Profile destinations | Exclusive Chats / Calls / Profile. Desktop rail; mobile full-width bar | **14.2** |
| G-3 | Chat geometry | `LayerHost` omits the chat column with no conversation; settings become the middle column | Always list + chat-or-empty. Details as right overlays. Restore last chat on tab return | **14.3** |
| G-4 | New Chat | Empty-list “New chat” only `setQuery("")`. Bot sheet is bots-only | Compose menu (bubble+plus). New message = bots **and** people (`searchPeople` + `createConversation`). New group. No list FABs | **14.4** |
| G-5 | Profile destination | Self profile is a layer; settings gear on the chat list; `/dev/*` in the header | Profile tab = identity + edit + settings stack. Privacy-gated email/phone | **14.5** |
| G-6 | Calls destination | In-call UI only; no index route | Calls tab = log; row → contact profile layer. `GET /api/v1/calls` | **14.6** |
| G-7 | Settings list | Hub is Appearance / Chats / Devices / Stickers | Botverse-width list wired to existing APIs; nested as stack layers | **14.7** |
| G-8 | Regression | Playwright covers layers-as-columns | Two-context DM; tab exclusive; overlay back; hide bar in chat; Google gate when credentials present | **14.8** |

---

## Not gaps (do not build)

- NR-F6 Status / stories
- Channel / broadcast products (disabled menu rows only)
- Replacing password auth
- Redesigning bubbles or the composer row (DS-13)
- Rewriting `MASTER_PLAN.md` 0.1–13.3
