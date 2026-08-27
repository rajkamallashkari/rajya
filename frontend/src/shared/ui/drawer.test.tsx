import { render } from "@testing-library/react";
import { describe, expect, it } from "vitest";
import { Drawer, DrawerContent, DrawerTitle } from "./drawer";

describe("Drawer", () => {
  it("opens from the right by default and from the left when asked", () => {
    const { unmount } = render(
      <Drawer defaultOpen>
        <DrawerContent>
          <DrawerTitle>{"Account"}</DrawerTitle>
        </DrawerContent>
      </Drawer>,
    );
    expect(document.querySelector(".ui-drawer-right")).not.toBeNull();
    unmount();
    render(
      <Drawer defaultOpen>
        <DrawerContent side="left">
          <DrawerTitle>{"Account"}</DrawerTitle>
        </DrawerContent>
      </Drawer>,
    );
    expect(document.querySelector(".ui-drawer-left")).not.toBeNull();
  });
});
