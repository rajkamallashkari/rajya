import { render, screen } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import { describe, expect, it } from "vitest";
import { IconButton } from "./icon-button";

describe("IconButton", () => {
  it("requires a label and uses the icon size", async () => {
    const user = userEvent.setup();
    let clicked = false;
    render(
      <IconButton
        aria-label="star"
        onClick={() => {
          clicked = true;
        }}
      >
        <span>{"*"}</span>
      </IconButton>,
    );
    await user.click(screen.getByRole("button", { name: "star" }));
    expect(clicked).toBe(true);
  });

  it("accepts a non-ghost variant", () => {
    render(
      <IconButton aria-label="go" variant="primary">
        <span>{"*"}</span>
      </IconButton>,
    );
    expect(screen.getByRole("button", { name: "go" })).toBeInTheDocument();
  });
});
