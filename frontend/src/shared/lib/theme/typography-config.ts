export const TYPOGRAPHY = {
  sliderMin: -5,
  sliderMax: 5,
  size: { origin: 1, step: 0.06 },
  weight: { origin: 400, step: 60, min: 100, max: 700, snap: 100 },
  lineHeight: { origin: 1.5, step: 0.08 },
  letterSpacing: { step: 0.008, unit: "em" },
} as const;

export interface TypographySliders {
  size: number;
  weight: number;
  lineHeight: number;
  letterSpacing: number;
}

export interface DerivedTypography {
  sizeMultiplier: number;
  fontWeight: number;
  lineHeight: number;
  letterSpacing: string;
}

export const DEFAULT_SLIDERS: TypographySliders = {
  size: 0,
  weight: 0,
  lineHeight: 0,
  letterSpacing: 0,
};
