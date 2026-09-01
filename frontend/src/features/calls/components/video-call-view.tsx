import { useEffect, useMemo, useRef, useState } from "react";
import { Minimize2 } from "lucide-react";
import { useTranslation } from "react-i18next";
import { CallControlBar } from "@/features/calls/components/call-control-bar";
import { PipSelfView } from "@/features/calls/components/pip-self-view";
import { useCallElapsed } from "@/features/calls/hooks/use-call-elapsed";
import { bindVideoElement } from "@/features/calls/lib/bind-media";
import { isLiveCallStatus } from "@/features/calls/model/live";
import { useCallStore } from "@/features/calls/store/call-store";
import { useAccountsStore } from "@/features/auth/store/accounts-store";
import { cn } from "@/shared/lib/cn";
import { Avatar } from "@/shared/ui/avatar";
import { Button } from "@/shared/ui/button";
import { IconButton } from "@/shared/ui/icon-button";
import { ICON_CLASS } from "@/shared/ui/metrics";

function VideoTile({
  fill,
  highlight,
  label,
  mirror,
  name,
  showLabel = true,
  stream,
  videoOn = true,
}: {
  fill?: boolean;
  highlight?: boolean;
  label: string;
  mirror?: boolean;
  name: string;
  showLabel?: boolean;
  stream: MediaStream | null;
  videoOn?: boolean;
}) {
  const videoRef = useRef<HTMLVideoElement>(null);
  const hasLiveTrack = stream?.getVideoTracks().some((track) => track.readyState === "live");
  const hasVideo = Boolean(hasLiveTrack && videoOn);

  useEffect(() => {
    bindVideoElement(videoRef.current, stream, hasVideo);
  }, [hasVideo, stream]);

  return (
    <div
      className={cn(
        "relative overflow-hidden bg-[var(--surface-call)]",
        fill ? "h-full w-full" : "rounded-[var(--radius-lg)]",
        highlight ? "ring-[length:var(--focus-ring-width)] ring-[var(--accent)]" : "",
      )}
    >
      <video
        autoPlay
        className={cn(
          "pointer-events-none h-full w-full object-cover",
          mirror ? "scale-x-[-1]" : "",
          hasVideo ? "" : "invisible",
        )}
        muted
        playsInline
        ref={videoRef}
      />
      {hasVideo ? null : (
        <div
          className={cn(
            "pointer-events-none absolute inset-0 flex items-center justify-center bg-[var(--call-label-bg)]",
            fill ? "" : "min-h-[var(--space-16)]",
          )}
        >
          <Avatar
            className={
              fill
                ? "h-[var(--space-16)] w-[var(--space-16)]"
                : "h-[var(--space-12)] w-[var(--space-12)]"
            }
            name={name}
          />
        </div>
      )}
      {showLabel ? (
        <span className="pointer-events-none absolute bottom-[var(--space-2)] left-[var(--space-2)] rounded-[var(--radius-sm)] bg-[var(--call-label-bg)] px-[var(--space-2)] py-[var(--space-0_5)] text-[length:var(--text-xs)] text-[var(--text-inverse)]">
          {label}
        </span>
      ) : null}
    </div>
  );
}

export function VideoCallView() {
  const { t } = useTranslation();
  const status = useCallStore((state) => state.status);
  const callType = useCallStore((state) => state.callType);
  const localStream = useCallStore((state) => state.localStream);
  const remoteStreams = useCallStore((state) => state.remoteStreams);
  const remoteScreenStreams = useCallStore((state) => state.remoteScreenStreams);
  const remoteMedia = useCallStore((state) => state.remoteMedia);
  const camOn = useCallStore((state) => state.camOn);
  const isScreenSharing = useCallStore((state) => state.isScreenSharing);
  const activeSpeakerId = useCallStore((state) => state.activeSpeakerId);
  const minimized = useCallStore((state) => state.minimized);
  const pipSwapped = useCallStore((state) => state.pipSwapped);
  const initiatorId = useCallStore((state) => state.initiatorId);
  const initiatorName = useCallStore((state) => state.initiatorName);
  const setMinimized = useCallStore((state) => state.setMinimized);
  const setPipSwapped = useCallStore((state) => state.setPipSwapped);
  const myId = useAccountsStore((state) => state.activeAccountId);
  const elapsed = useCallElapsed();
  const containerRef = useRef<HTMLDivElement>(null);
  const [chromeVisible, setChromeVisible] = useState(false);
  const inCall = isLiveCallStatus(status);

  useEffect(() => {
    if (!inCall || minimized || callType !== "video") {
      setChromeVisible(false);
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

  const remoteEntries = useMemo(
    () =>
      Object.entries(remoteStreams).map(([id, stream]) => {
        const accountId = Number(id);
        const screen = remoteScreenStreams[accountId];
        return {
          accountId,
          name: accountId === initiatorId ? initiatorName || t("calls.remote") : t("calls.remote"),
          stream: screen ?? stream,
          videoOn: remoteMedia[accountId]?.camOn ?? true,
        };
      }),
    [initiatorId, initiatorName, remoteMedia, remoteScreenStreams, remoteStreams, t],
  );

  if (!inCall || minimized || callType !== "video") {
    return null;
  }

  const statusText =
    status === "ringing-outgoing"
      ? t("calls.ringing")
      : status === "connecting"
        ? t("calls.connecting")
        : elapsed;
  const isOneOnOne = remoteEntries.length <= 1;
  const primaryRemote = remoteEntries[0];
  const myName = t("calls.you");
  const toggleChrome = () => setChromeVisible((value) => !value);
  const mainIsLocal = pipSwapped;
  const localFeed = localStream;
  const mainStream = mainIsLocal ? localFeed : (primaryRemote?.stream ?? null);
  const mainName = mainIsLocal ? myName : primaryRemote?.name || t("calls.remote");
  const mainVideoOn = mainIsLocal ? camOn || isScreenSharing : (primaryRemote?.videoOn ?? true);
  const pipStream = mainIsLocal ? (primaryRemote?.stream ?? null) : localFeed;
  const pipName = mainIsLocal ? primaryRemote?.name || t("calls.remote") : myName;
  const pipVideoOn = mainIsLocal ? (primaryRemote?.videoOn ?? true) : camOn || isScreenSharing;

  return (
    <div
      aria-label={t("calls.title_video")}
      aria-modal="true"
      className="fixed inset-0 z-[var(--z-call-overlay)] flex flex-col bg-[var(--surface-call)] outline-none"
      ref={containerRef}
      role="dialog"
      tabIndex={-1}
    >
      <div
        className={cn(
          "absolute inset-x-0 top-0 z-[var(--z-sticky)] flex items-center justify-between px-[var(--space-4)] py-[var(--space-3)] text-[var(--text-inverse)] transition-opacity duration-[var(--motion-base)]",
          chromeVisible ? "pointer-events-auto opacity-100" : "pointer-events-none opacity-0",
        )}
      >
        <div
          aria-live="polite"
          className="rounded-[var(--radius-md)] bg-[var(--call-label-bg)] px-[var(--space-3)] py-[var(--space-1_5)]"
        >
          <p className="text-[length:var(--text-sm)] [font-weight:var(--font-weight-emphasis)]">
            {t("calls.title_video")}
          </p>
          <p className="text-[length:var(--text-xs)] text-[var(--text-tertiary)]">{statusText}</p>
        </div>
        <IconButton
          aria-label={t("calls.minimize")}
          className="rounded-[var(--radius-full)] bg-[var(--call-label-bg)] text-[var(--text-inverse)]"
          onClick={() => setMinimized(true)}
          type="button"
          variant="ghost"
        >
          <Minimize2 aria-hidden className={ICON_CLASS} />
        </IconButton>
      </div>

      <div className="relative min-h-0 flex-1">
        {isOneOnOne ? (
          <>
            <Button
              aria-label={chromeVisible ? t("calls.hide_controls") : t("calls.show_controls")}
              className="absolute inset-0 z-[var(--z-base)] h-full w-full cursor-default rounded-none border-0 bg-transparent p-0 hover:bg-transparent"
              onClick={toggleChrome}
              type="button"
              variant="ghost"
            />
            <VideoTile
              fill
              highlight={
                !mainIsLocal &&
                primaryRemote !== undefined &&
                activeSpeakerId === primaryRemote.accountId
              }
              label={mainName}
              mirror={mainIsLocal && !isScreenSharing}
              name={mainName}
              showLabel={chromeVisible}
              stream={mainStream}
              videoOn={mainVideoOn}
            />
            <PipSelfView
              label={pipName}
              mirror={!mainIsLocal}
              name={pipName}
              onSwap={() => setPipSwapped(!pipSwapped)}
              stream={pipStream}
              videoOn={pipVideoOn}
            />
          </>
        ) : (
          <div
            className={cn(
              "grid h-full gap-[var(--space-2)] p-[var(--space-3)]",
              chromeVisible ? "pt-[var(--space-16)] pb-[var(--space-16)]" : "py-[var(--space-3)]",
              remoteEntries.length <= 2 ? "grid-cols-1 sm:grid-cols-2" : "grid-cols-2 grid-rows-2",
            )}
            onClick={toggleChrome}
            role="presentation"
          >
            {remoteEntries.map((row) => (
              <VideoTile
                highlight={activeSpeakerId === row.accountId}
                key={row.accountId}
                label={row.name}
                name={row.name}
                showLabel={chromeVisible}
                stream={row.stream}
                videoOn={row.videoOn}
              />
            ))}
            <VideoTile
              highlight={activeSpeakerId === myId}
              label={myName}
              mirror
              name={myName}
              showLabel={chromeVisible}
              stream={localStream}
              videoOn={camOn}
            />
          </div>
        )}
      </div>

      <div
        className={cn(
          "absolute inset-x-0 bottom-0 z-[var(--z-sticky)] bg-[linear-gradient(to_top,var(--call-label-bg),transparent)] transition-opacity duration-[var(--motion-base)]",
          chromeVisible ? "pointer-events-auto opacity-100" : "pointer-events-none opacity-0",
        )}
      >
        <CallControlBar showCameraFlip />
      </div>
    </div>
  );
}
