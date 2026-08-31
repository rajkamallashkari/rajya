import { useEffect, useRef, useState } from "react";
import { Mic, MicOff, PhoneOff, SwitchCamera, Video, VideoOff } from "lucide-react";
import { useTranslation } from "react-i18next";
import { useCanFlipCamera } from "@/features/calls/hooks/use-can-flip-camera";
import { useCornerSnap } from "@/features/calls/hooks/use-corner-snap";
import { cancelCall, endCall, flipCamera, toggleCamera, toggleMic } from "@/features/calls/lib";
import { bindVideoElement } from "@/features/calls/lib/bind-media";
import {
  CALL_CONTROLS_ARM_MS,
  CALL_FLOAT_HEIGHT_PX,
  CALL_FLOAT_WIDTH_PX,
  CALL_SNAP_MS,
} from "@/features/calls/model/constants";
import { isLiveCallStatus } from "@/features/calls/model/live";
import { useCallStore } from "@/features/calls/store/call-store";
import { useAccountsStore } from "@/features/auth/store/accounts-store";
import { cn } from "@/shared/lib/cn";
import { Avatar } from "@/shared/ui/avatar";
import { IconButton } from "@/shared/ui/icon-button";
import { ICON_CLASS } from "@/shared/ui/metrics";

export function FloatingVideoOverlay() {
  const { t } = useTranslation();
  const status = useCallStore((state) => state.status);
  const minimized = useCallStore((state) => state.minimized);
  const callType = useCallStore((state) => state.callType);
  const remoteStreams = useCallStore((state) => state.remoteStreams);
  const remoteScreenStreams = useCallStore((state) => state.remoteScreenStreams);
  const localStream = useCallStore((state) => state.localStream);
  const remoteMedia = useCallStore((state) => state.remoteMedia);
  const micOn = useCallStore((state) => state.micOn);
  const camOn = useCallStore((state) => state.camOn);
  const me = useAccountsStore((state) => state.accounts.find((row) => row.id === state.activeAccountId));
  const canFlip = useCanFlipCamera();
  const [controlsOpen, setControlsOpen] = useState(false);
  const [controlsArmed, setControlsArmed] = useState(false);
  const videoRef = useRef<HTMLVideoElement>(null);
  const movedRef = useRef(false);
  const armTimerRef = useRef<ReturnType<typeof setTimeout> | null>(null);
  const { dragHandlers, elRef, isDragging, position } = useCornerSnap("bottom-right");
  const inCall = isLiveCallStatus(status);
  const visible = inCall && minimized && callType === "video";
  const primaryRemoteId = Object.keys(remoteStreams)[0];
  const primaryRemoteUserId = primaryRemoteId ? Number(primaryRemoteId) : null;
  const showingLocal = primaryRemoteUserId == null;
  const primaryStream = showingLocal
    ? localStream
    : (remoteScreenStreams[primaryRemoteUserId] ?? remoteStreams[primaryRemoteUserId]);
  const avatarName = showingLocal
    ? (me?.displayName || t("calls.you"))
    : t("calls.remote");
  const label = showingLocal ? t("calls.you") : avatarName;
  const remoteCamOn =
    primaryRemoteUserId != null ? (remoteMedia[primaryRemoteUserId]?.camOn ?? true) : true;
  const feedCamOn = showingLocal ? camOn : remoteCamOn;
  const hasLiveTrack = primaryStream?.getVideoTracks().some((track) => track.readyState === "live");
  const hasVideo = Boolean(hasLiveTrack && feedCamOn);

  const clearArmTimer = () => {
    if (armTimerRef.current) {
      clearTimeout(armTimerRef.current);
      armTimerRef.current = null;
    }
  };
  const closeControls = () => {
    clearArmTimer();
    setControlsOpen(false);
    setControlsArmed(false);
  };
  const openControls = () => {
    setControlsOpen(true);
    setControlsArmed(false);
    clearArmTimer();
    armTimerRef.current = setTimeout(() => {
      setControlsArmed(true);
      armTimerRef.current = null;
    }, CALL_CONTROLS_ARM_MS);
  };

  useEffect(() => () => clearArmTimer(), []);

  useEffect(() => {
    if (!visible) {
      closeControls();
      return;
    }
    bindVideoElement(videoRef.current, primaryStream ?? null, hasVideo);
  }, [hasVideo, primaryStream, visible]);

  useEffect(() => {
    if (!controlsOpen) {
      return;
    }
    const onPointerDown = (event: PointerEvent) => {
      const root = elRef.current;
      if (root && !root.contains(event.target as Node)) {
        closeControls();
      }
    };
    document.addEventListener("pointerdown", onPointerDown, true);
    return () => document.removeEventListener("pointerdown", onPointerDown, true);
  }, [controlsOpen, elRef]);

  if (!visible) {
    return null;
  }

  const handleHangup = () => {
    if (status === "ringing-outgoing") {
      void cancelCall();
      return;
    }
    void endCall();
  };
  const runIfArmed = (fn: () => void) => {
    if (!controlsArmed) {
      return;
    }
    fn();
  };

  return (
    <div
      aria-label={t("calls.minimized_video")}
      className="overflow-hidden rounded-[var(--radius-xl)] border border-[var(--call-chrome-strong)] bg-[var(--surface-call)] shadow-[var(--elevation-3)]"
      ref={elRef}
      role="region"
      style={{
        cursor: controlsOpen ? "default" : isDragging ? "grabbing" : "grab",
        height: CALL_FLOAT_HEIGHT_PX,
        left: position.x,
        position: "fixed",
        top: position.y,
        touchAction: "none",
        transition: isDragging ? "none" : `left ${String(CALL_SNAP_MS)}ms ease, top ${String(CALL_SNAP_MS)}ms ease`,
        userSelect: "none",
        width: CALL_FLOAT_WIDTH_PX,
        zIndex: "var(--z-call-overlay)",
      }}
    >
      <video
        autoPlay
        className={cn("pointer-events-none h-full w-full object-cover", hasVideo ? "" : "invisible")}
        muted
        playsInline
        ref={videoRef}
      />
      {hasVideo ? null : (
        <div className="pointer-events-none absolute inset-0 flex items-center justify-center bg-[var(--surface-call)]">
          <Avatar className="h-[var(--space-12)] w-[var(--space-12)]" name={avatarName} />
        </div>
      )}
      {controlsOpen ? null : (
        <span className="pointer-events-none absolute bottom-[var(--space-1_5)] left-[var(--space-1_5)] rounded-[var(--radius-sm)] bg-[var(--call-label-bg)] px-[var(--space-1_5)] py-[var(--space-0_5)] text-[length:var(--text-xs)] text-[var(--text-inverse)]">
          {label}
        </span>
      )}
      <div
        aria-hidden={controlsOpen}
        className="absolute inset-0"
        data-floating-drag=""
        onPointerCancel={dragHandlers.onPointerCancel}
        onPointerDown={(event) => {
          event.preventDefault();
          movedRef.current = false;
          dragHandlers.onPointerDown(event);
        }}
        onPointerMove={(event) => {
          dragHandlers.onPointerMove(event);
          if (isDragging) {
            movedRef.current = true;
          }
        }}
        onPointerUp={() => {
          const wasDrag = movedRef.current;
          dragHandlers.onPointerUp();
          if (!wasDrag) {
            openControls();
          }
          movedRef.current = false;
        }}
        style={{ pointerEvents: controlsOpen ? "none" : "auto" }}
      />
      {controlsOpen ? (
        <div
          className="absolute inset-0 z-[var(--z-sticky)] grid grid-cols-2 grid-rows-2 place-items-center gap-[var(--space-2)] bg-[var(--call-label-bg)] p-[var(--space-3)]"
          onPointerDown={(event) => {
            if (!controlsArmed) {
              return;
            }
            if ((event.target as HTMLElement).closest("button")) {
              return;
            }
            event.preventDefault();
            closeControls();
          }}
          style={{ pointerEvents: controlsArmed ? "auto" : "none" }}
        >
          <IconButton
            aria-label={camOn ? t("calls.video_off") : t("calls.video_on")}
            aria-pressed={!camOn}
            className={cn(
              "rounded-[var(--radius-full)]",
              camOn ? "bg-[var(--call-chrome-strong)] text-[var(--text-inverse)]" : "bg-[var(--status-danger)] text-[var(--text-inverse)]",
            )}
            onClick={() => runIfArmed(() => toggleCamera())}
            type="button"
            variant="ghost"
          >
            {camOn ? <Video aria-hidden className={ICON_CLASS} /> : <VideoOff aria-hidden className={ICON_CLASS} />}
          </IconButton>
          <IconButton
            aria-label={micOn ? t("calls.mute") : t("calls.unmute")}
            aria-pressed={!micOn}
            className={cn(
              "rounded-[var(--radius-full)]",
              micOn ? "bg-[var(--call-chrome-strong)] text-[var(--text-inverse)]" : "bg-[var(--status-danger)] text-[var(--text-inverse)]",
            )}
            onClick={() => runIfArmed(() => toggleMic())}
            type="button"
            variant="ghost"
          >
            {micOn ? <Mic aria-hidden className={ICON_CLASS} /> : <MicOff aria-hidden className={ICON_CLASS} />}
          </IconButton>
          {canFlip ? (
            <IconButton
              aria-label={t("calls.flip_camera")}
              className="rounded-[var(--radius-full)] bg-[var(--call-chrome-strong)] text-[var(--text-inverse)]"
              onClick={() => runIfArmed(() => void flipCamera())}
              type="button"
              variant="ghost"
            >
              <SwitchCamera aria-hidden className={ICON_CLASS} />
            </IconButton>
          ) : (
            <span aria-hidden className="h-[var(--touch-target-min)] w-[var(--touch-target-min)]" />
          )}
          <IconButton
            aria-label={t("calls.end")}
            className="rounded-[var(--radius-full)] bg-[var(--status-danger)] text-[var(--text-inverse)]"
            onClick={() => runIfArmed(handleHangup)}
            type="button"
            variant="danger"
          >
            <PhoneOff aria-hidden className={ICON_CLASS} />
          </IconButton>
        </div>
      ) : null}
    </div>
  );
}
