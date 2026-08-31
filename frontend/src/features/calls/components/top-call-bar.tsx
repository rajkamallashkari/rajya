import { AlertTriangle, Mic, MicOff, Phone, PhoneOff } from "lucide-react";
import { useTranslation } from "react-i18next";
import { useCallElapsed } from "@/features/calls/hooks/use-call-elapsed";
import { acceptCall, cancelCall, endCall, endStuckCall, rejectCall, toggleMic } from "@/features/calls/lib";
import { stopRingtone } from "@/features/calls/lib/ringtone";
import { isLiveCallStatus } from "@/features/calls/model/live";
import { useCallStore } from "@/features/calls/store/call-store";
import { cn } from "@/shared/lib/cn";
import { Button } from "@/shared/ui/button";
import { IconButton } from "@/shared/ui/icon-button";
import { ICON_CLASS } from "@/shared/ui/metrics";

export function TopCallBar() {
  const { t } = useTranslation();
  const status = useCallStore((state) => state.status);
  const minimized = useCallStore((state) => state.minimized);
  const callType = useCallStore((state) => state.callType);
  const initiatorName = useCallStore((state) => state.initiatorName);
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

  const peerName = initiatorName || t("calls.unnamed");
  const kindLabel = (stuckCall?.callType ?? callType) === "video" ? t("calls.kind_video") : t("calls.kind_audio");

  if (showStuck && stuckCall) {
    return (
      <div
        className="flex h-[var(--space-12)] items-center gap-[var(--control-gap)] bg-[var(--status-warning)] px-[var(--space-3)] pt-[var(--safe-area-top)] text-[var(--text-inverse)]"
        role="status"
      >
        <AlertTriangle aria-hidden className={cn(ICON_CLASS, "shrink-0")} />
        <span className="min-w-0 flex-1 truncate text-[length:var(--text-sm)] [font-weight:var(--font-weight-emphasis)]">
          {t("calls.stuck", {
            kind: stuckCall.callType === "video" ? t("calls.title_video") : t("calls.title_audio"),
          })}
        </span>
        <Button
          className="h-[var(--touch-target-min)] rounded-[var(--radius-full)] bg-[var(--call-label-bg)] px-[var(--space-3)] text-[length:var(--text-xs)] text-[var(--text-inverse)]"
          onClick={() => void endStuckCall()}
          type="button"
          variant="ghost"
        >
          <PhoneOff aria-hidden className="h-[var(--space-3)] w-[var(--space-3)]" />
          {t("calls.stuck_end")}
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
          className="rounded-[var(--radius-full)] bg-[var(--status-danger)] text-[var(--text-inverse)]"
          onClick={() => {
            stopRingtone();
            void rejectCall();
          }}
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
          {t("calls.incoming_with", { kind: kindLabel, name: peerName })}
        </Button>
        <IconButton
          aria-label={t("calls.accept")}
          className="rounded-[var(--radius-full)] bg-[var(--status-success)] text-[var(--text-inverse)]"
          onClick={() => {
            stopRingtone();
            void acceptCall();
          }}
          type="button"
          variant="primary"
        >
          <Phone aria-hidden className={ICON_CLASS} />
        </IconButton>
      </div>
    );
  }

  const statusLabel =
    status === "ringing-outgoing"
      ? t("calls.ringing")
      : status === "connecting"
        ? t("calls.connecting")
        : elapsed;

  return (
    <div
      aria-live="polite"
      className="flex h-[var(--space-12)] items-center gap-[var(--space-1)] bg-[var(--accent)] px-[var(--space-1_5)] pt-[var(--safe-area-top)] text-[var(--accent-contrast)]"
      role="status"
    >
      <Button
        aria-label={t("calls.maximize", { name: peerName, status: statusLabel })}
        className="flex min-h-[var(--touch-target-min)] min-w-0 flex-1 items-center justify-start gap-[var(--space-2)] rounded-[var(--radius-md)] px-[var(--space-2)] text-left text-[var(--accent-contrast)] hover:bg-[var(--call-chrome-muted)]"
        onClick={() => setMinimized(false)}
        type="button"
        variant="ghost"
      >
        <Phone aria-hidden className={cn(ICON_CLASS, "shrink-0")} />
        <span className="min-w-0 truncate text-[length:var(--text-sm)] [font-weight:var(--font-weight-emphasis)]">
          {peerName}
          <span className="ml-[var(--space-2)] font-normal opacity-[var(--opacity-queued)]">{statusLabel}</span>
        </span>
      </Button>
      {callType === "video" ? null : (
        <>
          <IconButton
            aria-label={micOn ? t("calls.mute") : t("calls.unmute")}
            aria-pressed={!micOn}
            className={cn(
              "rounded-[var(--radius-full)] text-[var(--accent-contrast)]",
              micOn ? "hover:bg-[var(--call-chrome-muted)]" : "bg-[var(--status-danger)]",
            )}
            onClick={() => toggleMic()}
            type="button"
            variant="ghost"
          >
            {micOn ? <Mic aria-hidden className={ICON_CLASS} /> : <MicOff aria-hidden className={ICON_CLASS} />}
          </IconButton>
          <IconButton
            aria-label={t("calls.end")}
            className="rounded-[var(--radius-full)] bg-[var(--status-danger)] text-[var(--text-inverse)]"
            onClick={() => {
              if (status === "ringing-outgoing") {
                void cancelCall();
                return;
              }
              void endCall();
            }}
            type="button"
            variant="danger"
          >
            <PhoneOff aria-hidden className={ICON_CLASS} />
          </IconButton>
        </>
      )}
    </div>
  );
}
