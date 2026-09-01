# PRESERVATION.md — Session 13.3 walk

> Verification-only. Every `AUDIT_REPORT.md` §1 feature, all 114 `BR-n`,
> NR-1…NR-48, NR-F1…NR-F12, and the `SCHEMA_DESIGN.md` §8 constants table.
> Machine-checked by `backend/spec/preservation/walk_spec.rb`.

---

## Outcome

| Check | Result |
| --- | --- |
| AUDIT §1 features | Shipped, cut (GAP §14), or recorded gap |
| BR-1…BR-114 | Covered by a named spec, **changed** (below), or recorded gap |
| NR-1…NR-48 | Shipped except **NR-16 / NR-17** (cut) |
| NR-F1…NR-F12 | Unbuilt; seams exist where the plan required them |
| SCHEMA §8 constants | Every named table row is a `Settings::Registry` key; admin PATCH takes effect with no restart |

**Recorded gaps (not on the GAP §14 cut list):**

1. **Link-preview unfurl (AUDIT §1.2, BR-20, BR-97).** Schema, gallery listing, `link_previews` flag, and the user pref exist. There is no fetch job, no URL extraction on send, and no SSRF client. First-three-URLs and radioactive-style pinning are therefore unverified.
2. **Receipt debounce (BR-109).** `receipt_debounce` is a registry row (400 ms). The thread posts `viewed` on `newestPosition` without reading it.

---

## AUDIT §1 — feature inventory

Cut list is GAP §14 only. Broadcast chats are channels.

### 1.1 Authentication and account

| Feature | Status |
| --- | --- |
| Google OAuth GIS popup / auth-code | Shipped (`POST /auth/google`) |
| Google server-redirect (admin) | **Cut** — GAP §14 #2 / F-25 |
| Email + password | Shipped |
| Email OTP | Shipped |
| Magic link | Shipped |
| Phone / SMS OTP | **Cut** — GAP §14 #1; WhatsApp click-to-verify (NR-9 / D-6) |
| WebAuthn passkeys | Shipped |
| Dev login bypass | Production-excluded (legacy `[V]`); not routed |
| Passkey App Lock | Shipped (no JWT) |
| Multi-account | Shipped; IndexedDB namespaced by `account_id` (D-7) |
| Onboarding wizard | Shipped |
| Verified contact change | Shipped (email OTP; phone via WhatsApp) |
| Account deletion | Shipped (`DELETE /users/me`; S-3 deactivate) |

### 1.2 Messaging

Shipped: send text/attachments/voice, reply, edit + history, unsend tombstone, forward, copy, pin (cap from settings), save, react, schedule + RRULE, regenerate, message info, mentions, jumbo emoji, read receipts (two watermarks), human typing (NR-3), ticks, global + in-chat search, jump-to-message/date, day separators, unread divider + summarize.

Changed: markdown is the **symmetric** DS-6 set (humans and bots). Chat kinds: `direct` / `group` / `channel` (was `broadcast`).

Gap: server-side OpenGraph unfurl (see Outcome).

### 1.3 Groups and permissions

Shipped: create, roles, promote/demote/transfer, add/remove, leave guards, title/description/avatar, invites, join requests, invite landing, channels, mute 1h/8h/24h/until-on. Soft `left`/`removed` (changes BR-49). Last-member leave retains the conversation (changes BR-52).

### 1.4 AI and bots

Shipped: seeded personas (fresh copy, GAP §14 #3), user bots, Bot Builder, streaming, cancel, summarization, rewrite, smart replies, translate, style profile (default off), shared memory (NR-11 / DS-1).

### 1.5 Media

Shipped: presign, blurhash, variants, album, lightbox, gallery, voice waveform, quota, buckets, orphan cleanup, bucket health. Membership-checked signed URLs (changes BR-94). Marcel sniff (changes BR-89).

### 1.6 Calls

Shipped: audio/video, mesh cap 4, banner, accept/decline/cancel/busy/timeout, PiP, controls, system history, ICE (coturn HMAC → Metered → STUN), ICE restart (changes BR-70), 1:1 screen share (NR-47).

### 1.7 Settings and personalization

Shipped: privacy, theme (split accents), typography −5…+5, time/date formats, quick reactions, security, notifications cascade, AI prefs, profile, accounts. Devices (NR-44), saved replies (NR-25), nicknames (NR-41), export (NR-32), stickers (NR-28), wallpaper (NR-42).

### 1.8 PWA and offline

Shipped: installable manifest, SW cache `rajya-v1`, Web Push, IndexedDB 200/chat (BR-107), outbox + Background Sync, catch-up via `revision`, offline banner.

### 1.9 Chat organization

Shipped: custom folders, All/Unread/Archived tabs, mute indicators, unread badges. Archive is NR-14.

### 1.10 Admin panel

Shipped as in-app React (NR-5), not ERB. Users, transcripts (escaped, F-10), bots, impersonation (NR-7), audit, dashboards, config editors (NR-6 / NR-48), moderation queue (NR-39), system sticker packs.

---

## BR-n — changed from the audit

These are deliberate target changes, each already named in SCHEMA or MASTER_PLAN. Specs assert the **new** behaviour.

| BR | Change |
| --- | --- |
| BR-9 | `reply_to_message_id` has an FK; cross-conversation replies are rejected |
| BR-13 | Independent copy; `is_forwarded` dropped; `forward_count` on the original |
| BR-26 | Reactions bump `revision` (sync hole closed) |
| BR-29 / BR-39 | No `messages.status`; ticks are computed (MIN over active humans) |
| BR-32 | `position` / `revision` are NOT NULL |
| BR-35 / BR-38 | Two watermarks + `receipt_marks`; unified `POST …/receipts` |
| BR-41 | Bots consume their own watermarks (S-9); not silently skipped |
| BR-46 / BR-47 | Username/name search honours `discoverable_by_username` |
| BR-49 / BR-50 | Soft `left`/`removed`; rejoin flips the row |
| BR-52 | Last member leave retains the conversation |
| BR-58 | Atomic `uses_count` increment (F-14) |
| BR-59 | Public unauthenticated invite preview |
| BR-61 | Leave clears folder entries and cancels that account's scheduled messages |
| BR-65 | Timeout emits `call_missed`, not cancel |
| BR-66 | Initiator `unsubscribed` cancels a still-ringing call |
| BR-70 | ICE restart up to `ice_restart_max_attempts` (F-32) |
| BR-72 | Model registry + fallbacks, not hardcoded OpenRouter |
| BR-79 | One cancellation key |
| BR-84 | Bot replies are rate-limited (F-12) |
| BR-85 | Rate limit fails **closed** |
| BR-89 | Marcel magic-byte sniff; malware scan still not added (GAP §14 #5) |
| BR-93 / BR-94 | Membership-checked short-lived URLs for every type |
| BR-96 | Processing retries and fails visibly (F-17) |
| BR-100 | DND in `locale.timezone` (F-21) |
| BR-101 | Mute checked once inside `Notifications::Resolve` |
| BR-102 | Resolver requires `message:` (F-9) |
| BR-106 | Client does not duplicate the edit window; server `Settings.fetch` is the gate |

Preserved rules are named in domain specs (`BR-n` in an example). Gaps: **BR-20**, **BR-97**, **BR-109** (see Outcome).

---

## NR-1…NR-48

Shipped per MASTER_PLAN §6 except:

| ID | Status |
| --- | --- |
| NR-16 | **Cut** — GAP §14 #6 |
| NR-17 | **Cut** — GAP §14 #6 |

No disappearing-message or view-once columns on `messages`.

---

## NR-F1…NR-F12 seams

| ID | Seam in the built system |
| --- | --- |
| NR-F1 | `preferences.data.ai.style_profile` |
| NR-F2 | `Ai::Provider#chat(..., images:)` and `ai_vision_models` (empty) |
| NR-F3 | `Ai::Provider#generate_image` and `ai_image_gen_models` (empty) |
| NR-F4 | Operations callable without HTTP; no `agent_tasks` table |
| NR-F5 | `messages.reply_to_message_id` (no thread surface) |
| NR-F6 | Declined; no stories tables |
| NR-F7 | `message_locations` are static points |
| NR-F8 | `export_jobs` only; no import operation |
| NR-F9 | `SignalingChannel` relays opaque payloads |
| NR-F10 | Declined; TLS + short-lived media URLs |
| NR-F11 | Impossible in a PWA; NR-16/17 cut |
| NR-F12 | Four shortcuts only (`SHORTCUTS`) |

---

## SCHEMA §8 constants

The named table in SCHEMA §8 maps onto `Settings::Registry` (see `settings_sweep_spec.rb`). Admin `PATCH /api/v1/admin/settings` writes `app_settings` and `Settings.fetch` reads the override with no process restart.

Build-time exceptions (SCHEMA §8): PWA manifest, `index.html` title, service-worker cache name.

---

## P13 DoD rows this session cannot execute

Installability on real iOS/Android hardware, locked-phone Web Push, and a 10k-message jank pass on a phone remain manual. Coverage gates and the configurability sweep are automated.
