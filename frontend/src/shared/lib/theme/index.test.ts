import { describe, expect, it } from "vitest";
import {
  ACCENT_BOOT_HEX,
  DEFAULT_DENSITY,
  DEFAULT_THEME,
  FALLBACK_RESOLVED_THEME,
  DENSITY_VARS,
  SEMANTIC_DEFAULTS,
  SEMANTIC_TOKENS,
  THEME_CACHE_KEY,
  DEFAULT_APPEARANCE,
  WALLPAPER_PRESET_IDS,
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
    expect(DENSITY_VARS.compact["--control-pad-x"]).toBe("var(--space-3)");
    expect(DEFAULT_SLIDERS.size).toBe(0);
    expect(TYPOGRAPHY.sliderMin).toBe(-5);
    expect(DEFAULT_APPEARANCE.wallpaper.preset).toBe("none");
    expect(WALLPAPER_PRESET_IDS).toContain("dusk");
  });
});
