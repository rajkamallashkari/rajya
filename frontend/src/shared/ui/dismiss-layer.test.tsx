import { render, screen } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import { describe, expect, it, vi } from "vitest";
import { DismissLayer } from "./dismiss-layer";

describe("DismissLayer", () => {
  it("dismisses without a hover fill and can render a scrim", async () => {
    const user = userEvent.setup();
    const onDismiss = vi.fn();
    const { rerender } = render(<DismissLayer className="z-[var(--z-modal)]" label="Close" onDismiss={onDismiss} />);
    const clear = screen.getByRole("button", { name: "Close" });
    expect(clear).toHaveAttribute("data-dismiss-layer", "clear");
    expect(clear.className).toContain("hover:bg-transparent");
    await user.click(clear);
    expect(onDismiss).toHaveBeenCalled();
    rerender(<DismissLayer label="Close" onDismiss={onDismiss} scrim />);
    expect(screen.getByRole("button", { name: "Close" })).toHaveAttribute("data-dismiss-layer", "scrim");
    expect(document.querySelector(".ui-scrim")).not.toBeNull();
  });
});
