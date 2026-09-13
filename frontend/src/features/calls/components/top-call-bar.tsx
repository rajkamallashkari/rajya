import { Mic, MicOff, Phone, PhoneOff, Video, VideoOff } from "lucide-react";
import { useTranslation } from "react-i18next";
import { useCallElapsed } from "@/features/calls/hooks/use-call-elapsed";
import {
  acceptCall,
  cancelCall,
  endCall,
  rejectCall,
  returnToCall,
  toggleCamera,
  toggleMic,
} from "@/features/calls/lib";
import { stopRingtone } from "@/features/calls/lib/ringtone";
import { DIRECT_PARTICIPANT_MAX } from "@/features/calls/model/constants";
import { isLiveCallStatus } from "@/features/calls/model/live";
import { useCallStore } from "@/features/calls/store/call-store";
import { cn } from "@/shared/lib/cn";
import { Button } from "@/shared/ui/button";
import { IconButton } from "@/shared/ui/icon-button";
import { ICON_CLASS } from "@/shared/ui/metrics";

const BAR_CLASS =
  "flex h-[var(--space-12)] items-center gap-[var(--space-1)] bg-[var(--accent)] px-[var(--space-1_5)] pt-[var(--safe-area-top)] text-[var(--accent-contrast)]";

const CONTROL_CLASS = "shrink-0 rounded-[var(--radius-full)]";

export function TopCallBar() {
  const { t } = useTranslation();
  const status = useCallStore((state) => state.status);
  const minimized = useCallStore((state) => state.minimized);
  const callType = useCallStore((state) => state.callType);
  const initiatorName = useCallStore((state) => state.initiatorName);
  const participants = useCallStore((state) => state.participants);
  const localStream = useCallStore((state) => state.localStream);
  const camOn = useCallStore((state) => state.camOn);
  const micOn = useCallStore((state) => state.micOn);
  const incomingSilenced = useCallStore((state) => state.incomingSilenced);
  const stuckCall = useCallStore((state) => state.stuckCall);
  const setMinimized = useCallStore((state) => state.setMinimized);
  const setIncomingPreview = useCallStore((state) => state.setIncomingPreview);
  const elapsed = useCallElapsed();
  const inCall = isLiveCallStatus(status);
  const showLiveBar = inCall && minimized;
  const showSilencedIncoming = status === "ringing-incoming" && incomingSilenced;
  const showStuck = !inCall && status !== "ringing-incoming" && Boolean(stuckCall);

  if (!showLiveBar && !showSilencedIncoming && !showStuck) {
    return null;
  }

  if (showStuck && stuckCall) {
    return (
      <div
        className="flex h-[var(--space-12)] items-center gap-[var(--control-gap)] bg-[var(--accent)] px-[var(--space-3)] pt-[var(--safe-area-top)] text-[var(--accent-contrast)]"
        role="status"
      >
        <Phone aria-hidden className={cn(ICON_CLASS, "shrink-0")} />
        <span className="min-w-0 flex-1 truncate text-[length:var(--text-sm)] [font-weight:var(--font-weight-emphasis)]">
          {t("calls.return_available", {
            kind: stuckCall.callType === "video" ? t("calls.title_video") : t("calls.title_audio"),
          })}
        </span>
        <Button
          className="h-[var(--touch-target-min)] shrink-0 rounded-[var(--radius-full)] bg-[var(--call-label-bg)] px-[var(--space-3)] text-[length:var(--text-xs)] text-[var(--text-inverse)]"
          onClick={() => void returnToCall()}
          type="button"
          variant="ghost"
        >
          <Phone aria-hidden className="h-[var(--space-3)] w-[var(--space-3)]" />
          {t("calls.return_to_call")}
        </Button>
      </div>
    );
  }

  if (showSilencedIncoming) {
    return (
      <div
        aria-live="polite"
        className="flex h-[var(--space-12)] items-center gap-[var(--space-2)] bg-[var(--accent)] px-[var(--space-2)] pt-[var(--safe-area-top)] text-[var(--accent-contrast)]"
        role="status"
      >
        <IconButton
          aria-label={t("calls.decline")}
          className={cn(CONTROL_CLASS, "bg-[var(--status-danger)] text-[var(--text-inverse)]")}
          onClick={() => {
            stopRingtone();
            void rejectCall();
          }}
          title={t("calls.decline")}
          type="button"
          variant="danger"
        >
          <PhoneOff aria-hidden className={ICON_CLASS} />
        </IconButton>
        <Button
          className="min-w-0 flex-1 justify-start truncate text-left text-[length:var(--text-sm)] text-[var(--accent-contrast)] hover:bg-[var(--call-chrome-muted)]"
          onClick={() => setIncomingPreview(true)}
          type="button"
          variant="ghost"
        >
          {t("calls.incoming_with", {
            kind: callType === "video" ? t("calls.kind_video") : t("calls.kind_audio"),
            name: initiatorName || t("calls.unnamed"),
          })}
        </Button>
        <IconButton
          aria-label={t("calls.accept")}
          className={cn(CONTROL_CLASS, "bg-[var(--status-success)] text-[var(--text-inverse)]")}
          onClick={() => {
            stopRingtone();
            void acceptCall();
          }}
          title={t("calls.accept")}
          type="button"
          variant="primary"
        >
          <Phone aria-hidden className={ICON_CLASS} />
        </IconButton>
      </div>
    );
  }

  const ringing = status === "ringing-outgoing";
  const connecting = status === "connecting";
  const video = callType === "video";
  const kindTitle = video ? t("calls.title_video") : t("calls.title_audio");
  const title =
    participants.length > DIRECT_PARTICIPANT_MAX
      ? t("calls.group_people", { people: participants.length })
      : initiatorName || kindTitle;
  const statusLabel = ringing ? t("calls.ringing") : connecting ? t("calls.connecting") : elapsed;
  const announcedState = ringing
    ? t("calls.ringing")
    : connecting
      ? t("calls.connecting")
      : t("calls.status_active");
  // Mic and camera can only act on tracks, so they stay hidden until media exists.
  const hasMedia = localStream !== null;
  const micLabel = micOn ? t("calls.mute") : t("calls.unmute");
  const camLabel = camOn ? t("calls.video_off") : t("calls.video_on");
  const KindIcon = video ? Video : Phone;

  return (
    <div className={BAR_CLASS}>
      <Button
        aria-label={t("calls.maximize", { name: title, status: statusLabel })}
        className="flex min-h-[var(--touch-target-min)] min-w-0 flex-1 items-center justify-start gap-[var(--space-2)] rounded-[var(--radius-md)] px-[var(--space-2)] text-left text-[var(--accent-contrast)] hover:bg-[var(--call-chrome-muted)]"
        onClick={() => setMinimized(false)}
        type="button"
        variant="ghost"
      >
        <KindIcon aria-hidden className={cn(ICON_CLASS, "shrink-0")} />
        <span className="min-w-0 flex-1 truncate text-[length:var(--text-sm)] [font-weight:var(--font-weight-emphasis)]">
          {title}
        </span>
        <span className="shrink-0 text-[length:var(--text-sm)] font-normal tabular-nums opacity-[var(--opacity-queued)]">
          {statusLabel}
        </span>
      </Button>
      {hasMedia ? (
        <IconButton
          aria-label={micLabel}
          aria-pressed={!micOn}
          className={cn(
            CONTROL_CLASS,
            "text-[var(--accent-contrast)]",
            micOn ? "hover:bg-[var(--call-chrome-muted)]" : "bg-[var(--status-danger)]",
          )}
          onClick={() => toggleMic()}
          title={micLabel}
          type="button"
          variant="ghost"
        >
          {micOn ? (
            <Mic aria-hidden className={ICON_CLASS} />
          ) : (
            <MicOff aria-hidden className={ICON_CLASS} />
          )}
        </IconButton>
      ) : null}
      {hasMedia && video ? (
        <IconButton
          aria-label={camLabel}
          aria-pressed={!camOn}
          className={cn(
            CONTROL_CLASS,
            // Narrow viewports keep only mute and end call.
            "hidden text-[var(--accent-contrast)] sm:inline-flex",
            camOn ? "hover:bg-[var(--call-chrome-muted)]" : "bg-[var(--status-danger)]",
          )}
          onClick={() => toggleCamera()}
          title={camLabel}
          type="button"
          variant="ghost"
        >
          {camOn ? (
            <Video aria-hidden className={ICON_CLASS} />
          ) : (
            <VideoOff aria-hidden className={ICON_CLASS} />
          )}
        </IconButton>
      ) : null}
      <IconButton
        aria-label={t("calls.end")}
        className={cn(CONTROL_CLASS, "bg-[var(--status-danger)] text-[var(--text-inverse)]")}
        onClick={() => {
          if (ringing) {
            void cancelCall();
            return;
          }
          void endCall();
        }}
        title={t("calls.end")}
        type="button"
        variant="danger"
      >
        <PhoneOff aria-hidden className={ICON_CLASS} />
      </IconButton>
      <span className="sr-only" role="status">
        {t("calls.bar_state", { state: announcedState, title })}
      </span>
    </div>
  );
}
