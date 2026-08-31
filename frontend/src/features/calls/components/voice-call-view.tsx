import { useEffect, useRef } from "react";
import { Minimize2 } from "lucide-react";
import { useTranslation } from "react-i18next";
import { CallControlBar } from "@/features/calls/components/call-control-bar";
import { CallParticipantRow } from "@/features/calls/components/call-participant-row";
import { useCallElapsed } from "@/features/calls/hooks/use-call-elapsed";
import { isLiveCallStatus } from "@/features/calls/model/live";
import { useCallStore } from "@/features/calls/store/call-store";
import { useAccountsStore } from "@/features/auth/store/accounts-store";
import { IconButton } from "@/shared/ui/icon-button";
import { ICON_CLASS } from "@/shared/ui/metrics";
import type { MicStatus } from "@/features/calls/components/mic-status-icon";

export function VoiceCallView() {
  const { t } = useTranslation();
  const status = useCallStore((state) => state.status);
  const callType = useCallStore((state) => state.callType);
  const participants = useCallStore((state) => state.participants);
  const remoteMedia = useCallStore((state) => state.remoteMedia);
  const speakingIds = useCallStore((state) => state.speakingIds);
  const minimized = useCallStore((state) => state.minimized);
  const initiatorId = useCallStore((state) => state.initiatorId);
  const initiatorName = useCallStore((state) => state.initiatorName);
  const setMinimized = useCallStore((state) => state.setMinimized);
  const myId = useAccountsStore((state) => state.activeAccountId);
  const elapsed = useCallElapsed();
  const containerRef = useRef<HTMLDivElement>(null);
  const inCall = isLiveCallStatus(status);

  useEffect(() => {
    if (!inCall || minimized || callType !== "audio") {
      return;
    }
    const onKey = (event: KeyboardEvent) => {
      if (event.key === "Escape") {
        setMinimized(true);
      }
    };
    window.addEventListener("keydown", onKey);
    containerRef.current?.focus();
    return () => window.removeEventListener("keydown", onKey);
  }, [callType, inCall, minimized, setMinimized]);

  if (!inCall || minimized || callType !== "audio") {
    return null;
  }

  const remotes = participants.filter((row) => row.account_id !== myId);
  const micStatusFor = (accountId: number): MicStatus => {
    const media = remoteMedia[accountId];
    if (media && !media.micOn) {
      return "muted";
    }
    if (speakingIds.includes(accountId)) {
      return "speaking";
    }
    return "idle";
  };
  const statusText =
    status === "ringing-outgoing"
      ? t("calls.ringing")
      : status === "connecting"
        ? t("calls.connecting")
        : elapsed;

  return (
    <div
      aria-label={t("calls.title_audio")}
      aria-modal="true"
      className="fixed inset-0 z-[var(--z-call-overlay)] flex flex-col bg-[var(--surface-call)] outline-none"
      ref={containerRef}
      role="dialog"
      tabIndex={-1}
    >
      <div className="flex items-center justify-between px-[var(--space-4)] py-[var(--space-3)] text-[var(--text-inverse)]">
        <div aria-live="polite">
          <p className="text-[length:var(--text-sm)] [font-weight:var(--font-weight-emphasis)]">
            {t("calls.title_audio")}
          </p>
          <p className="text-[length:var(--text-xs)] text-[var(--text-tertiary)]">{statusText}</p>
        </div>
        <IconButton
          aria-label={t("calls.minimize")}
          className="rounded-[var(--radius-full)] text-[var(--text-inverse)] hover:bg-[var(--call-chrome-muted)]"
          onClick={() => setMinimized(true)}
          type="button"
          variant="ghost"
        >
          <Minimize2 aria-hidden className={ICON_CLASS} />
        </IconButton>
      </div>
      <div className="flex-1 overflow-y-auto px-[var(--space-2)] py-[var(--space-4)]">
        {remotes.length === 0 ? (
          <p className="px-[var(--space-4)] text-center text-[length:var(--text-sm)] text-[var(--text-tertiary)]">
            {t("calls.waiting")}
          </p>
        ) : (
          <ul className="mx-auto flex max-w-md flex-col gap-[var(--space-1)]">
            {remotes.map((row) => (
              <li key={row.account_id}>
                <CallParticipantRow
                  micStatus={micStatusFor(row.account_id)}
                  name={
                    row.account_id === initiatorId ? (initiatorName || t("calls.remote")) : t("calls.remote")
                  }
                  username={null}
                />
              </li>
            ))}
          </ul>
        )}
      </div>
      <CallControlBar />
    </div>
  );
}
