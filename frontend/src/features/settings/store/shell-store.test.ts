import { describe, expect, it } from "vitest";
import { resetShellStore, useShellStore } from "./shell-store";

describe("useShellStore", () => {
  it("sets and clears impersonation", () => {
    useShellStore.getState().setImpersonatingName("Ada");
    expect(useShellStore.getState().impersonatingName).toBe("Ada");
    useShellStore.getState().setImpersonatingName(null);
    expect(useShellStore.getState().impersonatingName).toBeNull();
    useShellStore.getState().setSettingsPanel("chats");
    expect(useShellStore.getState().settingsPanel).toBe("chats");
    useShellStore.getState().setSettingsPanel("devices");
    expect(useShellStore.getState().settingsPanel).toBe("devices");
    useShellStore.getState().setDestination("calls");
    expect(useShellStore.getState().destination).toBe("calls");
    useShellStore.getState().setDestination("profile");
    expect(useShellStore.getState().destination).toBe("profile");
    resetShellStore();
    expect(useShellStore.getState().settingsPanel).toBe("hub");
    expect(useShellStore.getState().destination).toBe("chats");
    expect(useShellStore.getState().profileSettingsOpen).toBe(false);
    useShellStore.getState().setProfileSettingsOpen(true);
    useShellStore.getState().setCallsContact({ conversationId: "9", accountId: "4" });
    useShellStore.getState().setDestination("calls");
    expect(useShellStore.getState().profileSettingsOpen).toBe(false);
    expect(useShellStore.getState().callsContact).toBeNull();
  });
});
