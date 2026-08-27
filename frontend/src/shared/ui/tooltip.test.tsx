import { render, screen } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import { describe, expect, it } from "vitest";
import { Button } from "./button";
import { SimpleTooltip, TooltipProvider } from "./tooltip";

describe("Tooltip", () => {
  it("shows content on hover", async () => {
    const user = userEvent.setup({ pointerEventsCheck: 0 });
    render(
      <TooltipProvider delayDuration={0}>
        <SimpleTooltip content="Send a message">
          <Button>{"Hint"}</Button>
        </SimpleTooltip>
      </TooltipProvider>,
    );
    await user.hover(screen.getByRole("button", { name: "Hint" }));
    expect(await screen.findByRole("tooltip")).toHaveTextContent("Send a message");
  });
});
