import { describe, expect, it, vi } from "vitest";
import { routeRealtimeEvent, type RealtimeEvent } from "./router";

describe("routeRealtimeEvent", () => {
  it("invalidates the connection query for both events", async () => {
    const invalidateQueries = vi.fn();
    await routeRealtimeEvent({ type: "connected" }, { invalidateQueries });
    await routeRealtimeEvent({ type: "disconnected" }, { invalidateQueries });
    expect(invalidateQueries).toHaveBeenCalledTimes(2);
  });

  it("rejects an unhandled member", async () => {
    await expect(
      routeRealtimeEvent({ type: "nope" } as unknown as RealtimeEvent, {
        invalidateQueries: vi.fn(),
      }),
    ).rejects.toThrow();
  });
});
