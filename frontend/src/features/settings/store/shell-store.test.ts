import { describe, expect, it } from "vitest";
import { resetShellStore, useShellStore } from "./shell-store";

describe("useShellStore", () => {
  it("sets and clears impersonation", () => {
    useShellStore.getState().setImpersonatingName("Ada");
    expect(useShellStore.getState().impersonatingName).toBe("Ada");
    useShellStore.getState().setImpersonatingName(null);
    expect(useShellStore.getState().impersonatingName).toBeNull();
    useShellStore.getState().setSettingsPanel("devices");
    expect(useShellStore.getState().settingsPanel).toBe("devices");
    resetShellStore();
    expect(useShellStore.getState().settingsPanel).toBe("hub");
  });
});
