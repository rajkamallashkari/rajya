# POLISH_PLAN.md — P15 post-shell polish

> **P15 planning Step 4.** Execution plan for wire-up after P14.
> Original port: [`MASTER_PLAN.md`](MASTER_PLAN.md) (frozen at 13.3).
> Shell: [`SHELL_PLAN.md`](SHELL_PLAN.md) (frozen at 14.8).
> Agent contract: [`CONVENTIONS.md`](CONVENTIONS.md) + [`SESSION_STARTER.md`](SESSION_STARTER.md).
> Progress: [`POLISH_PROGRESS.md`](POLISH_PROGRESS.md).
>
> One session = one §5 brief. Do not start the next session unprompted.
> Visual lock for chrome: [`shell-mockup.html`](shell-mockup.html).

---

## §1 Scope

Fix the ten post-shell gaps in [`POLISH_GAP.md`](POLISH_GAP.md) to match
[`POLISH_TARGET.md`](POLISH_TARGET.md). Reuse Rajya APIs (send with
attachments/voice, calls active, blocks, username check, direct upload,
conversation members). Add HTTP only when 15.8’s NR-1 split needs a documented
profile payload.

Non-goals: NR-F6, NR-16/NR-17, new IdPs, channel/broadcast products, restoring
a PeerConnection across reload, reopening P14 briefs.

---

## §2 Sequencing

15.1 (mobile hits) before any overlay can be verified on a phone.
15.2 (voice) before 15.3 if both touch `sendMessage` — 15.3 may extend the same
client helper; do not merge the sessions.
15.5 (WebRTC) and 15.8 (authorization) must not merge with anything else.

---

## §3 Phase map

| Session | Theme | Gap |
| --- | --- | --- |
| 15.1 | Mobile overlay pointer-events + back | G-P1 |
| 15.2 | Voice note send | G-P2 |
| 15.3 | Send-arrow attach + schedule | G-P3 |
| 15.4 | Date chips → JumpDateSheet | G-P4 |
| 15.5 | Call controls + Return to call | G-P5 |
| 15.6 | Profile scroll, members, invites, common groups | G-P6 |
| 15.7 | Compose: drop bot icon, collapsible, group chips | G-P7 |
| 15.8 | Blocker profile + Unblock + banner | G-P8 |
| 15.9 | Profile edit: username debounce, avatar | G-P9 |
| 15.10 | Playwright / Vitest / i18n | G-P10 |

---

## §4 Session rules

Same as MASTER_PLAN: 100% coverage on touched tests, RuboCop on changed Ruby,
i18n for copy, OpenAPI before new HTTP, stop and ask if product is ambiguous.
Never implement Status/stories. Never edit `legacy/`. DS-13 composer chrome
stays.

Definition of done for each session: the Deliverable column, plus tests green.

---

## §5 Session briefs

| Session | Deliverable | Docs | Legacy to read |
| --- | --- | --- | --- |
| **15.1** | Mobile overlays receive taps and back. `.layer-frame-mobile` (and any frame inside `.layer-overlay-stack`) gets `pointer-events: auto`. Verify Profile settings, Calls contact, and Chats overlays. Buried layers stay inert. | POLISH_TARGET §1; POLISH_AUDIT §1; [`layers.css`](../frontend/src/styles/layers.css) | [`shell-mockup.html`](shell-mockup.html) stack/layer pointer-events |
| **15.2** | Voice send: `LiveThread` passes `onVoiceSend`; presign upload; `sendMessage` sends `attachment_signed_ids`, `voice_duration_ms`, `voice_waveform`. Optimistic voice bubble; rollback on failure. OpenAPI/TS if the generated client is missing voice fields. | POLISH_TARGET §2; POLISH_AUDIT §4 | `legacy/botverse/src/components/chat/ChatInput.tsx` voice send; `chatStore.sendVoiceNote` |
| **15.3** | Send-arrow menu: attach opens the existing picker and shows image/video previews; schedule is available for a non-empty text draft and Confirm immediately schedules it. Show a per-chat scheduled count/list above the composer. Rewrite and silent stay. Do not change DS-13. | POLISH_TARGET §2; POLISH_AUDIT §2 | `legacy/botverse/src/components/chat/ChatInput.tsx` attach/schedule |
| **15.4** | Date chips are buttons; they open `JumpDateSheet`. Remove the header calendar icon. Keyboard-focusable chips. Same `around_at` jump. | POLISH_TARGET §3; POLISH_AUDIT §3 | `legacy/botverse/src/components/chat/MessageView.tsx` `DateChip` |
| **15.5** | Video/voice control bar **visible on join**; idle auto-hide; tap toggles. Keep screen share. Reload: if `GET /api/v1/calls/active` is live, **Return to call** (new PC + signaling, then live chrome). If rejoin fails or nothing is active, hang up with **no** amber End-only bar. Stop `pagehide` hangup when rejoin is the intent. | POLISH_TARGET §4; POLISH_AUDIT §5–§6 | `legacy/botverse/src/components/call/` (controls only — do not copy End-only stuck bar) |
| **15.6** | `[data-profile-panel]` body scrolls. Groups: member list from conversation `members` + existing `InviteManager`. DM/bot: common groups from inbox cache. No new table. | POLISH_TARGET §5; POLISH_AUDIT §7 | `GroupInfoContent.tsx`, `ProfileContent.tsx` |
| **15.7** | Remove Bot icon between search and filter. New Message: collapsible Bots / People (default open). New group: avatar chips — hover (desktop) / tap (mobile) shows name + username; click chip or mobile X removes. | POLISH_TARGET §6; POLISH_AUDIT §8 | `NewChatPanel.tsx`, `GroupCreatorPanel.tsx` `SelectedChip` |
| **15.8** | NR-1 split: show-profile 404 only when **they** blocked you (or mutual). Blocker sees profile + Unblock; chat header works; thread banner. Privacy blocked list rows open profile. Search and new-DM gates unchanged. OpenAPI + Pundit + request specs. | POLISH_TARGET §7; POLISH_AUDIT §9; CONVENTIONS §7 | Botverse has no block list — do not invent extras beyond Unblock + banner + Privacy list |
| **15.9** | Profile edit: debounce username availability; avatar pick/preview/remove via existing direct-upload and me/avatar. Keep name/bio PATCH. | POLISH_TARGET §8; POLISH_AUDIT §10 | `legacy/botverse/src/components/panels/ProfileEditPanel.tsx` |
| **15.10** | Playwright/Vitest: mobile overlay back, voice bubble, date-chip jump, Return to call or no stuck bar, blocker profile + unblock, username/avatar edit. i18n. RuboCop on touched Ruby. | POLISH_TARGET §9 | — |

### Sessions that must not be merged

- **15.1 and anything.** Until overlays receive taps, phone verification of later sessions is false.
- **15.5 and anything.** Rejoin vs hangup is a separate WebRTC failure mode.
- **15.8 and anything.** The NR-1 split needs undivided authorization attention.

---

## §6 Local verification (not a session)

```
docker compose -f docker-compose.dev.yml up -d
cd backend && bin/rails db:prepare
cd .. && bin/dev
```

Phone or mobile viewport: open Profile → Settings and confirm back works
(15.1). Two Chrome profiles: send a voice note (15.2), jump from a date chip
(15.4). Reload during a call only after 15.5.

---

## §7 Handoff

`SESSION_STARTER.md` Continue. attaches this file + `POLISH_PROGRESS.md` until
15.10 completes. Then treat POLISH_* as history; do not delete them.
P14 SHELL_* and MASTER_PLAN 0.1–13.3 stay frozen.
