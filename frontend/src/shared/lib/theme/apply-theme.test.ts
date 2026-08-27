import { beforeEach, describe, expect, it } from "vitest";
import {
  applyTheme,
  bootFromDocument,
  defaultThemeInput,
  mergeSemanticPalette,
} from "./apply-theme";
import { ACCENT_BOOT_HEX, ACCENT_CONTRAST_NEAR_BLACK, ACCENT_CONTRAST_WHITE } from "./constants";
import { THEME_CACHE_KEY } from "./constants";

function mockMatch(dark: boolean, light = !dark) {
  return (query: string): MediaQueryList =>
    ({
      matches: query.includes("dark") ? dark : query.includes("light") ? light : false,
    }) as MediaQueryList;
}

describe("applyTheme", () => {
  beforeEach(() => {
    document.documentElement.className = "";
    document.documentElement.removeAttribute("style");
    document.head.innerHTML = "";
    window.localStorage.clear();
  });

  it("writes dark class, palette, typography and density", () => {
    const meta = document.createElement("meta");
    meta.setAttribute("name", "theme-color");
    document.head.append(meta);

    const resolved = applyTheme(
      {
        theme: "dark",
        accentHex: "#FDE68A",
        userSetsAccent: true,
        sliders: { size: 5, weight: 0, lineHeight: 0, letterSpacing: 0 },
        density: "compact",
        adminOverrides: { "--surface-panel": "#111111" },
      },
      document,
      window.localStorage,
    );

    expect(resolved).toBe("dark");
    expect(document.documentElement.classList.contains("dark")).toBe(true);
    expect(document.documentElement.style.getPropertyValue("--surface-panel")).toBe("#111111");
    expect(document.documentElement.style.getPropertyValue("--color-accent-primary")).toBe(
      "#FDE68A",
    );
    expect(document.documentElement.style.getPropertyValue("--accent-contrast")).toBe(
      ACCENT_CONTRAST_NEAR_BLACK,
    );
    expect(document.documentElement.style.getPropertyValue("--app-size-multiplier")).toBe("1.3");
    expect(document.documentElement.style.getPropertyValue("--space-list-y")).toBe(
      "var(--space-2)",
    );
    expect(meta.getAttribute("content")).toBe("#0E1621");
    expect(window.localStorage.getItem(THEME_CACHE_KEY)).toContain("compact");
  });

  it("keeps admin accent unless the user set one", () => {
    applyTheme(
      {
        theme: "light",
        accentHex: "#22C55E",
        userSetsAccent: false,
        sliders: { size: 0, weight: 0, lineHeight: 0, letterSpacing: 0 },
        density: "comfortable",
        adminOverrides: { "--accent": "#DC2626" },
      },
      document,
    );
    expect(document.documentElement.classList.contains("dark")).toBe(false);
    expect(document.documentElement.style.getPropertyValue("--accent")).toBe("#DC2626");
    expect(document.documentElement.style.getPropertyValue("--color-accent-primary")).toBe(
      "#DC2626",
    );
    expect(document.documentElement.style.getPropertyValue("--accent-contrast")).toBe(
      ACCENT_CONTRAST_WHITE,
    );
    expect(document.documentElement.style.getPropertyValue("--space-list-x")).toBe(
      "var(--space-4)",
    );
  });

  it("boots from cache and uses system fallback", () => {
    window.localStorage.setItem(
      THEME_CACHE_KEY,
      JSON.stringify({
        theme: "system",
        accentHex: ACCENT_BOOT_HEX,
        userSetsAccent: false,
        sliders: { size: 0, weight: 0, lineHeight: 0, letterSpacing: 0 },
        density: "comfortable",
        adminOverrides: {},
      }),
    );
    expect(bootFromDocument(document, window.localStorage, mockMatch(true))).toBe("dark");
    expect(bootFromDocument(document, window.localStorage, mockMatch(false, true))).toBe("light");
  });

  it("merges admin overrides beneath user accent", () => {
    const merged = mergeSemanticPalette(
      "light",
      { "--accent": "#000000", "--text-primary": "#111111" },
      "#4F46E5",
      true,
    );
    expect(merged["--accent"]).toBe("#4F46E5");
    expect(merged["--text-primary"]).toBe("#111111");
  });

  it("returns the default input", () => {
    expect(defaultThemeInput().theme).toBe("system");
    const fakeDoc = {
      documentElement: document.documentElement,
      defaultView: null,
      querySelector: () => null,
    } as unknown as Document;
    expect(applyTheme(defaultThemeInput(), fakeDoc)).toBe("dark");
    expect(bootFromDocument()).toBeDefined();
  });
});
