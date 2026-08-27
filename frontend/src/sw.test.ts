import { describe, expect, it, vi } from "vitest";

describe("sw entry", () => {
  it("registers listeners on self", async () => {
    const addEventListener = vi.fn();
    vi.stubGlobal("self", {
      addEventListener,
      skipWaiting: vi.fn(),
      clients: { claim: vi.fn() },
      caches: { open: vi.fn(), keys: vi.fn(), delete: vi.fn() },
      fetch: vi.fn(),
    });
    await import("./sw");
    expect(addEventListener).toHaveBeenCalledWith("install", expect.any(Function));
    expect(addEventListener).toHaveBeenCalledWith("activate", expect.any(Function));
    expect(addEventListener).toHaveBeenCalledWith("fetch", expect.any(Function));
    vi.unstubAllGlobals();
  });
});
