import { renderHook } from "@testing-library/react";
import { QueryClient, QueryClientProvider } from "@tanstack/react-query";
import { type ReactNode } from "react";
import { afterEach, describe, expect, it, vi } from "vitest";
import { setAccessSession } from "@/features/auth/model/access-session";
import { useTypingIndicators } from "./use-typing-indicators";
import { realtimeKeys } from "@/shared/lib/realtime/keys";
import { testSession } from "@/test/access-session";

function wrapperFor(client: QueryClient) {
  return function Wrapper({ children }: { children: ReactNode }): ReactNode {
    return <QueryClientProvider client={client}>{children}</QueryClientProvider>;
  };
}

describe("useTypingIndicators", () => {
  afterEach(() => {
    vi.useRealTimers();
  });

  it("hides the viewer and expires stale entries", async () => {
    vi.useFakeTimers();
    const client = new QueryClient();
    setAccessSession(testSession());
    const now = Date.now();
    client.setQueryData(realtimeKeys.typing(1), [
      { accountId: 1, activity: "typing", displayName: "Ada", expiresAt: now + 5000 },
      { accountId: 2, activity: "recording_audio", displayName: "Priya", expiresAt: now + 40 },
    ]);
    const { result, rerender } = renderHook(() => useTypingIndicators(1), {
      wrapper: wrapperFor(client),
    });
    expect(result.current.map((entry) => entry.accountId)).toEqual([2]);
    await vi.advanceTimersByTimeAsync(50);
    expect(result.current).toEqual([]);
    client.setQueryData(realtimeKeys.typing(1), []);
    rerender();
    expect(result.current).toEqual([]);
  });

  it("keeps other typists when no viewer session is bound", async () => {
    const client = new QueryClient();
    const empty = renderHook(() => useTypingIndicators(7), { wrapper: wrapperFor(client) });
    expect(empty.result.current).toEqual([]);
    client.setQueryData(realtimeKeys.typing(1), [
      { accountId: 2, activity: "typing", displayName: "Priya", expiresAt: Date.now() + 5000 },
    ]);
    const { result } = renderHook(() => useTypingIndicators(1), { wrapper: wrapperFor(client) });
    expect(result.current.map((entry) => entry.accountId)).toEqual([2]);
  });
});
