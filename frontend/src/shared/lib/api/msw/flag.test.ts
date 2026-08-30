import { describe, expect, it, vi } from "vitest";
import { shouldStartMsw, startBrowserMocksOrPwa } from "./flag";

describe("MSW flag", () => {
  it("starts mocks or the PWA worker from the env flag", async () => {
    expect(shouldStartMsw(undefined)).toBe(false);
    expect(shouldStartMsw("0")).toBe(false);
    expect(shouldStartMsw("1")).toBe(true);
    expect(shouldStartMsw("true")).toBe(true);
    const startMsw = vi.fn().mockResolvedValue(undefined);
    const startPwa = vi.fn().mockResolvedValue(undefined);
    await startBrowserMocksOrPwa("1", startMsw, startPwa);
    expect(startMsw).toHaveBeenCalled();
    expect(startPwa).not.toHaveBeenCalled();
    await startBrowserMocksOrPwa(undefined, startMsw, startPwa);
    expect(startPwa).toHaveBeenCalled();
  });
});
