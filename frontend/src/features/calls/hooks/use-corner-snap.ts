import { useCallback, useEffect, useRef, useState, type PointerEvent as ReactPointerEvent } from "react";
import {
  CALL_CORNER_MARGIN_PX,
  CALL_DRAG_THRESHOLD_PX,
  CALL_PIP_HEIGHT_PX,
  CALL_PIP_WIDTH_PX,
} from "@/features/calls/model/constants";
import type { Position } from "@/features/calls/hooks/use-draggable";

export type Corner = "bottom-left" | "bottom-right" | "top-left" | "top-right";

export function cornerPosition(corner: Corner, width: number, height: number): Position {
  const maxX = Math.max(CALL_CORNER_MARGIN_PX, window.innerWidth - width - CALL_CORNER_MARGIN_PX);
  const maxY = Math.max(CALL_CORNER_MARGIN_PX, window.innerHeight - height - CALL_CORNER_MARGIN_PX);
  if (corner === "top-left") {
    return { x: CALL_CORNER_MARGIN_PX, y: CALL_CORNER_MARGIN_PX };
  }
  if (corner === "top-right") {
    return { x: maxX, y: CALL_CORNER_MARGIN_PX };
  }
  if (corner === "bottom-left") {
    return { x: CALL_CORNER_MARGIN_PX, y: maxY };
  }
  return { x: maxX, y: maxY };
}

export function nearestCorner(pos: Position, width: number, height: number): Corner {
  const cx = pos.x + width / 2;
  const cy = pos.y + height / 2;
  const left = cx < window.innerWidth / 2;
  const top = cy < window.innerHeight / 2;
  if (top && left) {
    return "top-left";
  }
  if (top) {
    return "top-right";
  }
  if (left) {
    return "bottom-left";
  }
  return "bottom-right";
}

export function useCornerSnap(initialCorner: Corner = "bottom-right") {
  const elRef = useRef<HTMLDivElement | null>(null);
  const [position, setPosition] = useState<Position>(() =>
    cornerPosition(initialCorner, CALL_PIP_WIDTH_PX, CALL_PIP_HEIGHT_PX),
  );
  const [isDragging, setIsDragging] = useState(false);
  const [corner, setCorner] = useState<Corner>(initialCorner);
  const dragRef = useRef<{
    moved: boolean;
    originX: number;
    originY: number;
    startX: number;
    startY: number;
  } | null>(null);

  const snapTo = useCallback((next: Corner) => {
    const el = elRef.current;
    const width = el?.offsetWidth ?? CALL_PIP_WIDTH_PX;
    const height = el?.offsetHeight ?? CALL_PIP_HEIGHT_PX;
    setCorner(next);
    setPosition(cornerPosition(next, width, height));
  }, []);

  const onPointerDown = useCallback(
    (event: ReactPointerEvent<HTMLDivElement>) => {
      if ((event.target as HTMLElement).closest("button, a, input, select")) {
        return;
      }
      event.preventDefault();
      event.currentTarget.setPointerCapture?.(event.pointerId);
      dragRef.current = {
        moved: false,
        originX: position.x,
        originY: position.y,
        startX: event.clientX,
        startY: event.clientY,
      };
      setIsDragging(true);
    },
    [position],
  );

  const onPointerMove = useCallback((event: ReactPointerEvent<HTMLDivElement>) => {
    if (!dragRef.current) {
      return;
    }
    const { originX, originY, startX, startY } = dragRef.current;
    const dx = event.clientX - startX;
    const dy = event.clientY - startY;
    if (Math.abs(dx) > CALL_DRAG_THRESHOLD_PX || Math.abs(dy) > CALL_DRAG_THRESHOLD_PX) {
      dragRef.current.moved = true;
    }
    const el = elRef.current;
    const width = el?.offsetWidth ?? CALL_PIP_WIDTH_PX;
    const height = el?.offsetHeight ?? CALL_PIP_HEIGHT_PX;
    const maxX = Math.max(0, window.innerWidth - width);
    const maxY = Math.max(0, window.innerHeight - height);
    setPosition({
      x: Math.min(Math.max(originX + dx, 0), maxX),
      y: Math.min(Math.max(originY + dy, 0), maxY),
    });
  }, []);

  const endDrag = useCallback(() => {
    if (!dragRef.current) {
      return;
    }
    const moved = dragRef.current.moved;
    dragRef.current = null;
    setIsDragging(false);
    if (!moved) {
      return;
    }
    const el = elRef.current;
    const width = el?.offsetWidth ?? CALL_PIP_WIDTH_PX;
    const height = el?.offsetHeight ?? CALL_PIP_HEIGHT_PX;
    setPosition((pos) => {
      const next = nearestCorner(pos, width, height);
      setCorner(next);
      return cornerPosition(next, width, height);
    });
  }, []);

  useEffect(() => {
    const onResize = () => snapTo(corner);
    window.addEventListener("resize", onResize);
    return () => window.removeEventListener("resize", onResize);
  }, [corner, snapTo]);

  const didDrag = useCallback(() => Boolean(dragRef.current?.moved), []);

  return {
    corner,
    didDrag,
    dragHandlers: {
      onPointerCancel: endDrag,
      onPointerDown,
      onPointerMove,
      onPointerUp: endDrag,
    },
    elRef,
    isDragging,
    position,
    snapTo,
  };
}
