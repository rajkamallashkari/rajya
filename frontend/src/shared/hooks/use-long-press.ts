import { useCallback, useEffect, useRef, type PointerEvent as ReactPointerEvent } from "react";
import {
  LONG_PRESS_MOVE_TOLERANCE_PX,
  LONG_PRESS_MS,
  PRIMARY_POINTER_BUTTON,
} from "@/shared/hooks/constants";
import { haptic } from "@/shared/lib/haptic";

export interface LongPressHandlers {
  onContextMenu: (event: React.MouseEvent) => void;
  onPointerCancel: () => void;
  onPointerDown: (event: ReactPointerEvent) => void;
  onPointerMove: (event: ReactPointerEvent) => void;
  onPointerUp: () => void;
}

export function useLongPress(
  onLongPress: ((event: { clientX: number; clientY: number }) => void) | null,
  {
    delay = LONG_PRESS_MS,
    enabled = true,
    moveTolerancePx = LONG_PRESS_MOVE_TOLERANCE_PX,
  }: { delay?: number; enabled?: boolean; moveTolerancePx?: number } = {},
): LongPressHandlers {
  const timerRef = useRef<ReturnType<typeof setTimeout> | null>(null);
  const startPosRef = useRef({ x: 0, y: 0 });
  const firedRef = useRef(false);
  const activeRef = useRef(false);

  const clear = useCallback(() => {
    if (timerRef.current) {
      clearTimeout(timerRef.current);
      timerRef.current = null;
    }
  }, []);

  useEffect(() => clear, [clear]);

  const onPointerDown = useCallback(
    (event: ReactPointerEvent) => {
      if (!enabled || !onLongPress) {
        return;
      }
      if (event.button !== PRIMARY_POINTER_BUTTON) {
        return;
      }
      startPosRef.current = { x: event.clientX, y: event.clientY };
      firedRef.current = false;
      activeRef.current = true;
      clear();
      timerRef.current = setTimeout(() => {
        firedRef.current = true;
        haptic();
        onLongPress({ clientX: startPosRef.current.x, clientY: startPosRef.current.y });
      }, delay);
    },
    [clear, delay, enabled, onLongPress],
  );

  const onPointerMove = useCallback(
    (event: ReactPointerEvent) => {
      if (!activeRef.current || !timerRef.current) {
        return;
      }
      const dx = Math.abs(event.clientX - startPosRef.current.x);
      const dy = Math.abs(event.clientY - startPosRef.current.y);
      if (dx > moveTolerancePx || dy > moveTolerancePx) {
        clear();
      }
    },
    [clear, moveTolerancePx],
  );

  const onPointerUp = useCallback(() => {
    activeRef.current = false;
    clear();
  }, [clear]);

  const onContextMenu = useCallback(
    (event: React.MouseEvent) => {
      if (firedRef.current) {
        event.preventDefault();
      }
    },
    [],
  );

  return {
    onContextMenu,
    onPointerCancel: onPointerUp,
    onPointerDown,
    onPointerMove,
    onPointerUp,
  };
}
