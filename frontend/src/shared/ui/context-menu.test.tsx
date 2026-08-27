import { fireEvent, render, screen } from "@testing-library/react";
import { describe, expect, it } from "vitest";
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
});
