# POLISH_TARGET.md — Locked P15 UX

> **P15 planning Step 2.** Wire-up after the P14 shell. Chrome:
> [`SHELL_TARGET.md`](SHELL_TARGET.md) + [`shell-mockup.html`](shell-mockup.html).
> Status/stories (NR-F6) stays **out**.

---

## §1 Mobile layers

Any overlay or stack layer on a phone must receive taps, including back.
`.layer-overlay-stack` may stay `pointer-events: none`; **every** visible
`.layer-frame-mobile` (and overlay frame) must set `pointer-events: auto`,
matching the mockup. Buried layers stay `inert` / `aria-hidden` as in 1.4.

---

## §2 Composer

Send-arrow long-press / right-click:

| Item | Behaviour |
| --- | --- |
| Attach | Opens the existing attach picker; images/videos become small composer previews; send uses `attachment_signed_ids` |
| Schedule | Shown for a non-empty text draft; opens the time sheet; Confirm immediately creates the scheduled message. A per-chat count above the composer opens that chat's scheduled-message list |
| Rewrite | Unchanged |
| Silent | Unchanged |

Scheduled messages are text-only until the scheduled-message API owns durable
attachment references; never silently drop composer attachments.

Voice: after preview, send uploads the blob (`presignAndUpload`), then
`Messages::Send` with `attachment_signed_ids`, `voice_duration_ms`,
`voice_waveform`. Optimistic voice bubble immediately; rollback on failure.
Composer chrome (mic · textarea · send) stays DS-13.

---

## §3 Jump-to-date

No calendar icon in the chat header. Date chips in the thread are **buttons**
(keyboard-focusable). Click / activate opens the existing `JumpDateSheet`
(bottom sheet). Same `around_at` jump as the old header path.

---

## §4 Calls

**Controls.** On joining a video (or voice) call, the control bar is **visible**.
After a short idle it may auto-hide; tap the feed toggles. Keep mute, camera,
flip (when multiple cameras), speaker, hangup/cancel, and 1:1 screen share.

**Reload.** A full reload cannot restore the old `PeerConnection`.

- If `GET /api/v1/calls/active` returns a live call for this account: show
  **Return to call** (not End-only amber). Tapping rejoins with a **new** PC
  and signaling, then the normal live chrome.
- If rejoin is impossible (no active call, getUserMedia denied, peer gone,
  signaling failure): hang up immediately. **Do not** leave a warning bar.
- Do not `pagehide`-hangup when the intent is that a reload can rejoin.

---

## §5 Peer / group profile overlay

`[data-profile-panel]` body scrolls (`overflow-y-auto`, `min-h-0`).

**Group:** members list (from conversation `members`) plus the existing invite
manager, Botverse `GroupInfoContent` placement — not a new invite protocol.

**Direct / bot:** common groups from the inbox query cache (same conversation
id in both memberships). Opening a row opens that group. No new table.

---

## §6 Compose directory

- Remove the Bot icon between search and filter. Bots remain in New Message
  and Settings → Manage Bots.
- New Message: **Bots** and **People** sections collapsible (default open).
- New group: selected-member **avatar chips** above the list. Desktop hover
  shows name + username; click chip removes. Mobile tap expands name +
  username; a cross removes. Legacy `GroupCreatorPanel` `SelectedChip`.

---

## §7 Blocks (NR-1 split)

| Viewer | Profile of the other account |
| --- | --- |
| You blocked them | Profile **loads**, with **Unblock**. Chat header still opens the panel. Thread shows a blocked banner |
| They blocked you | `404` / missing — NR-1 unchanged |
| Mutual | Treat as they blocked you for show-profile |

Search and **new** DMs stay gated (NR-1). Existing memberships (groups, an
already-open DM) stay. Privacy → blocked list stays and is easy to find;
rows open that profile. Do not invent a second block store.

---

## §8 Self profile edit

Inline edit on the Profile tab:

- Name, username, bio (existing PATCH).
- Username: debounce `GET /api/v1/accounts/username`; show available / taken /
  invalid before save (Botverse `ProfileEditPanel`).
- Avatar: pick (JPEG/PNG/GIF/WebP, existing size cap), preview, remove via
  existing me/avatar + direct-upload. No new IdP or crop editor unless already
  in Rajya.

Email/phone on the **view** surface stay privacy-gated (P14).

---

## §9 Extra UX (same sessions, not extra rows)

Optimistic voice bubble; date chips as real buttons; Return to call uses live
call chrome; blocked-list rows open profile; video controls visible on join
then idle-hide.
