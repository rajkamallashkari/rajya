import { fireEvent, render, screen } from "@testing-library/react";
import { afterEach, beforeEach, describe, expect, it, vi } from "vitest";
import { useChatListGestures } from "./use-chat-list-gestures";
import { LONG_PRESS_MS } from "@/shared/hooks/constants";
import { SWIPE_COMMIT_PX, SWIPE_MAX_LEFT_PX } from "@/features/conversations/model/constants";

function Harness({
  canSwipeRight = true,
  onCommitRight,
  onLongPress,
  onOpen,
}: {
  canSwipeRight?: boolean;
  onCommitRight: () => void;
  onLongPress: (point: { x: number; y: number }) => void;
  onOpen: () => void;
}) {
  const g = useChatListGestures({ canSwipeRight, onCommitRight, onLongPress, onOpen });
  return (
    <div
      data-offset={g.offset}
      data-testid="row"
      onContextMenu={g.onContextMenu}
      onPointerCancel={g.onPointerCancel}
      onPointerDown={g.onPointerDown}
      onPointerMove={g.onPointerMove}
      onPointerUp={g.onPointerUp}
    >
      {"row"}
    </div>
  );
}

describe("useChatListGestures", () => {
  beforeEach(() => {
    vi.useFakeTimers();
    Object.defineProperty(navigator, "vibrate", { configurable: true, value: vi.fn() });
  });

  afterEach(() => {
    vi.useRealTimers();
  });

  it("opens, swipes, long-presses, and ignores secondary buttons", () => {
    const onCommitRight = vi.fn();
    const onLongPress = vi.fn();
    const onOpen = vi.fn();
    const { rerender } = render(
      <Harness onCommitRight={onCommitRight} onLongPress={onLongPress} onOpen={onOpen} />,
    );
    const row = screen.getByTestId("row");
    fireEvent.pointerMove(row, { clientX: 10, clientY: 10 });

    fireEvent.pointerDown(row, { button: 2, pointerType: "mouse" });
    fireEvent.pointerUp(row);
    expect(onOpen).not.toHaveBeenCalled();

    fireEvent.pointerDown(row, { button: 0, clientX: 100, clientY: 10, pointerType: "mouse" });
    fireEvent.pointerUp(row);
    expect(onOpen).toHaveBeenCalledTimes(1);

    fireEvent.pointerDown(row, { clientX: 100, clientY: 10 });
    fireEvent.pointerMove(row, { clientX: 100 - SWIPE_COMMIT_PX - 1, clientY: 10 });
    fireEvent.pointerUp(row);
    expect(row).toHaveAttribute("data-offset", String(-SWIPE_MAX_LEFT_PX));

    fireEvent.pointerDown(row, { clientX: 100, clientY: 10 });
    fireEvent.pointerMove(row, { clientX: 200, clientY: 10 });
    fireEvent.pointerUp(row);

    fireEvent.pointerDown(row, { clientX: 100, clientY: 10 });
    fireEvent.pointerMove(row, { clientX: 100 + SWIPE_COMMIT_PX + 1, clientY: 10 });
    fireEvent.pointerUp(row);
    expect(onCommitRight).toHaveBeenCalled();

    fireEvent.pointerDown(row, { clientX: 50, clientY: 10 });
    fireEvent.pointerMove(row, { clientX: 55, clientY: 10 });
    fireEvent.pointerUp(row);

    fireEvent.pointerDown(row, { clientX: 20, clientY: 8 });
    vi.advanceTimersByTime(LONG_PRESS_MS + 1);
    expect(onLongPress).toHaveBeenCalled();
    fireEvent.pointerUp(row);

    fireEvent.pointerDown(row, { clientX: 20, clientY: 8 });
    fireEvent.pointerCancel(row);

    fireEvent.contextMenu(row);
    expect(onLongPress).toHaveBeenCalledTimes(2);

    rerender(
      <Harness
        canSwipeRight={false}
        onCommitRight={onCommitRight}
        onLongPress={onLongPress}
        onOpen={onOpen}
      />,
    );
    fireEvent.pointerDown(row, { clientX: 40, clientY: 0 });
    fireEvent.pointerMove(row, { clientX: 80, clientY: 0 });
    fireEvent.pointerUp(row);
  });
});
