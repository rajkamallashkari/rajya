import { renderHook } from "@testing-library/react";
import { QueryClient, QueryClientProvider } from "@tanstack/react-query";
import { type ReactNode } from "react";
import { describe, expect, it } from "vitest";
import { useGeneration } from "./use-generation";
import { realtimeKeys } from "@/shared/lib/realtime/keys";

function wrapperFor(client: QueryClient) {
  return function Wrapper({ children }: { children: ReactNode }): ReactNode {
    return <QueryClientProvider client={client}>{children}</QueryClientProvider>;
  };
}

describe("useGeneration", () => {
  it("reads the cached stream or null", () => {
    const client = new QueryClient();
    const empty = renderHook(() => useGeneration(7), { wrapper: wrapperFor(client) });
    expect(empty.result.current).toBeNull();
    client.setQueryData(realtimeKeys.generation(1), {
      botAccountId: 9,
      generationId: "g-1",
      text: "Hi",
    });
    const { result } = renderHook(() => useGeneration(1), { wrapper: wrapperFor(client) });
    expect(result.current).toEqual({ botAccountId: 9, generationId: "g-1", text: "Hi" });
  });
});
