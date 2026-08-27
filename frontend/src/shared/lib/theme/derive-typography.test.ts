import { describe, expect, it } from "vitest";
import { deriveTypography } from "./derive-typography";

describe("deriveTypography", () => {
  it("matches DESIGN_SYSTEM §3.5 at -5, 0 and +5", () => {
    expect(deriveTypography({ size: 0, weight: 0, lineHeight: 0, letterSpacing: 0 })).toEqual({
      sizeMultiplier: 1,
      fontWeight: 400,
      lineHeight: 1.5,
      letterSpacing: "0em",
    });
    expect(deriveTypography({ size: -5, weight: -5, lineHeight: -5, letterSpacing: -5 })).toEqual({
      sizeMultiplier: 0.7,
      fontWeight: 100,
      lineHeight: 1.1,
      letterSpacing: "-0.04em",
    });
    expect(deriveTypography({ size: 5, weight: 5, lineHeight: 5, letterSpacing: 5 })).toEqual({
      sizeMultiplier: 1.3,
      fontWeight: 700,
      lineHeight: 1.9,
      letterSpacing: "0.04em",
    });
  });

  it("clamps sliders and snaps weight to available faces", () => {
    const high = deriveTypography({ size: 9, weight: 9, lineHeight: 9, letterSpacing: 9 });
    const low = deriveTypography({ size: -9, weight: -9, lineHeight: -9, letterSpacing: -9 });
    expect(high).toEqual(deriveTypography({ size: 5, weight: 5, lineHeight: 5, letterSpacing: 5 }));
    expect(low).toEqual(
      deriveTypography({ size: -5, weight: -5, lineHeight: -5, letterSpacing: -5 }),
    );
    expect(
      deriveTypography({ size: 0, weight: 1, lineHeight: 0, letterSpacing: 0 }).fontWeight,
    ).toBe(500);
    expect(
      deriveTypography({ size: 0, weight: -1, lineHeight: 0, letterSpacing: 0 }).fontWeight,
    ).toBe(300);
  });
});
