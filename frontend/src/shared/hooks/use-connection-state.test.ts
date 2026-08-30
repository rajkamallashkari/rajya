import { act, renderHook } from "@testing-library/react";
import { describe, expect, it, vi } from "vitest";
import { useAccountsStore } from "@/features/auth/store/accounts-store";
import { useConnectionState } from "./use-connection-state";
import { CONNECTION_POLL_MS } from "@/shared/lib/cable/timing";
import { installTestCable } from "@/test/fake-cable";

describe("useConnectionState", () => {
  it("treats navigator offline as disconnected when no token is active", () => {
    const original = navigator.onLine;
    Object.defineProperty(navigator, "onLine", { configurable: true, value: false });
    const { result, unmount } = renderHook(() => useConnectionState());
    expect(result.current.isDisconnected).toBe(true);
    expect(result.current.labelKey).toBe("offline.waiting");
    window.dispatchEvent(new Event("online"));
    window.dispatchEvent(new Event("offline"));
    unmount();
    Object.defineProperty(navigator, "onLine", { configurable: true, value: original });
  });

  it("uses cable as the authority after the socket has been open (BR-110)", async () => {
    vi.useFakeTimers();
    useAccountsStore.setState({
      accounts: [
        {
          displayName: "Ada",
          hasPasskey: true,
          hasPassword: true,
          id: 1,
          onboarded: true,
          token: "jwt",
          username: "ada",
        },
      ],
      activeAccountId: 1,
    });
    const cable = installTestCable();
    const { result } = renderHook(() => useConnectionState());
    expect(result.current.isDisconnected).toBe(false);
    cable.open = true;
    await act(async () => {
      await vi.advanceTimersByTimeAsync(CONNECTION_POLL_MS);
    });
    expect(result.current.cableConnected).toBe(true);
    cable.open = false;
    await act(async () => {
      await vi.advanceTimersByTimeAsync(CONNECTION_POLL_MS);
    });
    expect(result.current.isDisconnected).toBe(true);
    expect(result.current.labelKey).toBe("offline.reconnecting");
    vi.useRealTimers();
  });
});
