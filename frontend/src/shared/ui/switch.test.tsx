import { render, screen } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import { describe, expect, it } from "vitest";
import { Switch } from "./switch";

describe("Switch", () => {
  it("toggles", async () => {
    const user = userEvent.setup({ pointerEventsCheck: 0 });
    render(<Switch aria-label="notify" />);
    const control = screen.getByRole("switch", { name: "notify" });
    await user.click(control);
    expect(control).toBeChecked();
  });
});
