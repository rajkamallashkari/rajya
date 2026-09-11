# POLISH_GAP.md — P15 target minus Rajya today

> **P15 planning Step 3.** Each row is a session in [`POLISH_PLAN.md`](POLISH_PLAN.md).
> Evidence: [`POLISH_AUDIT.md`](POLISH_AUDIT.md). Target: [`POLISH_TARGET.md`](POLISH_TARGET.md).

---

| ID | Gap | Today | Target | Session |
| --- | --- | --- | --- | --- |
| G-P1 | Mobile overlay hits | `.layer-overlay-stack` is `pointer-events: none`; `.layer-frame-mobile` never restores `auto` | Taps and back work on Profile/Calls/Chats overlays | **15.1** |
| G-P2 | Voice send | `onVoiceSend` unwired; `sendMessage` lacks voice/attachment fields | Upload + send + optimistic voice bubble | **15.2** |
| G-P3 | Send menu attach/schedule | Optional callbacks never passed from `LiveThread` | Attach picker + schedule bar actually send | **15.3** |
| G-P4 | Jump-to-date | Header calendar works; date chips are separators | Chips open `JumpDateSheet`; no header calendar | **15.4** |
| G-P5 | Call chrome + stuck bar | Controls start hidden; reload shows End-only amber bar | Visible-on-join; Return to call or silent hangup | **15.5** |
| G-P6 | Profile overlay | No overflow; no group members; weak invites; no common groups | Scroll; members + invites; common groups from inbox cache | **15.6** |
| G-P7 | Compose extras | Bot icon on list; flat New Message; no group chips | Drop icon; collapsible sections; SelectedChip strip | **15.7** |
| G-P8 | Blocker profile | `blocked_with?` 404s both ways; Privacy list easy to miss | Blocker sees profile + Unblock; list + thread banner | **15.8** |
| G-P9 | Profile edit | Save-only username check; no avatar | Debounced availability; avatar upload/remove | **15.9** |
| G-P10 | Regression | Playwright covers P14 shell, not these paths | Flows for mobile overlay, voice, jump, rejoin, block, edit | **15.10** |

---

## Not gaps (do not build)

- NR-F6 Status / stories
- Channel / broadcast products
- New common-groups table
- Restoring a PeerConnection across reload (impossible; rejoin is a new PC)
- Changing DS-13 composer chrome
- Reopening P14 destination / GIS briefs
