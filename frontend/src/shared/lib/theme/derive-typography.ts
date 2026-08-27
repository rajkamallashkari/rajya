import { TYPOGRAPHY, type DerivedTypography, type TypographySliders } from "./typography-config";

function clampSlider(value: number): number {
  if (value < TYPOGRAPHY.sliderMin) {
    return TYPOGRAPHY.sliderMin;
  }
  if (value > TYPOGRAPHY.sliderMax) {
    return TYPOGRAPHY.sliderMax;
  }
  return value;
}

function snapWeight(raw: number): number {
  return Math.round(raw / TYPOGRAPHY.weight.snap) * TYPOGRAPHY.weight.snap;
}

export function deriveTypography(sliders: TypographySliders): DerivedTypography {
  const size = clampSlider(sliders.size);
  const weight = clampSlider(sliders.weight);
  const lineHeight = clampSlider(sliders.lineHeight);
  const letterSpacing = clampSlider(sliders.letterSpacing);

  return {
    sizeMultiplier: TYPOGRAPHY.size.origin + size * TYPOGRAPHY.size.step,
    fontWeight: snapWeight(TYPOGRAPHY.weight.origin + weight * TYPOGRAPHY.weight.step),
    lineHeight: TYPOGRAPHY.lineHeight.origin + lineHeight * TYPOGRAPHY.lineHeight.step,
    letterSpacing: `${letterSpacing * TYPOGRAPHY.letterSpacing.step}${TYPOGRAPHY.letterSpacing.unit}`,
  };
}
