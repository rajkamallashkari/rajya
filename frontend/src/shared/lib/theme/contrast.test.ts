import { describe, expect, it } from "vitest";
import { accentContrast, contrastRatio, relativeLuminance, sufficientContrast } from "./contrast";
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
});
