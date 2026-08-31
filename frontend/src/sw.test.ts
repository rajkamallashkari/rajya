import { describe, expect, it, vi } from "vitest";
import { queuedOutbox, queueOutbox } from "@/shared/lib/db/outbox";

describe("sw entry", () => {
  it("registers listeners on self and drains Background Sync to clients", async () => {
    const addEventListener = vi.fn();
    const posted: unknown[] = [];
    vi.stubGlobal("self", {
      addEventListener,
      skipWaiting: vi.fn(),
      clients: {
        claim: vi.fn(),
        matchAll: async () => [{ postMessage: (data: unknown) => posted.push(data) }],
        openWindow: async () => null,
      },
      caches: { open: vi.fn(), keys: vi.fn(), delete: vi.fn() },
      fetch: vi.fn(),
      registration: { showNotification: vi.fn() },
    });
    await queueOutbox(
      1,
      queuedOutbox({
        body: "sw",
        conversationId: 1,
        createdAt: "t",
        id: "11111111-1111-1111-1111-111111111111",
      }),
    );
    await import("./sw");
    expect(addEventListener).toHaveBeenCalledWith("install", expect.any(Function));
    expect(addEventListener).toHaveBeenCalledWith("activate", expect.any(Function));
    expect(addEventListener).toHaveBeenCalledWith("fetch", expect.any(Function));
    expect(addEventListener).toHaveBeenCalledWith("sync", expect.any(Function));
    expect(addEventListener).toHaveBeenCalledWith("push", expect.any(Function));
    expect(addEventListener).toHaveBeenCalledWith("notificationclick", expect.any(Function));

    const sync = addEventListener.mock.calls.find((call) => call[0] === "sync")?.[1] as
      | ((event: { lastChance?: boolean; tag: string; waitUntil: (promise: Promise<unknown>) => void }) => void)
      | undefined;
    const pending: Promise<unknown>[] = [];
    sync?.({
      lastChance: true,
      tag: "outbox-sync",
      waitUntil: (promise) => {
        pending.push(promise);
      },
    });
    await Promise.all(pending);
    await Promise.resolve();
    expect(posted).toEqual([
      expect.objectContaining({
        clientId: "11111111-1111-1111-1111-111111111111",
        type: "OUTBOX_SYNC_FAILED",
      }),
    ]);
    vi.unstubAllGlobals();
  });
});
