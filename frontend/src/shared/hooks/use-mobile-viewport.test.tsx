import { render, screen } from "@testing-library/react";
import { describe, expect, it } from "vitest";
import { useMobileViewport } from "./use-mobile-viewport";
import { MOBILE_MAX_PX } from "@/shared/lib/navigation/constants";

function Probe() {
  const mobile = useMobileViewport();
  return <p>{mobile ? "mobile" : "desktop"}</p>;
}

describe("useMobileViewport", () => {
  it("subscribes to viewport changes", () => {
    Object.defineProperty(window, "innerWidth", {
      configurable: true,
      writable: true,
      value: 1280,
    });
    const { unmount } = render(<Probe />);
    expect(screen.getByText("desktop")).toBeInTheDocument();
    unmount();
    Object.defineProperty(window, "innerWidth", {
      configurable: true,
      writable: true,
      value: MOBILE_MAX_PX - 10,
    });
    render(<Probe />);
    expect(screen.getByText("mobile")).toBeInTheDocument();
  });
});
