import { fireEvent, render, screen } from "@testing-library/react";
import { afterEach, beforeEach, describe, expect, it, vi } from "vitest";
import { usePressHold } from "./use-press-hold";
import { LONG_PRESS_MS, PRIMARY_POINTER_BUTTON } from "./constants";

function Harness({
  enabled,
  onClick,
  onHold,
}: {
  enabled?: boolean;
  onClick?: () => void;
  onHold: () => void;
}) {
  const handlers = usePressHold({ enabled, onClick, onHold });
  return (
    <div data-testid="target" {...handlers}>
      {"hold"}
    </div>
  );
}

describe("usePressHold", () => {
  beforeEach(() => {
    vi.useFakeTimers();
    Object.defineProperty(navigator, "vibrate", { configurable: true, value: vi.fn() });
  });

  afterEach(() => {
    vi.useRealTimers();
  });

  it("clicks, holds, cancels on move, and opens from contextmenu", () => {
    const onClick = vi.fn();
    const onHold = vi.fn();
    const { rerender } = render(<Harness onClick={onClick} onHold={onHold} />);
    const target = screen.getByTestId("target");
    fireEvent.pointerMove(target, { clientX: 4, clientY: 4 });

    fireEvent.pointerDown(target, { button: 2, pointerType: "mouse" });
    fireEvent.pointerUp(target);
    expect(onClick).not.toHaveBeenCalled();

    fireEvent.pointerDown(target, {
      button: PRIMARY_POINTER_BUTTON,
      clientX: 0,
      clientY: 0,
      pointerType: "mouse",
    });
    fireEvent.pointerUp(target);
    expect(onClick).toHaveBeenCalledTimes(1);

    fireEvent.pointerDown(target, { clientX: 0, clientY: 0, pointerType: "touch" });
    fireEvent.pointerMove(target, { clientX: 30, clientY: 0 });
    vi.advanceTimersByTime(LONG_PRESS_MS + 1);
    fireEvent.pointerUp(target);
    expect(onHold).not.toHaveBeenCalled();

    fireEvent.pointerDown(target, { clientX: 0, clientY: 0, pointerType: "touch" });
    fireEvent.pointerMove(target, { clientX: 1, clientY: 0 });
    vi.advanceTimersByTime(LONG_PRESS_MS + 1);
    expect(onHold).toHaveBeenCalledTimes(1);
    fireEvent.pointerUp(target);
    expect(onClick).toHaveBeenCalledTimes(1);

    fireEvent.pointerDown(target, { clientX: 0, clientY: 0 });
    fireEvent.pointerCancel(target);

    fireEvent.contextMenu(target);
    expect(onHold).toHaveBeenCalledTimes(2);

    rerender(<Harness enabled={false} onClick={onClick} onHold={onHold} />);
    fireEvent.pointerDown(target, { clientX: 0, clientY: 0 });
    fireEvent.pointerUp(target);
    fireEvent.contextMenu(target);
    expect(onHold).toHaveBeenCalledTimes(2);
  });
});
