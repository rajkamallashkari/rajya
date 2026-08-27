import { describe, expect, it, vi } from "vitest";
import { copyText } from "./copy-text";

describe("copyText", () => {
  it("writes when clipboard is available", async () => {
    const writeText = vi.fn().mockResolvedValue(undefined);
    Object.defineProperty(globalThis.navigator, "clipboard", {
      configurable: true,
      value: { writeText },
    });
    await expect(copyText("hi")).resolves.toBe(true);
    expect(writeText).toHaveBeenCalledWith("hi");
  });

  it("returns false when clipboard is missing or throws", async () => {
    Object.defineProperty(globalThis.navigator, "clipboard", {
      configurable: true,
      value: undefined,
    });
    await expect(copyText("hi")).resolves.toBe(false);
    Object.defineProperty(globalThis.navigator, "clipboard", {
      configurable: true,
      value: {
        writeText: vi.fn().mockRejectedValue(new Error("denied")),
      },
    });
    await expect(copyText("hi")).resolves.toBe(false);
  });
});
