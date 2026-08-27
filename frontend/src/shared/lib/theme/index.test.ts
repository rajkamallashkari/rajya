import { describe, expect, it } from "vitest";
import {
  ACCENT_BOOT_HEX,
  DEFAULT_DENSITY,
  DEFAULT_THEME,
  FALLBACK_RESOLVED_THEME,
  SEMANTIC_DEFAULTS,
  SEMANTIC_TOKENS,
  THEME_CACHE_KEY,
} from "./index";
import { DEFAULT_SLIDERS, TYPOGRAPHY } from "./index";

describe("theme barrel", () => {
  it("re-exports the locked defaults", () => {
    expect(DEFAULT_THEME).toBe("system");
    expect(DEFAULT_DENSITY).toBe("comfortable");
    expect(FALLBACK_RESOLVED_THEME).toBe("dark");
    expect(ACCENT_BOOT_HEX).toMatch(/^#/);
    expect(THEME_CACHE_KEY).toContain("rajya");
    expect(SEMANTIC_TOKENS.length).toBeGreaterThan(0);
    expect(SEMANTIC_DEFAULTS.light["--accent"]).toBe(ACCENT_BOOT_HEX);
    expect(DEFAULT_SLIDERS.size).toBe(0);
    expect(TYPOGRAPHY.sliderMin).toBe(-5);
  });
});
