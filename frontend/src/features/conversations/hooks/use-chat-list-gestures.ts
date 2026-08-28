import { useCallback, useRef, useState, type PointerEvent as ReactPointerEvent } from "react";
import {
  SWIPE_COMMIT_PX,
  SWIPE_MAX_LEFT_PX,
  SWIPE_MAX_RIGHT_PX,
} from "@/features/conversations/model/constants";
import {
  LONG_PRESS_MOVE_TOLERANCE_PX,
  LONG_PRESS_MS,
  PRIMARY_POINTER_BUTTON,
} from "@/shared/hooks/constants";
import { haptic } from "@/shared/lib/haptic";

export function useChatListGestures({
  canSwipeRight,
  onCommitRight,
  onLongPress,
  onOpen,
}: {
  canSwipeRight: boolean;
  onCommitRight: () => void;
  onLongPress: (point: { x: number; y: number }) => void;
  onOpen: () => void;
}): {
  offset: number;
  onContextMenu: (event: React.MouseEvent) => void;
  onPointerCancel: () => void;
  onPointerDown: (event: ReactPointerEvent) => void;
  onPointerMove: (event: ReactPointerEvent) => void;
  onPointerUp: () => void;
} {
  const [offset, setOffset] = useState(0);
  const startRef = useRef<{ x: number; y: number } | null>(null);
  const baseOffsetRef = useRef(0);
  const offsetRef = useRef(0);
  const movedRef = useRef(false);
  const heldRef = useRef(false);
  const timerRef = useRef<ReturnType<typeof setTimeout> | null>(null);

  const writeOffset = useCallback((value: number) => {
    offsetRef.current = value;
    setOffset(value);
  }, []);

  const clearTimer = useCallback(() => {
    if (timerRef.current) {
      clearTimeout(timerRef.current);
      timerRef.current = null;
    }
  }, []);

  const onPointerDown = useCallback(
    (event: ReactPointerEvent) => {
      if (event.button !== PRIMARY_POINTER_BUTTON) {
        return;
      }
      const point = { x: event.clientX, y: event.clientY };
      startRef.current = point;
      baseOffsetRef.current = offsetRef.current;
      movedRef.current = false;
      heldRef.current = false;
      clearTimer();
      timerRef.current = setTimeout(() => {
        heldRef.current = true;
        haptic();
        onLongPress(point);
      }, LONG_PRESS_MS);
    },
    [clearTimer, onLongPress],
  );

  const onPointerMove = useCallback(
    (event: ReactPointerEvent) => {
      if (!startRef.current) {
        return;
      }
      const dx = event.clientX - startRef.current.x;
      const dy = Math.abs(event.clientY - startRef.current.y);
      if (Math.abs(dx) > LONG_PRESS_MOVE_TOLERANCE_PX || dy > LONG_PRESS_MOVE_TOLERANCE_PX) {
        movedRef.current = true;
        clearTimer();
      }
      const maxRight = canSwipeRight ? SWIPE_MAX_RIGHT_PX : 0;
      writeOffset(Math.min(maxRight, Math.max(-SWIPE_MAX_LEFT_PX, baseOffsetRef.current + dx)));
    },
    [canSwipeRight, clearTimer, writeOffset],
  );

  const finish = useCallback(
    (commit: boolean) => {
      if (!startRef.current) {
        return;
      }
      const dx = offsetRef.current;
      startRef.current = null;
      clearTimer();
      if (!commit || heldRef.current) {
        writeOffset(baseOffsetRef.current);
        return;
      }
      if (dx <= -SWIPE_COMMIT_PX) {
        haptic();
        writeOffset(-SWIPE_MAX_LEFT_PX);
        return;
      }
      if (dx >= SWIPE_COMMIT_PX) {
        haptic();
        onCommitRight();
        writeOffset(0);
        return;
      }
      if (!movedRef.current) {
        onOpen();
      }
      writeOffset(0);
    },
    [clearTimer, onCommitRight, onOpen, writeOffset],
  );

  const onContextMenu = useCallback(
    (event: React.MouseEvent) => {
      event.preventDefault();
      onLongPress({ x: event.clientX, y: event.clientY });
    },
    [onLongPress],
  );

  return {
    offset,
    onContextMenu,
    onPointerCancel: () => finish(false),
    onPointerDown,
    onPointerMove,
    onPointerUp: () => finish(true),
  };
}
