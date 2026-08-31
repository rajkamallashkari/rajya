import { renderHook } from "@testing-library/react";
import { describe, expect, it, vi } from "vitest";
import { setAccessSession } from "@/features/auth/model/access-session";
import { useAccountsStore } from "@/features/auth/store/accounts-store";
import { useSignalingChannel } from "@/features/calls/hooks/use-signaling-channel";
import { useWebRTCManager } from "@/features/calls/hooks/use-webrtc-manager";
import { testSession } from "@/test/access-session";
import { installTestCable } from "@/test/fake-cable";

function seedAccount(): void {
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
  setAccessSession(testSession({ token: "jwt" }));
}

describe("call channel hooks", () => {
  it("subscribes to SignalingChannel and performs signals", async () => {
    seedAccount();
    const cable = installTestCable();
    const { unmount } = renderHook(() => useSignalingChannel());
    expect(cable.subscriptions[0]?.params).toEqual({ channel: "SignalingChannel" });
    cable.subscriptions[0]?.handlers.received?.({
      type: "incoming_call",
      call_id: 1,
      conversation_id: 2,
      kind: "audio",
      initiator_account_id: 3,
    });
    cable.subscriptions[0]!.perform = () => {
      throw new Error("closed");
    };
    const { toggleMic } = await import("@/features/calls/lib");
    const { useCallStore } = await import("@/features/calls/store/call-store");
    useCallStore.setState({ callId: 1, camOn: false, micOn: true });
    expect(() => toggleMic()).not.toThrow();
    unmount();
    expect(cable.subscriptions[0]?.unsubscribed).toBe(true);
  });

  it("does not subscribe without an active account", () => {
    useAccountsStore.setState({ accounts: [], activeAccountId: null });
    const cable = installTestCable();
    renderHook(() => useSignalingChannel());
    expect(cable.subscriptions).toHaveLength(0);
  });

  it("exposes engine actions from useWebRTCManager", () => {
    seedAccount();
    const { result } = renderHook(() => useWebRTCManager());
    expect(typeof result.current.startCall).toBe("function");
    expect(typeof result.current.startScreenShare).toBe("function");
    expect(typeof result.current.endCall).toBe("function");
    expect(typeof result.current.toggleMic).toBe("function");
    void import("@/features/calls");
  });

  it("relays signaling over the MSW realtime bridge", async () => {
    const posted: unknown[] = [];
    vi.stubEnv("VITE_MSW", "1");
    vi.stubGlobal(
      "BroadcastChannel",
      class {
        public postMessage(data: unknown): void {
          posted.push(data);
        }
        public close(): void {
          return undefined;
        }
      },
    );
    seedAccount();
    installTestCable();
    renderHook(() => useSignalingChannel());
    const { toggleMic } = await import("@/features/calls/lib");
    const { useCallStore } = await import("@/features/calls/store/call-store");
    useCallStore.setState({ callId: 4, camOn: true, micOn: true, status: "active" });
    toggleMic();
    expect(posted.some((row) => (row as { type?: string }).type === "mute_state")).toBe(true);
    setAccessSession(null);
    toggleMic();
    setAccessSession(testSession({ token: "jwt" }));
    vi.unstubAllEnvs();
    vi.unstubAllGlobals();
  });
});
