import { fireEvent, render, screen } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import { describe, expect, it, vi } from "vitest";
import {
  ContextMenu,
  ContextMenuContent,
  ContextMenuItem,
  ContextMenuTrigger,
} from "./context-menu";

describe("ContextMenu", () => {
  it("opens on contextmenu", async () => {
    render(
      <ContextMenu>
        <ContextMenuTrigger>
          <p>{"target"}</p>
        </ContextMenuTrigger>
        <ContextMenuContent>
          <ContextMenuItem>{"Edit"}</ContextMenuItem>
        </ContextMenuContent>
      </ContextMenu>,
    );
    fireEvent.contextMenu(screen.getByText("target"));
    expect(await screen.findByRole("menuitem", { name: "Edit" })).toBeInTheDocument();
  });

  it("opens from the keyboard context-menu shortcut", async () => {
    const user = userEvent.setup();
    const onKeyDown = vi.fn();
    render(
      <ContextMenu>
        <ContextMenuTrigger asChild onKeyDown={onKeyDown}>
          <button type="button">{"target"}</button>
        </ContextMenuTrigger>
        <ContextMenuContent>
          <ContextMenuItem>{"Edit"}</ContextMenuItem>
        </ContextMenuContent>
      </ContextMenu>,
    );
    screen.getByRole("button", { name: "target" }).focus();
    await user.keyboard("{Shift>}{F10}{/Shift}");
    expect(onKeyDown).toHaveBeenCalled();
    expect(await screen.findByRole("menuitem", { name: "Edit" })).toBeInTheDocument();
  });
});
