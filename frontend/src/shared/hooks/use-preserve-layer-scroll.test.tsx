import { fireEvent, render, screen } from "@testing-library/react";
import { useRef, type ReactNode } from "react";
import { describe, expect, it } from "vitest";
import { usePreserveLayerScroll } from "./use-preserve-layer-scroll";

function Host({
  active,
  extra,
  inert,
}: {
  active: boolean;
  extra?: ReactNode;
  inert?: boolean;
}): ReactNode {
  const ref = useRef<HTMLDivElement>(null);
  usePreserveLayerScroll(ref, active);
  return (
    <div data-testid="root" inert={inert ? true : undefined} ref={ref}>
      <div data-layer-scroll="base" data-testid="scroller">
        <span>{"row"}</span>
      </div>
      {extra}
    </div>
  );
}

function Detached(): ReactNode {
  const ref = useRef<HTMLDivElement>(null);
  usePreserveLayerScroll(ref, true);
  return <p>{"detached"}</p>;
}

describe("usePreserveLayerScroll", () => {
  it("restores the position locked on pointerdown after the layer is uncovered", () => {
    const { rerender } = render(<Host active />);
    const scroller = screen.getByTestId("scroller");
    scroller.scrollTop = 48;
    fireEvent.scroll(scroller);
    fireEvent.pointerDown(scroller);
    scroller.scrollTop = 0;
    fireEvent.scroll(scroller);
    rerender(<Host active={false} inert />);
    scroller.scrollTop = 0;
    fireEvent.scroll(scroller);
    fireEvent.pointerDown(scroller);
    rerender(<Host active />);
    expect(scroller.scrollTop).toBe(48);
  });

  it("keeps scroll captured while unlocked until pointerdown freezes it", () => {
    const { rerender } = render(<Host active extra={<span>{"x"}</span>} />);
    const scroller = screen.getByTestId("scroller");
    scroller.scrollTop = 24;
    fireEvent.scroll(scroller);
    rerender(<Host active={false} extra={<span>{"x"}</span>} inert />);
    scroller.scrollTop = 0;
    fireEvent.scroll(scroller);
    rerender(<Host active extra={<span>{"x"}</span>} />);
    expect(scroller.scrollTop).toBe(24);
  });

  it("is a no-op when the layer node is missing", () => {
    render(<Detached />);
    expect(screen.getByText("detached")).toBeInTheDocument();
  });
});
