import { useCallback, useRef, type PointerEvent as ReactPointerEvent } from "react";
import { CALL_SWIPE_TAP_SLOP_PX, CALL_SWIPE_UP_THRESHOLD_PX } from "@/features/calls/model/constants";

export function useSwipeUp({
  onSwipeUp,
  onTap,
  threshold = CALL_SWIPE_UP_THRESHOLD_PX,
}: {
  onSwipeUp: () => void;
  onTap?: () => void;
  threshold?: number;
}) {
  const startRef = useRef<{ x: number; y: number } | null>(null);
  const swipedRef = useRef(false);

  const onPointerDown = useCallback((event: ReactPointerEvent<HTMLElement>) => {
    if ((event.target as HTMLElement).closest("button, a, input, select")) {
      return;
    }
    event.currentTarget.setPointerCapture?.(event.pointerId);
    startRef.current = { x: event.clientX, y: event.clientY };
    swipedRef.current = false;
  }, []);

  const onPointerMove = useCallback(
    (event: ReactPointerEvent<HTMLElement>) => {
      if (!startRef.current) {
        return;
      }
      const dy = startRef.current.y - event.clientY;
      const dx = Math.abs(event.clientX - startRef.current.x);
      if (dy > threshold && dy > dx) {
        swipedRef.current = true;
      }
    },
    [threshold],
  );

  const onPointerUp = useCallback(
    (event: ReactPointerEvent<HTMLElement>) => {
      if (!startRef.current) {
        return;
      }
      const dy = startRef.current.y - event.clientY;
      const dx = Math.abs(event.clientX - startRef.current.x);
      const didSwipe = swipedRef.current || (dy > threshold && dy > dx);
      startRef.current = null;
      swipedRef.current = false;
      if (didSwipe) {
        onSwipeUp();
        return;
      }
      if (dx < CALL_SWIPE_TAP_SLOP_PX && Math.abs(dy) < CALL_SWIPE_TAP_SLOP_PX) {
        onTap?.();
      }
    },
    [onSwipeUp, onTap, threshold],
  );

  const onPointerCancel = useCallback(() => {
    startRef.current = null;
    swipedRef.current = false;
  }, []);

  return { onPointerCancel, onPointerDown, onPointerMove, onPointerUp };
}
