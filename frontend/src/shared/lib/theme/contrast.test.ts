import { describe, expect, it } from "vitest";
import {
  accentContrast,
  contrastRatio,
  mixTowardBlack,
  relativeLuminance,
  sufficientContrast,
  wallpaperReadable,
} from "./contrast";
import { ACCENT_CONTRAST_NEAR_BLACK, ACCENT_CONTRAST_WHITE } from "./constants";

describe("contrast", () => {
  it("computes luminance and AA contrast", () => {
    expect(relativeLuminance("#FFFFFF")).toBeCloseTo(1, 2);
    expect(relativeLuminance("#000000")).toBeCloseTo(0, 2);
    expect(sufficientContrast("#000000", "#FFFFFF")).toBe(true);
    expect(sufficientContrast("#777777", "#888888")).toBe(false);
    expect(contrastRatio("#000000", "#FFFFFF")).toBeGreaterThan(4.5);
  });

  it("rejects malformed hex", () => {
    expect(relativeLuminance("blue")).toBeNull();
    expect(relativeLuminance("#fff")).toBeNull();
    expect(relativeLuminance("#GGGGGG")).toBeNull();
    expect(contrastRatio("nope", "#FFFFFF")).toBeNull();
    expect(contrastRatio("#FFFFFF", "nope")).toBeNull();
    expect(sufficientContrast("nope", "#FFFFFF")).toBe(false);
    expect(accentContrast("nope", ACCENT_CONTRAST_WHITE, ACCENT_CONTRAST_NEAR_BLACK)).toBe(
      ACCENT_CONTRAST_WHITE,
    );
  });

  it("picks white or near-black for accent contrast", () => {
    expect(accentContrast("#4F46E5", ACCENT_CONTRAST_WHITE, ACCENT_CONTRAST_NEAR_BLACK)).toBe(
      ACCENT_CONTRAST_WHITE,
    );
    expect(accentContrast("#FDE68A", ACCENT_CONTRAST_WHITE, ACCENT_CONTRAST_NEAR_BLACK)).toBe(
      ACCENT_CONTRAST_NEAR_BLACK,
    );
    expect(accentContrast("#4F46E5", "bad", ACCENT_CONTRAST_NEAR_BLACK)).toBe(
      ACCENT_CONTRAST_NEAR_BLACK,
    );
    expect(accentContrast("#4F46E5", ACCENT_CONTRAST_WHITE, "bad")).toBe(ACCENT_CONTRAST_WHITE);
  });

  it("mixes toward black and checks wallpaper contrast", () => {
    expect(mixTowardBlack("nope", 0.5)).toBeNull();
    expect(mixTowardBlack("#FFFFFF", -1)).toBe("#ffffff");
    expect(mixTowardBlack("#FFFFFF", 2)).toBe("#000000");
    expect(mixTowardBlack("#FFFFFF", 0)).toBe("#ffffff");
    expect(wallpaperReadable("#FFFFFF", "#000000", 0)).toBe(true);
    expect(wallpaperReadable("#111111", "#FFFFFF", 1)).toBe(false);
    expect(wallpaperReadable("#FFFFFF", "nope", 0)).toBe(false);
  });
});
