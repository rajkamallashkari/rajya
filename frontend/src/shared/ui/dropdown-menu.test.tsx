import { render, screen } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import { describe, expect, it } from "vitest";
import { Button } from "./button";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuLabel,
  DropdownMenuTrigger,
} from "./dropdown-menu";

describe("DropdownMenu", () => {
  it("opens items from the trigger", async () => {
    const user = userEvent.setup({ pointerEventsCheck: 0 });
    render(
      <DropdownMenu>
        <DropdownMenuTrigger asChild>
          <Button>{"Actions"}</Button>
        </DropdownMenuTrigger>
        <DropdownMenuContent>
          <DropdownMenuLabel>{"Section"}</DropdownMenuLabel>
          <DropdownMenuItem>{"Edit"}</DropdownMenuItem>
        </DropdownMenuContent>
      </DropdownMenu>,
    );
    await user.click(screen.getByRole("button", { name: "Actions" }));
    expect(await screen.findByRole("menuitem", { name: "Edit" })).toBeInTheDocument();
    expect(screen.getByText("Section")).toBeInTheDocument();
  });
});
