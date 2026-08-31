import type { components } from "@/shared/lib/api/schema";
import type { PreferenceAppearance, PreferenceDocument } from "@/shared/lib/config/preferences-registry";
import preferencesRegistry from "@/shared/lib/config/preferences-registry.json";
import {
  ACCENT_BOOT_HEX,
  DEFAULT_FONT_FAMILY,
  type AppearancePersonalisation,
  type ApplyThemeInput,
  type ResolvedTheme,
  type TypographySliders,
} from "@/shared/lib/theme";

export type FontConfig = components["schemas"]["FontConfig"];
export type AccentConfig = components["schemas"]["AccentConfig"];

export function isPlainObject(value: unknown): value is Record<string, unknown> {
  return value !== null && typeof value === "object" && !Array.isArray(value);
}

export function asPreferenceDocument(value: unknown): PreferenceDocument | undefined {
  return isPlainObject(value) ? (value as unknown as PreferenceDocument) : undefined;
}

export function deepMerge(
  base: Record<string, unknown>,
  overlay: Record<string, unknown>,
): Record<string, unknown> {
  const next: Record<string, unknown> = { ...base };
  for (const [key, value] of Object.entries(overlay)) {
    const current = next[key];
    next[key] =
      isPlainObject(current) && isPlainObject(value) ? deepMerge(current, value) : value;
  }
  return next;
}

export function preferenceAppearance(document: PreferenceDocument | undefined): PreferenceAppearance {
  const defaults = preferencesRegistry.defaults.appearance as PreferenceAppearance;
  const raw = document?.appearance;
  if (!isPlainObject(raw)) {
    return {
      ...defaults,
      wallpaper: { ...defaults.wallpaper },
    };
  }
  const wallpaper = isPlainObject(raw.wallpaper)
    ? { ...defaults.wallpaper, ...raw.wallpaper }
    : { ...defaults.wallpaper };
  return { ...defaults, ...raw, wallpaper } as PreferenceAppearance;
}

export function slidersFromAppearance(appearance: PreferenceAppearance): TypographySliders {
  return {
    letterSpacing: appearance.text_letter_spacing,
    lineHeight: appearance.text_line_height,
    size: appearance.text_size,
    weight: appearance.text_weight,
  };
}

export function appearanceTokensFromDocument(
  appearance: PreferenceAppearance,
): AppearancePersonalisation {
  return {
    alwaysShowTimestamps: appearance.always_show_timestamps,
    bubbleCornerStyle: appearance.bubble_corner_style,
    emojiSkinTone: appearance.emoji_skin_tone,
    mediaAutoplay: appearance.media_autoplay,
    reduceTransparency: appearance.reduce_transparency,
    wallpaper: {
      blur: appearance.wallpaper.blur,
      dim: appearance.wallpaper.dim,
      preset: appearance.wallpaper.preset,
    },
  };
}

export function mapPreferencesToTheme(
  document: PreferenceDocument | undefined,
  fonts: FontConfig[],
  accents: AccentConfig[],
  resolved: ResolvedTheme,
): ApplyThemeInput {
  const appearance = preferenceAppearance(document);
  const accentId = appearance.split_accents
    ? resolved === "light"
      ? appearance.accent_light
      : appearance.accent_dark
    : appearance.accent_light;
  const accent = accents.find((row) => row.id === accentId);
  const font = fonts.find((row) => row.id === appearance.font_config_id);
  return {
    accentHex: accent?.hex ?? ACCENT_BOOT_HEX,
    adminOverrides: {},
    appearance: appearanceTokensFromDocument(appearance),
    density: appearance.density,
    fontFamily: font?.font_family_value ?? DEFAULT_FONT_FAMILY,
    fontUrl: font?.google_font_url ?? null,
    sliders: slidersFromAppearance(appearance),
    theme: appearance.theme,
    userSetsAccent: Boolean(accent),
  };
}
