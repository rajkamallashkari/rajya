import { describe, expect, it } from "vitest";
import {
  DEFAULT_THEME_CACHE,
  isOverridableToken,
  parseThemeCache,
  readThemeCache,
  resolveTheme,
  writeThemeCache,
} from "./cache";
import { ACCENT_BOOT_HEX, DEFAULT_DENSITY, DEFAULT_THEME, THEME_CACHE_KEY } from "./constants";

describe("theme cache", () => {
  it("returns defaults for missing, invalid, and non-object JSON", () => {
    expect(parseThemeCache(null).theme).toBe(DEFAULT_THEME);
    expect(parseThemeCache("not-json").theme).toBe(DEFAULT_THEME);
    expect(parseThemeCache("[]").theme).toBe(DEFAULT_THEME);
    expect(parseThemeCache("null").theme).toBe(DEFAULT_THEME);
    expect(parseThemeCache("1").theme).toBe(DEFAULT_THEME);
  });

  it("parses a valid cache and ignores unknown tokens", () => {
    const parsed = parseThemeCache(
      JSON.stringify({
        theme: "dark",
        accentHex: "#123456",
        userSetsAccent: true,
        sliders: { size: 2, weight: 1, lineHeight: -1, letterSpacing: 3 },
        density: "compact",
        adminOverrides: { "--surface-app": "#000000", "--not-a-token": "#fff" },
        appearance: {
          alwaysShowTimestamps: true,
          bubbleCornerStyle: "square",
          emojiSkinTone: 1,
          mediaAutoplay: "always",
          reduceTransparency: true,
          wallpaper: { blur: 0.2, dim: 0.1, preset: "dusk" },
        },
      }),
    );
    expect(parsed.theme).toBe("dark");
    expect(parsed.accentHex).toBe("#123456");
    expect(parsed.userSetsAccent).toBe(true);
    expect(parsed.sliders).toEqual({ size: 2, weight: 1, lineHeight: -1, letterSpacing: 3 });
    expect(parsed.density).toBe("compact");
    expect(parsed.adminOverrides).toEqual({ "--surface-app": "#000000" });
    expect(parsed.appearance.bubbleCornerStyle).toBe("square");
  });

  it("falls back field-by-field for bad shapes", () => {
    const parsed = parseThemeCache(
      JSON.stringify({
        theme: "neon",
        accentHex: 12,
        userSetsAccent: "yes",
        sliders: "nope",
        density: "huge",
        adminOverrides: ["x"],
      }),
    );
    expect(parsed.theme).toBe(DEFAULT_THEME);
    expect(parsed.accentHex).toBe(ACCENT_BOOT_HEX);
    expect(parsed.userSetsAccent).toBe(false);
    expect(parsed.density).toBe(DEFAULT_DENSITY);
    expect(parsed.adminOverrides).toEqual({});
    expect(parsed.sliders).toEqual(DEFAULT_THEME_CACHE.sliders);
    const partial = parseThemeCache(
      JSON.stringify({
        sliders: { size: "x", weight: 2 },
        adminOverrides: { "--surface-app": 1, "--text-primary": "#111111" },
      }),
    );
    expect(partial.sliders.size).toBe(0);
    expect(partial.sliders.weight).toBe(2);
    const sliders = parseThemeCache(
      JSON.stringify({ sliders: { lineHeight: "x", letterSpacing: "y" } }),
    ).sliders;
    expect(sliders.lineHeight).toBe(0);
    expect(sliders.letterSpacing).toBe(0);
    expect(partial.adminOverrides).toEqual({ "--text-primary": "#111111" });
    expect(isOverridableToken("--surface-app")).toBe(true);
    expect(isOverridableToken("--tg-700")).toBe(false);
  });

  it("reads and writes storage", () => {
    const store: Record<string, string> = {};
    const storage = {
      getItem: (key: string) => store[key] ?? null,
      setItem: (key: string, value: string) => {
        store[key] = value;
      },
    };
    writeThemeCache(storage, { ...DEFAULT_THEME_CACHE, theme: "light" });
    expect(store[THEME_CACHE_KEY]).toContain("light");
    expect(readThemeCache(storage).theme).toBe("light");
  });

  it("resolves system to dark when unknown", () => {
    expect(resolveTheme("light")).toBe("light");
    expect(resolveTheme("dark")).toBe("dark");
    expect(resolveTheme("system")).toBe("dark");
    expect(resolveTheme("system", () => ({ matches: true }) as MediaQueryList)).toBe("dark");
    expect(
      resolveTheme("system", (query) => ({ matches: query.includes("light") }) as MediaQueryList),
    ).toBe("light");
    expect(resolveTheme("system", () => ({ matches: false }) as MediaQueryList)).toBe("dark");
  });
});
