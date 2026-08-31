import { useCallback, useEffect, useRef, useState, type PointerEvent as ReactPointerEvent } from "react";

export interface Position {
  x: number;
  y: number;
}

export function useDraggable(initialPosition: Position | (() => Position)) {
  const [position, setPosition] = useState<Position>(initialPosition);
  const elRef = useRef<HTMLDivElement | null>(null);
  const dragRef = useRef<{ startX: number; startY: number; originX: number; originY: number } | null>(
    null,
  );
  const [isDragging, setIsDragging] = useState(false);

  const clamp = useCallback((pos: Position): Position => {
    const el = elRef.current;
    const width = el?.offsetWidth ?? 0;
    const height = el?.offsetHeight ?? 0;
    const maxX = Math.max(0, window.innerWidth - width);
    const maxY = Math.max(0, window.innerHeight - height);
    return { x: Math.min(Math.max(pos.x, 0), maxX), y: Math.min(Math.max(pos.y, 0), maxY) };
  }, []);

  const onPointerDown = useCallback(
    (event: ReactPointerEvent<HTMLDivElement>) => {
      if ((event.target as HTMLElement).closest("button, select, a, input")) {
        return;
      }
      event.currentTarget.setPointerCapture?.(event.pointerId);
      dragRef.current = {
        startX: event.clientX,
        startY: event.clientY,
        originX: position.x,
        originY: position.y,
      };
      setIsDragging(true);
    },
    [position],
  );

  const onPointerMove = useCallback(
    (event: ReactPointerEvent<HTMLDivElement>) => {
      if (!dragRef.current) {
        return;
      }
      const { startX, startY, originX, originY } = dragRef.current;
      setPosition(clamp({ x: originX + (event.clientX - startX), y: originY + (event.clientY - startY) }));
    },
    [clamp],
  );

  const endDrag = useCallback(() => {
    dragRef.current = null;
    setIsDragging(false);
  }, []);

  useEffect(() => {
    const onResize = () => setPosition((pos) => clamp(pos));
    window.addEventListener("resize", onResize);
    return () => window.removeEventListener("resize", onResize);
  }, [clamp]);

  return {
    dragHandlers: {
      onPointerCancel: endDrag,
      onPointerDown,
      onPointerMove,
      onPointerUp: endDrag,
    },
    elRef,
    isDragging,
    position,
  };
}
