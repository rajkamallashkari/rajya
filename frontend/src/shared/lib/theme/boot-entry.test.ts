import { describe, expect, it } from "vitest";
import { THEME_CACHE_KEY } from "./constants";

describe("boot-entry", () => {
  it("applies the cached theme on import", async () => {
    window.localStorage.setItem(
      THEME_CACHE_KEY,
      JSON.stringify({
        theme: "dark",
        accentHex: "#4F46E5",
        userSetsAccent: false,
        sliders: { size: 0, weight: 0, lineHeight: 0, letterSpacing: 0 },
        density: "comfortable",
        adminOverrides: {},
      }),
    );
    await import("./boot-entry");
    expect(document.documentElement.classList.contains("dark")).toBe(true);
  });
});
