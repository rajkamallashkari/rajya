import { render, screen } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import { describe, expect, it } from "vitest";
import { Button } from "./button";

describe("Button", () => {
  it("renders a button and handles clicks", async () => {
    const user = userEvent.setup();
    let clicked = false;
    render(
      <Button
        onClick={() => {
          clicked = true;
        }}
      >
        {"ok"}
      </Button>,
    );
    await user.click(screen.getByRole("button"));
    expect(clicked).toBe(true);
  });

  it("supports asChild and variants", () => {
    const { rerender } = render(
      <Button asChild variant="ghost" size="icon">
        <a href="/">go</a>
      </Button>,
    );
    expect(screen.getByRole("link")).toHaveAttribute("href", "/");
    rerender(
      <Button variant="outline" type="submit">
        {"send"}
      </Button>,
    );
    expect(screen.getByRole("button")).toHaveAttribute("type", "submit");
  });
});
