import { useEffect, useRef } from "react";
import { useTranslation } from "react-i18next";
import { useCornerSnap } from "@/features/calls/hooks/use-corner-snap";
import { bindVideoElement } from "@/features/calls/lib/bind-media";
import {
  CALL_PIP_HEIGHT_PX,
  CALL_PIP_MOVE_THRESHOLD_PX,
  CALL_PIP_WIDTH_PX,
  CALL_SNAP_MS,
} from "@/features/calls/model/constants";
import { Avatar } from "@/shared/ui/avatar";

export function PipSelfView({
  label,
  mirror = true,
  name,
  onSwap,
  stream,
  videoOn = true,
}: {
  label?: string;
  mirror?: boolean;
  name: string;
  onSwap: () => void;
  stream: MediaStream | null;
  videoOn?: boolean;
}) {
  const { t } = useTranslation();
  const videoRef = useRef<HTMLVideoElement>(null);
  const startRef = useRef<{ x: number; y: number } | null>(null);
  const movedRef = useRef(false);
  const { dragHandlers, elRef, isDragging, position } = useCornerSnap("bottom-right");
  const hasLiveTrack = stream?.getVideoTracks().some((track) => track.readyState === "live");
  const hasVideo = Boolean(hasLiveTrack && videoOn);

  useEffect(() => {
    bindVideoElement(videoRef.current, stream, hasVideo);
  }, [hasVideo, stream]);

  return (
    <div
      aria-label={t("calls.pip_swap")}
      className="overflow-hidden rounded-[var(--radius-xl)] border border-[var(--call-chrome-strong)] bg-[var(--surface-call)] shadow-[var(--elevation-3)]"
      onKeyDown={(event) => {
        if (event.key === "Enter" || event.key === " ") {
          event.preventDefault();
          onSwap();
        }
      }}
      onPointerCancel={() => {
        dragHandlers.onPointerCancel();
        startRef.current = null;
        movedRef.current = false;
      }}
      onPointerDown={(event) => {
        event.preventDefault();
        startRef.current = { x: event.clientX, y: event.clientY };
        movedRef.current = false;
        dragHandlers.onPointerDown(event);
      }}
      onPointerMove={(event) => {
        if (startRef.current) {
          const dx = Math.abs(event.clientX - startRef.current.x);
          const dy = Math.abs(event.clientY - startRef.current.y);
          if (dx > CALL_PIP_MOVE_THRESHOLD_PX || dy > CALL_PIP_MOVE_THRESHOLD_PX) {
            movedRef.current = true;
          }
        }
        dragHandlers.onPointerMove(event);
      }}
      onPointerUp={() => {
        const wasDrag = movedRef.current;
        dragHandlers.onPointerUp();
        startRef.current = null;
        if (!wasDrag) {
          onSwap();
        }
        movedRef.current = false;
      }}
      ref={elRef}
      role="button"
      style={{
        cursor: isDragging ? "grabbing" : "grab",
        height: CALL_PIP_HEIGHT_PX,
        left: position.x,
        position: "fixed",
        top: position.y,
        touchAction: "none",
        transition: isDragging ? "none" : `left ${String(CALL_SNAP_MS)}ms ease, top ${String(CALL_SNAP_MS)}ms ease`,
        userSelect: "none",
        width: CALL_PIP_WIDTH_PX,
        zIndex: "var(--z-call-overlay)",
      }}
      tabIndex={0}
    >
      <video
        autoPlay
        className={`pointer-events-none h-full w-full object-cover ${mirror ? "scale-x-[-1]" : ""} ${hasVideo ? "" : "invisible"}`}
        muted
        playsInline
        ref={videoRef}
      />
      {hasVideo ? null : (
        <div className="pointer-events-none absolute inset-0 flex items-center justify-center bg-[var(--call-label-bg)]">
          <Avatar className="h-[var(--space-12)] w-[var(--space-12)]" name={name} />
        </div>
      )}
      <span className="pointer-events-none absolute bottom-[var(--space-1_5)] left-[var(--space-1_5)] rounded-[var(--radius-sm)] bg-[var(--call-label-bg)] px-[var(--space-1_5)] py-[var(--space-0_5)] text-[length:var(--text-xs)] text-[var(--text-inverse)]">
        {label ?? t("calls.you")}
      </span>
    </div>
  );
}
