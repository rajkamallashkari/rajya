import { render, screen } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import { describe, expect, it } from "vitest";
import { Checkbox } from "./checkbox";

describe("Checkbox", () => {
  it("toggles checked state", async () => {
    const user = userEvent.setup({ pointerEventsCheck: 0 });
    render(<Checkbox aria-label="remember" />);
    const box = screen.getByRole("checkbox", { name: "remember" });
    expect(box).not.toBeChecked();
    await user.click(box);
    expect(box).toBeChecked();
  });
});
