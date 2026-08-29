import { useCallback, useRef, type PointerEvent as ReactPointerEvent } from "react";
import { PRIMARY_POINTER_BUTTON } from "@/shared/hooks/constants";
import { EDGE_SWIPE_COMMIT_RATIO, EDGE_SWIPE_ZONE_PX } from "@/shared/lib/navigation/constants";

export function useEdgeSwipe(
  enabled: boolean,
  onCommit: () => void,
): {
  onPointerCancel: (event: ReactPointerEvent<HTMLElement>) => void;
  onPointerDown: (event: ReactPointerEvent<HTMLElement>) => void;
  onPointerMove: (event: ReactPointerEvent<HTMLElement>) => void;
  onPointerUp: (event: ReactPointerEvent<HTMLElement>) => void;
} {
  const originX = useRef(0);
  const width = useRef(0);
  const active = useRef(false);
  const dragPx = useRef(0);

  const finish = useCallback((target: HTMLElement) => {
    active.current = false;
    dragPx.current = 0;
    target.style.removeProperty("--layer-drag");
  }, []);

  const onPointerDown = useCallback(
    (event: ReactPointerEvent<HTMLElement>) => {
      if (!enabled || event.button !== PRIMARY_POINTER_BUTTON) {
        return;
      }
      const rect = event.currentTarget.getBoundingClientRect();
      if (event.clientX - rect.left > EDGE_SWIPE_ZONE_PX) {
        return;
      }
      active.current = true;
      originX.current = event.clientX;
      width.current = rect.width;
      dragPx.current = 0;
      event.currentTarget.setPointerCapture(event.pointerId);
    },
    [enabled],
  );

  const onPointerMove = useCallback((event: ReactPointerEvent<HTMLElement>) => {
    if (!active.current) {
      return;
    }
    dragPx.current = Math.max(0, event.clientX - originX.current);
    event.currentTarget.style.setProperty("--layer-drag", `${dragPx.current}px`);
  }, []);

  const onPointerUp = useCallback(
    (event: ReactPointerEvent<HTMLElement>) => {
      if (!active.current) {
        return;
      }
      const committed = dragPx.current > width.current * EDGE_SWIPE_COMMIT_RATIO;
      finish(event.currentTarget);
      if (committed) {
        onCommit();
      }
    },
    [finish, onCommit],
  );

  const onPointerCancel = useCallback(
    (event: ReactPointerEvent<HTMLElement>) => {
      if (!active.current) {
        return;
      }
      finish(event.currentTarget);
    },
    [finish],
  );

  return { onPointerCancel, onPointerDown, onPointerMove, onPointerUp };
}
