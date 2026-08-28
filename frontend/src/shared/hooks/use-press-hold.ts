import { useCallback, useRef, type PointerEvent as ReactPointerEvent } from "react";
import {
  LONG_PRESS_MOVE_TOLERANCE_PX,
  LONG_PRESS_MS,
  PRIMARY_POINTER_BUTTON,
} from "@/shared/hooks/constants";
import { haptic } from "@/shared/lib/haptic";

export function usePressHold({
  delay = LONG_PRESS_MS,
  enabled = true,
  moveThreshold = LONG_PRESS_MOVE_TOLERANCE_PX,
  onClick,
  onHold,
}: {
  delay?: number;
  enabled?: boolean;
  moveThreshold?: number;
  onClick?: () => void;
  onHold: () => void;
}): {
  onContextMenu: (event: React.MouseEvent) => void;
  onPointerCancel: () => void;
  onPointerDown: (event: ReactPointerEvent) => void;
  onPointerMove: (event: ReactPointerEvent) => void;
  onPointerUp: () => void;
} {
  const timerRef = useRef<ReturnType<typeof setTimeout> | null>(null);
  const startRef = useRef<{ x: number; y: number } | null>(null);
  const firedRef = useRef(false);
  const movedRef = useRef(false);

  const clear = useCallback(() => {
    if (timerRef.current) {
      clearTimeout(timerRef.current);
      timerRef.current = null;
    }
  }, []);

  const onPointerDown = useCallback(
    (event: ReactPointerEvent) => {
      if (!enabled) {
        return;
      }
      if (event.button !== PRIMARY_POINTER_BUTTON) {
        return;
      }
      firedRef.current = false;
      movedRef.current = false;
      startRef.current = { x: event.clientX, y: event.clientY };
      clear();
      timerRef.current = setTimeout(() => {
        firedRef.current = true;
        haptic();
        onHold();
      }, delay);
    },
    [clear, delay, enabled, onHold],
  );

  const onPointerMove = useCallback(
    (event: ReactPointerEvent) => {
      if (!startRef.current || !timerRef.current) {
        return;
      }
      const dx = Math.abs(event.clientX - startRef.current.x);
      const dy = Math.abs(event.clientY - startRef.current.y);
      if (dx > moveThreshold || dy > moveThreshold) {
        movedRef.current = true;
        clear();
      }
    },
    [clear, moveThreshold],
  );

  const onPointerUp = useCallback(() => {
    if (!startRef.current && !timerRef.current && !firedRef.current) {
      return;
    }
    const wasHeld = firedRef.current;
    const moved = movedRef.current;
    clear();
    startRef.current = null;
    if (!wasHeld && !moved && enabled) {
      onClick?.();
    }
  }, [clear, enabled, onClick]);

  const onPointerCancel = useCallback(() => {
    clear();
    startRef.current = null;
  }, [clear]);

  const onContextMenu = useCallback(
    (event: React.MouseEvent) => {
      event.preventDefault();
      if (enabled) {
        onHold();
      }
    },
    [enabled, onHold],
  );

  return {
    onContextMenu,
    onPointerCancel,
    onPointerDown,
    onPointerMove,
    onPointerUp,
  };
}
