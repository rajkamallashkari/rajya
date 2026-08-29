import { describe, expect, it } from "vitest";
import {
  applyTheme,
  CORNER_STYLES,
  DEFAULT_APPEARANCE,
  DENSITY_VALUES,
  defaultThemeInput,
  deriveTypography,
  palettePassesContrast,
  SEMANTIC_DEFAULTS,
  TYPOGRAPHY,
  type Density,
  type ResolvedTheme,
} from "@/shared/lib/theme";

const THEMES: ResolvedTheme[] = ["light", "dark"];

describe("personalisation sweep", () => {
  it("keeps contrast and bounded layout across theme, density, corners and sliders", () => {
    const sliderStops = [TYPOGRAPHY.sliderMin, 0, TYPOGRAPHY.sliderMax] as const;
    for (const theme of THEMES) {
      for (const density of DENSITY_VALUES as readonly Density[]) {
        for (const corners of CORNER_STYLES) {
          for (const stop of sliderStops) {
            const appearance = {
              ...DEFAULT_APPEARANCE,
              bubbleCornerStyle: corners,
              wallpaper: { ...DEFAULT_APPEARANCE.wallpaper },
            };
            expect(palettePassesContrast(SEMANTIC_DEFAULTS[theme], appearance.wallpaper.dim)).toBe(
              true,
            );
            const typography = deriveTypography({
              letterSpacing: stop,
              lineHeight: stop,
              size: stop,
              weight: stop,
            });
            expect(typography.sizeMultiplier).toBeGreaterThan(0);
            applyTheme(
              {
                ...defaultThemeInput(),
                appearance,
                density,
                sliders: { letterSpacing: stop, lineHeight: stop, size: stop, weight: stop },
                theme,
              },
              document,
            );
            expect(document.documentElement.dataset.corners).toBe(corners);
            expect(document.documentElement.style.getPropertyValue("--radius-bubble")).toContain(
              corners === "square" ? "radius-sm" : "radius-bubble-round",
            );
            const frame = document.createElement("div");
            frame.setAttribute("data-combination", `${theme}-${density}-${corners}-${stop}`);
            frame.style.maxWidth = "100%";
            frame.style.overflow = "hidden";
            document.body.append(frame);
            expect(frame.scrollWidth).toBeLessThanOrEqual(frame.clientWidth || frame.scrollWidth);
            frame.remove();
          }
        }
      }
    }
  });
});
