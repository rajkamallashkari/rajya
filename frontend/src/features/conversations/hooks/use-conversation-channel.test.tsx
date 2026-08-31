import { renderHook } from "@testing-library/react";
import { QueryClient, QueryClientProvider } from "@tanstack/react-query";
import { StrictMode, type ReactNode } from "react";
import { afterEach, describe, expect, it, vi } from "vitest";
import { setAccessSession } from "@/features/auth/model/access-session";
import { useAccountsStore } from "@/features/auth/store/accounts-store";
import { messageKeys } from "@/features/conversations/api/keys";
import type { MessagePages } from "@/features/conversations/api/cache";
import { useAccountChannel } from "@/features/conversations/hooks/use-account-channel";
import { useConversationChannel } from "@/features/conversations/hooks/use-conversation-channel";
import { RECONNECT_DELAY_MS, RECONNECT_POLL_MS, UNMOUNT_GRACE_MS } from "@/shared/lib/cable/timing";
import { resetCatchUpScheduler } from "@/shared/lib/realtime/catch-up";
import { testSession } from "@/test/access-session";
import { installTestCable } from "@/test/fake-cable";

function createWrapper() {
  const client = new QueryClient({ defaultOptions: { queries: { retry: false } } });
  return function Wrapper({ children }: { children: ReactNode }): ReactNode {
    return (
      <QueryClientProvider client={client}>
        <StrictMode>{children}</StrictMode>
      </QueryClientProvider>
    );
  };
}

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

describe("realtime channel hooks", () => {
  afterEach(() => {
    resetCatchUpScheduler();
    vi.useRealTimers();
  });

  it("subscribes to a conversation, routes events, and catches up on reconnect", async () => {
    vi.useFakeTimers();
    const cable = installTestCable();
    const { rerender, unmount } = renderHook(
      ({ id }: { id: number | null }) => useConversationChannel(id),
      { initialProps: { id: 1 as number | null }, wrapper: createWrapper() },
    );
    expect(cable.subscriptions[0]?.params).toEqual({
      channel: "ConversationChannel",
      conversation_id: 1,
    });
    cable.connectAll();
    await vi.advanceTimersByTimeAsync(RECONNECT_DELAY_MS);
    cable.emit({ type: "presence", account_id: 1, online: true });
    cable.disconnectAll();
    cable.connectAll();
    await vi.advanceTimersByTimeAsync(RECONNECT_DELAY_MS);
    rerender({ id: 2 });
    expect(cable.subscriptions.some((row) => row.params.conversation_id === 2)).toBe(true);
    rerender({ id: null });
    unmount();
    await vi.advanceTimersByTimeAsync(UNMOUNT_GRACE_MS);
    expect(cable.subscriptions.every((row) => row.unsubscribed || row.params.conversation_id !== 1)).toBe(
      true,
    );
  });

  it("does not subscribe when the conversation id is null", () => {
    const cable = installTestCable();
    const { result } = renderHook(() => useConversationChannel(null), { wrapper: createWrapper() });
    result.current.publishActivity("typing");
    result.current.cancelGeneration("g-1");
    expect(cable.subscriptions).toHaveLength(0);
  });

  it("unsubscribes after the unmount grace period", async () => {
    vi.useFakeTimers();
    const cable = installTestCable();
    const hook = renderHook(() => useConversationChannel(4), { wrapper: createWrapper() });
    expect(cable.subscriptions.filter((row) => !row.unsubscribed)).toHaveLength(1);
    hook.unmount();
    await vi.advanceTimersByTimeAsync(UNMOUNT_GRACE_MS);
    expect(cable.subscriptions.every((row) => row.unsubscribed)).toBe(true);
  });

  it("skips catch-up when the socket is already open", () => {
    const cable = installTestCable();
    cable.open = true;
    renderHook(() => useConversationChannel(1), { wrapper: createWrapper() });
    cable.connectAll();
    expect(cable.subscriptions[0]?.params.conversation_id).toBe(1);
  });

  it("polls for a silent reconnect and catches up when the tab is visible", async () => {
    vi.useFakeTimers();
    const cable = installTestCable();
    renderHook(() => useConversationChannel(1), { wrapper: createWrapper() });
    Object.defineProperty(document, "visibilityState", { configurable: true, value: "visible" });
    document.dispatchEvent(new Event("visibilitychange"));
    cable.open = true;
    await vi.advanceTimersByTimeAsync(RECONNECT_POLL_MS);
    document.dispatchEvent(new Event("visibilitychange"));
    Object.defineProperty(document, "visibilityState", { configurable: true, value: "hidden" });
    document.dispatchEvent(new Event("visibilitychange"));
    cable.open = false;
    await vi.advanceTimersByTimeAsync(RECONNECT_POLL_MS);
  });

  it("subscribes to account and presence streams when a token is active", async () => {
    vi.useFakeTimers();
    seedAccount();
    const cable = installTestCable();
    const { unmount } = renderHook(() => useAccountChannel(), { wrapper: createWrapper() });
    expect(cable.subscriptions.map((row) => row.params.channel)).toEqual([
      "AccountChannel",
      "PresenceChannel",
    ]);
    cable.connectAll();
    await vi.advanceTimersByTimeAsync(RECONNECT_DELAY_MS);
    cable.emit({ type: "sidebar_update", conversation_id: 1 });
    cable.disconnectAll();
    unmount();
  });

  it("disconnects cable when the active account is cleared", () => {
    seedAccount();
    const cable = installTestCable();
    const { rerender } = renderHook(() => useAccountChannel(), { wrapper: createWrapper() });
    expect(cable.subscriptions).toHaveLength(2);
    useAccountsStore.getState().removeAll();
    rerender();
    expect(cable.disconnects).toBeGreaterThan(0);
  });

  it("does not subscribe to account streams without a token", () => {
    useAccountsStore.setState({ accounts: [], activeAccountId: null });
    const cable = installTestCable();
    renderHook(() => useAccountChannel(), { wrapper: createWrapper() });
    expect(cable.subscriptions).toHaveLength(0);
  });

  it("skips account catch-up when the socket is already open", () => {
    seedAccount();
    const cable = installTestCable();
    cable.open = true;
    renderHook(() => useAccountChannel(), { wrapper: createWrapper() });
    cable.connectAll();
    expect(cable.subscriptions).toHaveLength(2);
  });

  it("performs typing even when no access session is bound", () => {
    const cable = installTestCable();
    const { result } = renderHook(() => useConversationChannel(1), { wrapper: createWrapper() });
    result.current.publishActivity("uploading_file");
    expect(cable.subscriptions[0]?.performs).toEqual([
      { action: "typing", data: { activity: "uploading_file" } },
    ]);
  });

  it("routes MSW realtime events through the account channel", async () => {
    const listeners: Array<(event: MessageEvent<unknown>) => void> = [];
    vi.stubEnv("VITE_MSW", "1");
    vi.stubGlobal(
      "BroadcastChannel",
      class {
        public onmessage: ((event: MessageEvent<unknown>) => void) | null = null;
        public postMessage(data: unknown): void {
          for (const listener of listeners) {
            listener({ data } as MessageEvent<unknown>);
          }
        }
        public close(): void {
          return undefined;
        }
        constructor() {
          listeners.push((event) => this.onmessage?.(event));
        }
      },
    );
    seedAccount();
    const wrapper = createWrapper();
    renderHook(() => useAccountChannel(), { wrapper });
    const { publishMswRealtime } = await import("@/shared/lib/realtime/msw-bridge");
    publishMswRealtime({ type: "presence", account_id: 4, online: true });
    vi.unstubAllEnvs();
    vi.unstubAllGlobals();
  });

  it("throttles typing performs and still sends the first activity", () => {
    vi.useFakeTimers();
    vi.setSystemTime(new Date("2026-01-01T12:00:00.000Z"));
    seedAccount();
    const cable = installTestCable();
    const { result } = renderHook(() => useConversationChannel(1), { wrapper: createWrapper() });
    result.current.publishActivity("typing");
    result.current.publishActivity("recording_audio");
    expect(cable.subscriptions[0]?.performs).toEqual([{ action: "typing", data: { activity: "typing" } }]);
    vi.setSystemTime(new Date("2026-01-01T12:00:04.000Z"));
    result.current.publishActivity("recording_audio");
    expect(cable.subscriptions[0]?.performs).toEqual([
      { action: "typing", data: { activity: "typing" } },
      { action: "typing", data: { activity: "recording_audio" } },
    ]);
    result.current.cancelGeneration("g-1");
    expect(cable.subscriptions[0]?.performs).toEqual([
      { action: "typing", data: { activity: "typing" } },
      { action: "typing", data: { activity: "recording_audio" } },
      { action: "cancel", data: { generation_id: "g-1" } },
    ]);
  });
});

describe("catch-up over HTTP", () => {
  it("uses the generated messages endpoint when no fetcher is injected", async () => {
    const { catchUpConversation } = await import("@/shared/lib/realtime/catch-up");
    const client = new QueryClient();
    const existing: MessagePages = {
      pageParams: [{}],
      pages: [
        {
          messages: [
            {
              id: 101,
              conversation_id: 1,
              position: 1,
              revision: 1,
              kind: "text",
              body: "Hi",
              deleted: false,
              silent: false,
              created_at: "2026-01-01T12:00:00.000Z",
            },
          ],
          meta: {
            has_more_before: false,
            has_more_after: false,
            oldest_position: 1,
            newest_position: 1,
            pivot_id: null,
          },
        },
      ],
    };
    client.setQueryData(messageKeys.page(1), existing);
    const { catchUpCachedConversations } = await import("@/shared/lib/realtime/catch-up");
    await catchUpConversation(client, 1);
    await catchUpCachedConversations(client);
  });
});
