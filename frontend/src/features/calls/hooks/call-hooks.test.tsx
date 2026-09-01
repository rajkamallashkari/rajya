import { act, renderHook } from "@testing-library/react";
import { afterEach, describe, expect, it, vi } from "vitest";
import { useCallElapsed, formatElapsed } from "@/features/calls/hooks/use-call-elapsed";
import { useCanFlipCamera } from "@/features/calls/hooks/use-can-flip-camera";
import {
  cornerPosition,
  nearestCorner,
  useCornerSnap,
} from "@/features/calls/hooks/use-corner-snap";
import { useDraggable } from "@/features/calls/hooks/use-draggable";
import { useSwipeUp } from "@/features/calls/hooks/use-swipe-up";
import { CALL_PIP_HEIGHT_PX, CALL_PIP_WIDTH_PX } from "@/features/calls/model/constants";
import { resetCallStore, useCallStore } from "@/features/calls/store/call-store";
import { MOBILE_MAX_PX } from "@/shared/lib/navigation/constants";

describe("call hooks", () => {
  afterEach(() => {
    resetCallStore();
    vi.useRealTimers();
  });

  it("formats elapsed time and ticks while a call is active", () => {
    expect(formatElapsed(0)).toBe("00:00");
    expect(formatElapsed(65_000)).toBe("01:05");
    vi.useFakeTimers();
    vi.setSystemTime(new Date("2026-01-01T00:00:00.000Z"));
    useCallStore.setState({ startedAt: Date.now(), status: "active" });
    const { result, rerender } = renderHook(() => useCallElapsed());
    expect(result.current).toBe("00:00");
    act(() => {
      vi.advanceTimersByTime(1000);
    });
    expect(result.current).toBe("00:01");
    act(() => {
      useCallStore.setState({ status: "idle" });
    });
    rerender();
    expect(result.current).toBe("00:00");
  });

  it("snaps PiP tiles to the nearest corner", () => {
    Object.defineProperty(window, "innerWidth", { configurable: true, value: 800 });
    Object.defineProperty(window, "innerHeight", { configurable: true, value: 600 });
    expect(nearestCorner({ x: 10, y: 10 }, 120, 160)).toBe("top-left");
    expect(nearestCorner({ x: 700, y: 10 }, 120, 160)).toBe("top-right");
    expect(nearestCorner({ x: 10, y: 500 }, 120, 160)).toBe("bottom-left");
    expect(nearestCorner({ x: 700, y: 500 }, 120, 160)).toBe("bottom-right");
    expect(cornerPosition("top-left", CALL_PIP_WIDTH_PX, CALL_PIP_HEIGHT_PX).x).toBe(12);
    expect(cornerPosition("top-right", CALL_PIP_WIDTH_PX, CALL_PIP_HEIGHT_PX).x).toBeGreaterThan(
      12,
    );
    expect(cornerPosition("bottom-left", CALL_PIP_WIDTH_PX, CALL_PIP_HEIGHT_PX).y).toBeGreaterThan(
      12,
    );
    expect(cornerPosition("bottom-right", CALL_PIP_WIDTH_PX, CALL_PIP_HEIGHT_PX).y).toBeGreaterThan(
      12,
    );
    const { result } = renderHook(() => useCornerSnap("top-left"));
    const node = document.createElement("div");
    Object.defineProperty(node, "offsetWidth", { value: 120 });
    Object.defineProperty(node, "offsetHeight", { value: 160 });
    result.current.elRef.current = node;
    act(() => {
      result.current.dragHandlers.onPointerDown({
        preventDefault: () => undefined,
        currentTarget: { setPointerCapture: () => undefined },
        target: node,
        clientX: 20,
        clientY: 20,
        pointerId: 1,
      } as never);
    });
    expect(result.current.didDrag()).toBe(false);
    act(() => {
      result.current.dragHandlers.onPointerMove({
        clientX: 400,
        clientY: 300,
      } as never);
    });
    expect(result.current.didDrag()).toBe(true);
    act(() => {
      result.current.dragHandlers.onPointerUp();
    });
    expect(result.current.corner).toBe("bottom-right");
    act(() => {
      result.current.elRef.current = null;
      result.current.snapTo("top-left");
    });
    result.current.elRef.current = node;
    act(() => {
      result.current.dragHandlers.onPointerDown({
        preventDefault: () => undefined,
        currentTarget: { setPointerCapture: () => undefined },
        target: node,
        clientX: 20,
        clientY: 20,
        pointerId: 1,
      } as never);
    });
    act(() => {
      result.current.dragHandlers.onPointerMove({ clientX: 22, clientY: 21 } as never);
    });
    result.current.elRef.current = null;
    act(() => {
      result.current.dragHandlers.onPointerMove({ clientX: 500, clientY: 400 } as never);
      result.current.dragHandlers.onPointerUp();
    });
    result.current.elRef.current = node;
    act(() => {
      result.current.snapTo("top-right");
      window.dispatchEvent(new Event("resize"));
    });
    act(() => {
      result.current.dragHandlers.onPointerDown({
        preventDefault: () => undefined,
        currentTarget: { setPointerCapture: () => undefined },
        target: document.createElement("button"),
        clientX: 1,
        clientY: 1,
        pointerId: 1,
      } as never);
    });
    act(() => {
      result.current.dragHandlers.onPointerMove({ clientX: 2, clientY: 2 } as never);
      result.current.dragHandlers.onPointerCancel();
      result.current.dragHandlers.onPointerUp();
    });
  });

  it("drags a floating surface and clamps it", () => {
    Object.defineProperty(window, "innerWidth", { configurable: true, value: 400 });
    Object.defineProperty(window, "innerHeight", { configurable: true, value: 400 });
    const { result } = renderHook(() => useDraggable({ x: 10, y: 10 }));
    const node = document.createElement("div");
    Object.defineProperty(node, "offsetWidth", { value: 100 });
    Object.defineProperty(node, "offsetHeight", { value: 100 });
    result.current.elRef.current = node;
    act(() => {
      result.current.dragHandlers.onPointerDown({
        currentTarget: { setPointerCapture: () => undefined },
        target: node,
        clientX: 20,
        clientY: 20,
        pointerId: 1,
      } as never);
    });
    act(() => {
      result.current.dragHandlers.onPointerMove({ clientX: 80, clientY: 90 } as never);
    });
    expect(result.current.isDragging).toBe(true);
    act(() => {
      result.current.dragHandlers.onPointerUp();
      result.current.elRef.current = null;
      window.dispatchEvent(new Event("resize"));
      result.current.dragHandlers.onPointerMove({ clientX: 0, clientY: 0 } as never);
      result.current.dragHandlers.onPointerDown({
        currentTarget: { setPointerCapture: () => undefined },
        target: document.createElement("button"),
        clientX: 1,
        clientY: 1,
        pointerId: 1,
      } as never);
    });
    expect(result.current.isDragging).toBe(false);
  });

  it("treats a vertical swipe as silence and a small move as a tap", () => {
    const onSwipeUp = vi.fn();
    const onTap = vi.fn();
    const { result } = renderHook(() => useSwipeUp({ onSwipeUp, onTap }));
    const node = document.createElement("div");
    result.current.onPointerDown({
      currentTarget: { setPointerCapture: () => undefined },
      target: node,
      clientX: 50,
      clientY: 200,
      pointerId: 1,
    } as never);
    result.current.onPointerMove({ clientX: 50, clientY: 100 } as never);
    result.current.onPointerUp({ clientX: 50, clientY: 100 } as never);
    expect(onSwipeUp).toHaveBeenCalledTimes(1);
    result.current.onPointerDown({
      currentTarget: { setPointerCapture: () => undefined },
      target: node,
      clientX: 50,
      clientY: 200,
      pointerId: 1,
    } as never);
    result.current.onPointerMove({ clientX: 51, clientY: 201 } as never);
    result.current.onPointerUp({ clientX: 51, clientY: 201 } as never);
    expect(onTap).toHaveBeenCalledTimes(1);
    result.current.onPointerDown({
      currentTarget: { setPointerCapture: () => undefined },
      target: document.createElement("button"),
      clientX: 1,
      clientY: 1,
      pointerId: 1,
    } as never);
    result.current.onPointerMove({ clientX: 1, clientY: 1 } as never);
    result.current.onPointerUp({ clientX: 1, clientY: 1 } as never);
    result.current.onPointerDown({
      currentTarget: { setPointerCapture: () => undefined },
      target: node,
      clientX: 50,
      clientY: 200,
      pointerId: 1,
    } as never);
    result.current.onPointerUp({ clientX: 50, clientY: 20 } as never);
    expect(onSwipeUp).toHaveBeenCalledTimes(2);
    result.current.onPointerDown({
      currentTarget: { setPointerCapture: () => undefined },
      target: node,
      clientX: 10,
      clientY: 10,
      pointerId: 1,
    } as never);
    result.current.onPointerCancel();
    result.current.onPointerMove({ clientX: 1, clientY: 1 } as never);
    result.current.onPointerUp({ clientX: 1, clientY: 1 } as never);
  });

  it("enables camera flip on mobile when two cameras exist", async () => {
    const originalMatch = window.matchMedia;
    Object.defineProperty(window, "innerWidth", { configurable: true, writable: true, value: 390 });
    window.matchMedia = ((query: string) => ({
      matches: query.includes("max-width") || query.includes("coarse"),
      media: query,
      addEventListener: vi.fn(),
      removeEventListener: vi.fn(),
      addListener: vi.fn(),
      removeListener: vi.fn(),
      dispatchEvent: vi.fn(),
      onchange: null,
    })) as typeof window.matchMedia;
    const listeners: Array<() => void> = [];
    Object.defineProperty(navigator, "mediaDevices", {
      configurable: true,
      value: {
        enumerateDevices: vi.fn(async () => [
          { kind: "videoinput" },
          { kind: "videoinput" },
          { kind: "audioinput" },
        ]),
        addEventListener: (_event: string, fn: () => void) => listeners.push(fn),
        removeEventListener: vi.fn(),
      },
    });
    const { result, unmount } = renderHook(() => useCanFlipCamera());
    await act(async () => {
      await Promise.resolve();
    });
    expect(result.current).toBe(true);
    listeners[0]?.();
    unmount();
    Object.defineProperty(navigator, "mediaDevices", {
      configurable: true,
      value: {
        enumerateDevices: vi.fn(async () => {
          throw new Error("denied");
        }),
        addEventListener: vi.fn(),
        removeEventListener: vi.fn(),
      },
    });
    const denied = renderHook(() => useCanFlipCamera());
    await act(async () => {
      await Promise.resolve();
    });
    expect(denied.result.current).toBe(false);
    denied.unmount();
    Object.defineProperty(window, "innerWidth", {
      configurable: true,
      writable: true,
      value: MOBILE_MAX_PX + 100,
    });
    window.matchMedia = ((query: string) => ({
      matches: false,
      media: query,
      addEventListener: vi.fn(),
      removeEventListener: vi.fn(),
      addListener: vi.fn(),
      removeListener: vi.fn(),
      dispatchEvent: vi.fn(),
      onchange: null,
    })) as typeof window.matchMedia;
    const desktop = renderHook(() => useCanFlipCamera());
    expect(desktop.result.current).toBe(false);
    desktop.unmount();
    window.matchMedia = originalMatch;
  });
});
