import { fireEvent, render } from "@testing-library/react";
import { describe, expect, it, vi } from "vitest";
import { useEdgeSwipe } from "./use-edge-swipe";
import { EDGE_SWIPE_ZONE_PX, MOBILE_MAX_PX } from "@/shared/lib/navigation/constants";

function Target({ enabled, onCommit }: { enabled: boolean; onCommit: () => void }) {
  const swipe = useEdgeSwipe(enabled, onCommit);
  return (
    <div
      data-swipe=""
      onPointerCancel={swipe.onPointerCancel}
      onPointerDown={swipe.onPointerDown}
      onPointerMove={swipe.onPointerMove}
      onPointerUp={swipe.onPointerUp}
      style={{ width: MOBILE_MAX_PX }}
    />
  );
}

describe("useEdgeSwipe", () => {
  it("commits past the threshold, snaps back, and ignores disabled input", () => {
    const onCommit = vi.fn();
    const { rerender } = render(<Target enabled onCommit={onCommit} />);
    const node = document.querySelector("[data-swipe]") as HTMLElement;
    node.getBoundingClientRect = () => ({
      left: 0,
      width: MOBILE_MAX_PX,
      top: 0,
      height: 100,
      right: MOBILE_MAX_PX,
      bottom: 100,
      x: 0,
      y: 0,
      toJSON: () => undefined,
    });
    fireEvent.pointerDown(node, { button: 1, clientX: 8, pointerId: 1 });
    fireEvent.pointerDown(node, { button: 0, clientX: EDGE_SWIPE_ZONE_PX + 8, pointerId: 1 });
    fireEvent.pointerMove(node, { clientX: 200, pointerId: 1 });
    fireEvent.pointerUp(node, { pointerId: 1 });
    fireEvent.pointerDown(node, { button: 0, clientX: 8, pointerId: 2 });
    fireEvent.pointerMove(node, { clientX: 12, pointerId: 2 });
    fireEvent.pointerUp(node, { pointerId: 2 });
    expect(onCommit).not.toHaveBeenCalled();
    fireEvent.pointerDown(node, { button: 0, clientX: 8, pointerId: 3 });
    fireEvent.pointerMove(node, { clientX: 400, pointerId: 3 });
    fireEvent.pointerUp(node, { pointerId: 3 });
    expect(onCommit).toHaveBeenCalled();
    fireEvent.pointerDown(node, { button: 0, clientX: 8, pointerId: 4 });
    fireEvent.pointerCancel(node, { pointerId: 4 });
    fireEvent.pointerMove(node, { clientX: 400, pointerId: 4 });
    fireEvent.pointerUp(node, { pointerId: 4 });
    fireEvent.pointerCancel(node, { pointerId: 5 });
    rerender(<Target enabled={false} onCommit={onCommit} />);
    fireEvent.pointerDown(node, { button: 0, clientX: 8, pointerId: 6 });
  });
});
