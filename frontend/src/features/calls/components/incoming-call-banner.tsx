import { useEffect, useRef } from "react";
import { Minimize2, Phone, PhoneOff, Video } from "lucide-react";
import { useTranslation } from "react-i18next";
import { useSwipeUp } from "@/features/calls/hooks/use-swipe-up";
import { acceptCall, rejectCall } from "@/features/calls/lib";
import { startRingtone, stopRingtone } from "@/features/calls/lib/ringtone";
import { RING_TIMEOUT_MS } from "@/features/calls/model/constants";
import { useCallStore } from "@/features/calls/store/call-store";
import { cn } from "@/shared/lib/cn";
import { Avatar } from "@/shared/ui/avatar";
import { IconButton } from "@/shared/ui/icon-button";
import { ICON_CLASS } from "@/shared/ui/metrics";

export function IncomingCallBanner() {
  const { t } = useTranslation();
  const status = useCallStore((state) => state.status);
  const callType = useCallStore((state) => state.callType);
  const initiatorName = useCallStore((state) => state.initiatorName);
  const initiatorUsername = useCallStore((state) => state.initiatorUsername);
  const incomingSilenced = useCallStore((state) => state.incomingSilenced);
  const incomingPreview = useCallStore((state) => state.incomingPreview);
  const setIncomingSilenced = useCallStore((state) => state.setIncomingSilenced);
  const setIncomingPreview = useCallStore((state) => state.setIncomingPreview);
  const timerRef = useRef<ReturnType<typeof setTimeout> | null>(null);
  const ringing = status === "ringing-incoming";
  const showBanner = ringing && !incomingSilenced && !incomingPreview;
  const showPreview = ringing && incomingPreview;
  const name = initiatorName || t("calls.unnamed");
  const kindLabel = callType === "video" ? t("calls.incoming_video") : t("calls.incoming_audio");

  useEffect(() => {
    if (!ringing) {
      stopRingtone();
      if (timerRef.current) {
        clearTimeout(timerRef.current);
      }
      return;
    }
    if (incomingSilenced) {
      stopRingtone();
      return;
    }
    startRingtone();
    timerRef.current = setTimeout(() => {
      void rejectCall();
    }, RING_TIMEOUT_MS);
    return () => {
      stopRingtone();
      if (timerRef.current) {
        clearTimeout(timerRef.current);
      }
    };
  }, [incomingSilenced, ringing]);

  const collapseToTopBar = () => {
    stopRingtone();
    setIncomingSilenced(true);
  };

  const swipe = useSwipeUp({
    onSwipeUp: collapseToTopBar,
    onTap: () => setIncomingPreview(true),
  });

  if (!showBanner && !showPreview) {
    return null;
  }

  const handleAccept = () => {
    stopRingtone();
    setIncomingPreview(false);
    void acceptCall();
  };
  const handleReject = () => {
    stopRingtone();
    setIncomingPreview(false);
    void rejectCall();
  };

  if (showPreview) {
    return (
      <div
        aria-label={t("calls.incoming_preview")}
        aria-modal="true"
        className="fixed inset-0 z-[var(--z-call-overlay)] flex flex-col items-center justify-between bg-[var(--surface-call)] px-[var(--space-6)] py-[var(--space-10)]"
        role="dialog"
      >
        <div className="flex w-full items-center justify-end">
          <IconButton
            aria-label={t("calls.minimize_incoming")}
            className="rounded-[var(--radius-full)] bg-[var(--call-chrome-muted)] text-[var(--text-inverse)]"
            onClick={collapseToTopBar}
            type="button"
            variant="ghost"
          >
            <Minimize2 aria-hidden className={ICON_CLASS} />
          </IconButton>
        </div>
        <div className="flex flex-col items-center gap-[var(--space-4)] text-center">
          <Avatar className="h-[var(--space-16)] w-[var(--space-16)] shadow-[var(--elevation-2)]" name={name} />
          <div>
            <p className="text-[length:var(--text-lg)] text-[var(--text-inverse)] [font-weight:var(--font-weight-emphasis)]">
              {name}
            </p>
            {initiatorUsername ? (
              <p className="mt-[var(--space-1)] text-[length:var(--text-sm)] text-[var(--text-tertiary)]">
                {`@${initiatorUsername}`}
              </p>
            ) : null}
            <p className="mt-[var(--space-2)] flex items-center justify-center gap-[var(--control-gap-tight)] text-[length:var(--text-sm)] text-[var(--text-secondary)]">
              {callType === "video" ? (
                <Video aria-hidden className={ICON_CLASS} />
              ) : (
                <Phone aria-hidden className={ICON_CLASS} />
              )}
              {kindLabel}
            </p>
          </div>
        </div>
        <div className="flex w-full max-w-[var(--dialog-max-width)] items-center justify-between px-[var(--space-4)] pb-[var(--safe-area-bottom)]">
          <IconButton
            aria-label={t("calls.decline")}
            className="h-[var(--space-16)] w-[var(--space-16)] rounded-[var(--radius-full)] bg-[var(--status-danger)] text-[var(--text-inverse)]"
            onClick={handleReject}
            type="button"
            variant="danger"
          >
            <PhoneOff aria-hidden className="h-[var(--space-8)] w-[var(--space-8)]" />
          </IconButton>
          <IconButton
            aria-label={t("calls.accept")}
            className="h-[var(--space-16)] w-[var(--space-16)] rounded-[var(--radius-full)] bg-[var(--status-success)] text-[var(--text-inverse)]"
            onClick={handleAccept}
            type="button"
            variant="primary"
          >
            <Phone aria-hidden className="h-[var(--space-8)] w-[var(--space-8)]" />
          </IconButton>
        </div>
      </div>
    );
  }

  return (
    <div className="pointer-events-none fixed inset-x-0 top-0 z-[var(--z-call-overlay)] flex justify-center px-[var(--space-2)] pt-[max(var(--space-2),var(--safe-area-top))]">
      <div
        aria-label={t("calls.incoming")}
        aria-live="polite"
        aria-modal="false"
        className="pointer-events-auto flex w-full max-w-md items-center gap-[var(--control-gap-tight)] rounded-[var(--radius-xl)] border border-[var(--border-default)] bg-[var(--surface-raised)] px-[var(--space-2)] py-[var(--space-2)] shadow-[var(--elevation-3)]"
        role="dialog"
        style={{ touchAction: "none" }}
        {...swipe}
      >
        <IconButton
          aria-label={t("calls.decline")}
          className="rounded-[var(--radius-full)] bg-[var(--status-danger)] text-[var(--text-inverse)]"
          onClick={handleReject}
          type="button"
          variant="danger"
        >
          <PhoneOff aria-hidden className={ICON_CLASS} />
        </IconButton>
        <div className="flex min-w-0 flex-1 items-center gap-[var(--control-gap-tight)]">
          <Avatar className="h-[var(--space-10)] w-[var(--space-10)] shrink-0" name={name} />
          <div className="min-w-0 leading-tight">
            <p className="truncate text-[length:var(--text-sm)] text-[var(--text-primary)] [font-weight:var(--font-weight-emphasis)]">
              {name}
            </p>
            {initiatorUsername ? (
              <p className="hidden truncate text-[length:var(--text-xs)] text-[var(--text-secondary)] sm:block">
                {`@${initiatorUsername}`}
              </p>
            ) : null}
            <p className="mt-[var(--space-0_5)] flex items-center gap-[var(--space-1)] text-[length:var(--text-xs)] text-[var(--text-secondary)]">
              {callType === "video" ? (
                <Video aria-hidden className="h-[var(--space-3)] w-[var(--space-3)]" />
              ) : (
                <Phone aria-hidden className="h-[var(--space-3)] w-[var(--space-3)]" />
              )}
              <span className="truncate">{kindLabel}</span>
            </p>
          </div>
        </div>
        <IconButton
          aria-label={t("calls.accept")}
          className={cn("rounded-[var(--radius-full)] bg-[var(--status-success)] text-[var(--text-inverse)]")}
          onClick={handleAccept}
          type="button"
          variant="primary"
        >
          <Phone aria-hidden className={ICON_CLASS} />
        </IconButton>
      </div>
    </div>
  );
}
