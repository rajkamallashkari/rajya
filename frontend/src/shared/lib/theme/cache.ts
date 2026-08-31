import { DEFAULT_APPEARANCE, parseAppearance, type AppearancePersonalisation } from "./appearance";
import { DEFAULT_FONT_FAMILY } from "./fonts";
import {
  ACCENT_BOOT_HEX,
  DEFAULT_DENSITY,
  DEFAULT_THEME,
  DENSITY_VALUES,
  FALLBACK_RESOLVED_THEME,
  SEMANTIC_TOKENS,
  THEME_CACHE_KEY,
  THEME_VALUES,
  type Density,
  type SemanticOverrides,
  type SemanticToken,
  type ThemePreference,
} from "./constants";
import { DEFAULT_SLIDERS, type TypographySliders } from "./typography-config";

export interface ThemeCache {
  accentHex: string;
  adminOverrides: SemanticOverrides;
  appearance: AppearancePersonalisation;
  density: Density;
  fontFamily: string;
  fontUrl: string | null;
  sliders: TypographySliders;
  theme: ThemePreference;
  userSetsAccent: boolean;
}

export const DEFAULT_THEME_CACHE: ThemeCache = {
  accentHex: ACCENT_BOOT_HEX,
  adminOverrides: {},
  appearance: {
    ...DEFAULT_APPEARANCE,
    wallpaper: { ...DEFAULT_APPEARANCE.wallpaper },
  },
  density: DEFAULT_DENSITY,
  fontFamily: DEFAULT_FONT_FAMILY,
  fontUrl: null,
  sliders: DEFAULT_SLIDERS,
  theme: DEFAULT_THEME,
  userSetsAccent: false,
};

function isThemePreference(value: unknown): value is ThemePreference {
  return typeof value === "string" && (THEME_VALUES as readonly string[]).includes(value);
}

function isDensity(value: unknown): value is Density {
  return typeof value === "string" && (DENSITY_VALUES as readonly string[]).includes(value);
}

function isSlider(value: unknown): value is number {
  return typeof value === "number" && Number.isFinite(value);
}

function parseAdminOverrides(value: unknown): SemanticOverrides {
  if (value === null || typeof value !== "object" || Array.isArray(value)) {
    return {};
  }
  const record = value as Record<string, unknown>;
  const overrides: SemanticOverrides = {};
  for (const token of SEMANTIC_TOKENS) {
    const candidate = record[token];
    if (typeof candidate === "string") {
      overrides[token] = candidate;
    }
  }
  return overrides;
}

export function parseThemeCache(raw: string | null): ThemeCache {
  if (raw === null) {
    return { ...DEFAULT_THEME_CACHE, sliders: { ...DEFAULT_SLIDERS } };
  }
  try {
    const parsed: unknown = JSON.parse(raw);
    if (parsed === null || typeof parsed !== "object" || Array.isArray(parsed)) {
      return { ...DEFAULT_THEME_CACHE, sliders: { ...DEFAULT_SLIDERS } };
    }
    const record = parsed as Record<string, unknown>;
    const slidersRaw =
      record.sliders !== null &&
      typeof record.sliders === "object" &&
      !Array.isArray(record.sliders)
        ? (record.sliders as Record<string, unknown>)
        : {};
    return {
      accentHex: typeof record.accentHex === "string" ? record.accentHex : ACCENT_BOOT_HEX,
      adminOverrides: parseAdminOverrides(record.adminOverrides),
      appearance: parseAppearance(record.appearance),
      density: isDensity(record.density) ? record.density : DEFAULT_DENSITY,
      fontFamily: typeof record.fontFamily === "string" ? record.fontFamily : DEFAULT_FONT_FAMILY,
      fontUrl:
        typeof record.fontUrl === "string" && record.fontUrl.length > 0 ? record.fontUrl : null,
      sliders: {
        letterSpacing: isSlider(slidersRaw.letterSpacing)
          ? slidersRaw.letterSpacing
          : DEFAULT_SLIDERS.letterSpacing,
        lineHeight: isSlider(slidersRaw.lineHeight)
          ? slidersRaw.lineHeight
          : DEFAULT_SLIDERS.lineHeight,
        size: isSlider(slidersRaw.size) ? slidersRaw.size : DEFAULT_SLIDERS.size,
        weight: isSlider(slidersRaw.weight) ? slidersRaw.weight : DEFAULT_SLIDERS.weight,
      },
      theme: isThemePreference(record.theme) ? record.theme : DEFAULT_THEME,
      userSetsAccent: record.userSetsAccent === true,
    };
  } catch {
    return { ...DEFAULT_THEME_CACHE, sliders: { ...DEFAULT_SLIDERS } };
  }
}

export function readThemeCache(storage: Pick<Storage, "getItem">): ThemeCache {
  return parseThemeCache(storage.getItem(THEME_CACHE_KEY));
}

export function writeThemeCache(storage: Pick<Storage, "setItem">, cache: ThemeCache): void {
  storage.setItem(THEME_CACHE_KEY, JSON.stringify(cache));
}

export function resolveTheme(
  preference: ThemePreference,
  matchMedia?: ((query: string) => MediaQueryList) | undefined,
): typeof FALLBACK_RESOLVED_THEME | "light" | "dark" {
  if (preference === "light" || preference === "dark") {
    return preference;
  }
  if (typeof matchMedia !== "function") {
    return FALLBACK_RESOLVED_THEME;
  }
  if (matchMedia("(prefers-color-scheme: dark)").matches) {
    return "dark";
  }
  if (matchMedia("(prefers-color-scheme: light)").matches) {
    return "light";
  }
  return FALLBACK_RESOLVED_THEME;
}

export function isOverridableToken(token: string): token is SemanticToken {
  return (SEMANTIC_TOKENS as readonly string[]).includes(token);
}
