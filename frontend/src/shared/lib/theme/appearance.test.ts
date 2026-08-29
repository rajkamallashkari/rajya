import { describe, expect, it } from "vitest";
import {
  appearanceCustomProperties,
  appearanceDataset,
  clampSkinTone,
  clampUnit,
  DEFAULT_APPEARANCE,
  parseAppearance,
  palettePassesContrast,
  resolveAppearance,
  sliderUnit,
  firstValue,
  WALLPAPER_IMAGES,
} from "./appearance";
import { SEMANTIC_DEFAULTS } from "./constants";

describe("appearance", () => {
  it("parses, clamps, and writes token overrides", () => {
    expect(clampUnit(-2)).toBe(0);
    expect(clampUnit(4)).toBe(1);
    expect(clampUnit(0.4)).toBe(0.4);
    expect(clampSkinTone(-3)).toBe(0);
    expect(clampSkinTone(9)).toBe(5);
    expect(clampSkinTone(2.6)).toBe(3);
    expect(sliderUnit([])).toBe(0);
    expect(sliderUnit([50])).toBe(0.5);
    expect(firstValue([], 3)).toBe(3);
    expect(firstValue([2], 0)).toBe(2);
    expect(parseAppearance(null).bubbleCornerStyle).toBe("rounded");
    expect(parseAppearance([]).mediaAutoplay).toBe("wifi_only");
    expect(
      parseAppearance({
        alwaysShowTimestamps: true,
        bubbleCornerStyle: "square",
        emojiSkinTone: 2,
        mediaAutoplay: "never",
        reduceTransparency: true,
        wallpaper: { blur: 0.5, dim: 0.2, preset: "dusk" },
      }).wallpaper.preset,
    ).toBe("dusk");
    expect(
      parseAppearance({
        bubbleCornerStyle: "octagon",
        emojiSkinTone: "x",
        mediaAutoplay: "sometimes",
        wallpaper: "nope",
      }).wallpaper.preset,
    ).toBe("none");
    expect(
      parseAppearance({
        wallpaper: { blur: "x", dim: "y", preset: "neon" },
      }).wallpaper,
    ).toEqual(DEFAULT_APPEARANCE.wallpaper);
    expect(resolveAppearance(null).emojiSkinTone).toBe(0);
    const square = resolveAppearance({
      ...DEFAULT_APPEARANCE,
      alwaysShowTimestamps: true,
      bubbleCornerStyle: "square",
      reduceTransparency: true,
      wallpaper: { blur: 1, dim: 0.3, preset: "grove" },
    });
    const vars = appearanceCustomProperties(square);
    expect(vars["--radius-bubble"]).toBe("var(--radius-sm)");
    expect(vars["--wallpaper-image"]).toBe(WALLPAPER_IMAGES.grove);
    expect(vars["--overlay-scrim-mix"]).toBe("var(--overlay-scrim-mix-reduced)");
    expect(vars["--wallpaper-blur"]).toBe("calc(var(--space-6) * 0)");
    expect(appearanceDataset(square).timestamps).toBe("always");
    expect(appearanceDataset(DEFAULT_APPEARANCE).transparency).toBe("default");
    expect(appearanceCustomProperties(DEFAULT_APPEARANCE)["--radius-bubble"]).toBe(
      "var(--radius-bubble-round)",
    );
    expect(palettePassesContrast(SEMANTIC_DEFAULTS.light, 0)).toBe(true);
    expect(palettePassesContrast(SEMANTIC_DEFAULTS.light, 1)).toBe(false);
    expect(
      palettePassesContrast({ ...SEMANTIC_DEFAULTS.light, "--text-primary": "#EFF6FF" }, 0),
    ).toBe(false);
  });
});
