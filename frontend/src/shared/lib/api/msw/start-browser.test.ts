import { describe, expect, it, vi } from "vitest";

const start = vi.fn().mockResolvedValue(undefined);
const setupWorker = vi.fn((...rest: unknown[]) => {
  void rest;
  return { start };
});

vi.mock("msw/browser", () => ({
  setupWorker: (...handlers: unknown[]) => setupWorker(...handlers),
}));

describe("browser MSW starter", () => {
  it("starts the worker with generated handlers", async () => {
    const { defaultStartMsw } = await import("./start-browser");
    await defaultStartMsw();
    expect(setupWorker).toHaveBeenCalled();
    expect(start).toHaveBeenCalledWith({ onUnhandledRequest: "bypass" });
  });
});
