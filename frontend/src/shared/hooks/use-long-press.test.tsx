import { fireEvent, render, screen } from "@testing-library/react";
import { afterEach, beforeEach, describe, expect, it, vi } from "vitest";
import { useLongPress } from "@/shared/hooks";
import { LONG_PRESS_MS, PRIMARY_POINTER_BUTTON } from "./constants";

function Harness({
  enabled,
  onLongPress,
}: {
  enabled?: boolean;
  onLongPress: ((point: { clientX: number; clientY: number }) => void) | null;
}) {
  const handlers = useLongPress(onLongPress, { enabled });
  return (
    <div data-testid="target" {...handlers}>
      {"press"}
    </div>
  );
}

describe("useLongPress", () => {
  beforeEach(() => {
    vi.useFakeTimers();
    Object.defineProperty(navigator, "vibrate", { configurable: true, value: vi.fn() });
  });

  afterEach(() => {
    vi.useRealTimers();
  });

  it("fires after the delay, cancels on move or early release, and ignores secondary buttons", () => {
    const onLongPress = vi.fn();
    const { rerender } = render(<Harness onLongPress={onLongPress} />);
    const target = screen.getByTestId("target");

    fireEvent.pointerDown(target, { button: 2, clientX: 1, clientY: 1, pointerType: "mouse" });
    vi.advanceTimersByTime(LONG_PRESS_MS + 1);
    expect(onLongPress).not.toHaveBeenCalled();

    fireEvent.pointerDown(target, {
      button: PRIMARY_POINTER_BUTTON,
      clientX: 0,
      clientY: 0,
      pointerType: "mouse",
    });
    vi.advanceTimersByTime(LONG_PRESS_MS / 2);
    fireEvent.pointerUp(target);
    vi.advanceTimersByTime(LONG_PRESS_MS);
    expect(onLongPress).not.toHaveBeenCalled();

    fireEvent.pointerDown(target, { clientX: 0, clientY: 0, pointerType: "touch" });
    fireEvent.pointerMove(target, { clientX: 40, clientY: 0, pointerType: "touch" });
    vi.advanceTimersByTime(LONG_PRESS_MS + 1);
    expect(onLongPress).not.toHaveBeenCalled();

    fireEvent.pointerDown(target, { clientX: 5, clientY: 6, pointerType: "touch" });
    fireEvent.pointerMove(target, { clientX: 6, clientY: 6, pointerType: "touch" });
    vi.advanceTimersByTime(LONG_PRESS_MS + 1);
    expect(onLongPress).toHaveBeenCalledWith({ clientX: 5, clientY: 6 });
    fireEvent.contextMenu(target);
    fireEvent.pointerCancel(target);

    rerender(<Harness enabled={false} onLongPress={onLongPress} />);
    fireEvent.pointerDown(target, { clientX: 0, clientY: 0 });
    vi.advanceTimersByTime(LONG_PRESS_MS + 1);

    rerender(<Harness onLongPress={null} />);
    fireEvent.pointerDown(target, { clientX: 0, clientY: 0 });
    vi.advanceTimersByTime(LONG_PRESS_MS + 1);
    expect(onLongPress).toHaveBeenCalledTimes(1);
  });
});
