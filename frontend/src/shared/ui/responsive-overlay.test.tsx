import { render, screen } from "@testing-library/react";
import { describe, expect, it } from "vitest";
import { MOBILE_MAX_PX } from "@/shared/lib/navigation/constants";
import {
  ResponsiveOverlay,
  ResponsiveOverlayContent,
  ResponsiveOverlayDescription,
  ResponsiveOverlayTitle,
} from "./responsive-overlay";

function renderOverlay(width: number) {
  Object.defineProperty(window, "innerWidth", {
    configurable: true,
    value: width,
  });
  render(
    <ResponsiveOverlay open>
      <ResponsiveOverlayContent>
        <ResponsiveOverlayTitle>{"Preferences"}</ResponsiveOverlayTitle>
        <ResponsiveOverlayDescription>{"Choose preferences"}</ResponsiveOverlayDescription>
      </ResponsiveOverlayContent>
    </ResponsiveOverlay>,
  );
  return screen.getByRole("dialog");
}

describe("ResponsiveOverlay", () => {
  it("renders the bottom-sheet presentation on mobile", () => {
    expect(renderOverlay(MOBILE_MAX_PX - 1)).toHaveClass("ui-sheet");
  });

  it("renders the centered dialog presentation on desktop", () => {
    expect(renderOverlay(MOBILE_MAX_PX + 1)).toHaveClass("ui-dialog");
  });
});
