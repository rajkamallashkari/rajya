import { render, screen } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import { describe, expect, it } from "vitest";
import { Button } from "./button";
import { Popover, PopoverContent, PopoverTrigger } from "./popover";

describe("Popover", () => {
  it("opens from a trigger", async () => {
    const user = userEvent.setup({ pointerEventsCheck: 0 });
    render(
      <Popover>
        <PopoverTrigger asChild>
          <Button>{"Details"}</Button>
        </PopoverTrigger>
        <PopoverContent>{"More information"}</PopoverContent>
      </Popover>,
    );
    await user.click(screen.getByRole("button", { name: "Details" }));
    expect(await screen.findByText("More information")).toBeInTheDocument();
  });
});
