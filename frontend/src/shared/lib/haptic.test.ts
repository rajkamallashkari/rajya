import { describe, expect, it, vi } from "vitest";
import { haptic, HAPTIC_DURATION_MS } from "./haptic";

describe("haptic", () => {
  it("vibrates when the API exists and no-ops when it does not", () => {
    const vibrate = vi.fn();
    Object.defineProperty(navigator, "vibrate", { configurable: true, value: vibrate });
    haptic();
    expect(vibrate).toHaveBeenCalledWith(HAPTIC_DURATION_MS);
    haptic(20);
    expect(vibrate).toHaveBeenCalledWith(20);
    Object.defineProperty(navigator, "vibrate", { configurable: true, value: undefined });
    expect(() => haptic()).not.toThrow();
  });
});
