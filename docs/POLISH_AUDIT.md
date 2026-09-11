# POLISH_AUDIT.md — What is broken after P14

> **P15 planning Step 1.** Observation only. Target: [`POLISH_TARGET.md`](POLISH_TARGET.md).
> Diff: [`POLISH_GAP.md`](POLISH_GAP.md). Chrome lock remains
> [`shell-mockup.html`](shell-mockup.html). P14 is complete — do not reopen those
> briefs.
>
> This audit is **wire-up, overlay hits, and a few Botverse surfaces that never
> landed**. Do not re-litigate schema, destinations, or GIS.

---

## §1 Mobile overlays ignore pointer events

[`.layer-overlay-stack`](../frontend/src/styles/layers.css) sets
`pointer-events: none`. Desktop frames restore hits with
`.layer-frame-overlay { pointer-events: auto }`.
`.layer-frame-mobile` does **not**.

Profile settings and Calls contact overlays render mobile frames **inside** that
stack:

- [`profile-destination.tsx`](../frontend/src/features/auth/components/profile-destination.tsx)
- [`calls-destination.tsx`](../frontend/src/features/calls/components/calls-destination.tsx)

Result: taps on the panel and the back control do nothing on a phone; desktop
works. Chats `LayerHost` mobile layers are often **direct** children of the host
(not the none-stack) and may still receive clicks — verify those overlays in
15.1 as well.

Mockup already does this correctly: `.stack { pointer-events: none }` →
`.layer { pointer-events: auto }` in [`shell-mockup.html`](shell-mockup.html).

---

## §2 Composer send menu

[`composer.tsx`](../frontend/src/features/composer/components/composer.tsx)
builds attach / schedule / rewrite / silent items. Attach and schedule call
optional `onAttach` / `onSchedule`.

[`conversation-thread.tsx`](../frontend/src/features/conversations/components/conversation-thread.tsx)
(`LiveThread`) passes `onRewrite` and `onSend` only. Menu opens; attach and
schedule are no-ops. Rewrite and silent send work.

Legacy: [`ChatInput.tsx`](../../legacy/botverse/src/components/chat/ChatInput.tsx)
— attach → media picker; schedule → schedule modal.

Composer unit tests mock the callbacks; LiveThread has no attach/schedule
integration coverage.

---

## §3 Jump-to-date

Header calendar in `conversation-thread.tsx` opens
[`jump-date-sheet.tsx`](../frontend/src/features/search/components/jump-date-sheet.tsx)
and jumps via `listMessages(..., { around_at })`. That path works.

[`date-divider.tsx`](../frontend/src/features/messages/components/date-divider.tsx)
is `role="separator"` only. [`virtualized-thread.tsx`](../frontend/src/features/conversations/components/virtualized-thread.tsx)
renders it with no click handler.

Legacy: [`MessageView.tsx`](../../legacy/botverse/src/components/chat/MessageView.tsx)
`DateChip` is a button that opens the jump overlay.

---

## §4 Voice note send

Mic → recorder → preview works. Send arrow runs `deliverVoice` →
`onVoiceSend?.(...)` then `recorder.cancel()`. `LiveThread` never passes
`onVoiceSend`, so the blob is discarded and no bubble appears.

Even if wired, [`sendMessage`](../frontend/src/features/conversations/api/http.ts)
omits `attachment_signed_ids`, `voice_duration_ms`, and `voice_waveform`.
Backend [`Messages::Send`](../backend/app/operations/messages/send.rb) already
accepts them. [`presignAndUpload`](../frontend/src/features/media/model/direct-upload.ts)
exists unused on this path.

Legacy: `ChatInput.tsx` `handleVoiceSend` → `chatStore.sendVoiceNote`.

---

## §5 Video call chrome

[`CallControlBar`](../frontend/src/features/calls/components/call-control-bar.tsx)
already has mute, camera, flip, speaker, hangup, and 1:1 screen share (Botverse
has no screen share). [`video-call-view.tsx`](../frontend/src/features/calls/components/video-call-view.tsx)
starts `chromeVisible` at **false**, so controls look missing until the feed is
tapped. Flip is gated by `useCanFlipCamera`.

---

## §6 Stuck call after reload

Zustand call store is in-memory. On boot,
[`use-signaling-channel.ts`](../frontend/src/features/calls/hooks/use-signaling-channel.ts)
→ `checkForStuckCall()` → `GET /api/v1/calls/active`. If the server still has a
live call, [`top-call-bar.tsx`](../frontend/src/features/calls/components/top-call-bar.tsx)
shows an amber bar with **End only**. No rejoin.

[`engine.ts`](../frontend/src/features/calls/lib/engine.ts) `pagehide` keepalive
hangup often races: reload reports “stuck” even though media is gone. Botverse
had the same End-only pattern.

A full reload cannot restore the old `PeerConnection`. Continue = new PC +
signaling if `GET /calls/active` still lists this account.

---

## §7 Profile overlay content

[`profile-panel.tsx`](../frontend/src/features/conversations/components/profile-panel.tsx)
`[data-profile-panel]` is a flex column with **no** `overflow-y-auto` on the
body. Long group info clips.

Groups: [`InviteManager`](../frontend/src/features/conversations/components/invite-manager.tsx)
is partial. **No member list UI.** Conversation show already embeds `members`
when `include_members: true`. Member mutate routes exist
(`POST`/`DELETE` …/members, promote/demote/transfer).

DM/bot: [`account-profile.tsx`](../frontend/src/features/auth/components/account-profile.tsx)
is name/block/memory only. **No common groups.** Botverse filters the local chat
list in [`ProfileContent.tsx`](../../legacy/botverse/src/components/panels/ProfileContent.tsx).
No dedicated common-groups API; client cache is enough.

Legacy group surface: [`GroupInfoContent.tsx`](../../legacy/botverse/src/components/panels/GroupInfoContent.tsx).

---

## §8 Compose directory

[`conversation-list.tsx`](../frontend/src/features/conversations/components/conversation-list.tsx)
still has a **Bot** icon between search and filter, opening
[`bot-directory-sheet.tsx`](../frontend/src/features/bots/components/bot-directory-sheet.tsx).
P14 New Message already lists bots.

[`compose-directory.tsx`](../frontend/src/features/conversations/components/compose-directory.tsx)
Bots / People labels are **not** collapsible. Legacy
[`NewChatPanel.tsx`](../../legacy/botverse/src/components/sidebar/NewChatPanel.tsx)
sections collapse.

[`new-group-panel.tsx`](../frontend/src/features/conversations/components/new-group-panel.tsx)
is checkbox rows only. Legacy
[`GroupCreatorPanel.tsx`](../../legacy/botverse/src/components/sidebar/GroupCreatorPanel.tsx)
`SelectedChip`: avatar strip; hover (desktop) / tap (mobile) shows name;
remove via click (desktop) or X (mobile).

---

## §9 Blocks

APIs exist: [`blocks.ts`](../frontend/src/features/auth/api/blocks.ts),
`GET`/`POST /api/v1/blocks`, `DELETE /api/v1/blocks/{id}`.

[`Accounts::ShowProfile`](../backend/app/operations/accounts/show_profile.rb)
returns `not_found` when `viewer.blocked_with?(account)` — **either** direction.
The blocker opening a chat header therefore sees a missing profile, not Unblock.

[`privacy-panel.tsx`](../frontend/src/features/settings/components/privacy-panel.tsx)
already lists blocked accounts with Unblock. It is easy to miss; rows do not
open a profile. No thread banner when you blocked the peer.

NR-1 as written: mutual invisibility in search/profiles; no new DMs; groups
unaffected. P15 **narrows** profile 404 to “they blocked you”, not “I blocked
them”. Search and new-DM gates stay.

---

## §10 Profile edit

[`self-profile-pane.tsx`](../frontend/src/features/auth/components/self-profile-pane.tsx)
saves name / username / bio via `PATCH /api/v1/users/me`. Username check exists
(`GET /api/v1/accounts/username`) but runs on save, not as live debounce.
**No avatar pick / preview / remove.** Direct-upload exists in the schema.

Legacy: [`ProfileEditPanel.tsx`](../../legacy/botverse/src/components/panels/ProfileEditPanel.tsx)
— debounce availability, JPEG/PNG/GIF/WebP ≤5MB, preview, remove avatar.

---

## §11 Out of scope for this audit

Destinations, GIS, Settings hub rows already shipped in P14. NR-F6, NR-16,
NR-17, channel/broadcast products, composer row chrome (DS-13).
