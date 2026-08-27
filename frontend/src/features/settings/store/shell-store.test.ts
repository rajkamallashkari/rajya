import { describe, expect, it } from "vitest";
import { useShellStore } from "./shell-store";

describe("useShellStore", () => {
  it("toggles mobile nav", () => {
    useShellStore.setState({ mobileNavOpen: false });
    useShellStore.getState().setMobileNavOpen(true);
    expect(useShellStore.getState().mobileNavOpen).toBe(true);
    useShellStore.getState().setMobileNavOpen(false);
    expect(useShellStore.getState().mobileNavOpen).toBe(false);
  });
});
