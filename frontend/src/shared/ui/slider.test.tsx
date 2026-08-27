import { render, screen } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import { describe, expect, it } from "vitest";
import { Slider } from "./slider";

describe("Slider", () => {
  it("exposes the current value and moves with the keyboard", async () => {
    const user = userEvent.setup();
    render(<Slider aria-label="volume" defaultValue={[40]} />);
    const slider = screen.getByRole("slider", { name: "volume" });
    expect(slider).toHaveAttribute("aria-valuenow", "40");
    slider.focus();
    await user.keyboard("{ArrowRight}");
    expect(Number(slider.getAttribute("aria-valuenow"))).toBeGreaterThan(40);
  });
});
