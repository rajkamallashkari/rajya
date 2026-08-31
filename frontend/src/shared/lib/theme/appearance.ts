import { accentContrast, sufficientContrast, wallpaperReadable } from "./contrast";
import { ACCENT_CONTRAST_NEAR_BLACK, ACCENT_CONTRAST_WHITE, type SemanticToken } from "./constants";

export const WALLPAPER_PRESET_IDS = ["none", "dusk", "mist", "grove"] as const;
export type WallpaperPresetId = (typeof WALLPAPER_PRESET_IDS)[number];

export const CORNER_STYLES = ["rounded", "square"] as const;
export type BubbleCornerStyle = (typeof CORNER_STYLES)[number];

export const AUTOPLAY_POLICIES = ["always", "wifi_only", "never"] as const;
export type MediaAutoplay = (typeof AUTOPLAY_POLICIES)[number];

export const SKIN_TONE_MIN = 0;
export const SKIN_TONE_MAX = 5;
export const UNIT_MIN = 0;
export const UNIT_MAX = 1;
export const UNIT_PERCENT = 100;

export const WALLPAPER_IMAGES: Record<WallpaperPresetId, string> = {
  none: "none",
  dusk: "linear-gradient(180deg, var(--accent-subtle), var(--surface-chat))",
  mist: "linear-gradient(180deg, var(--surface-hover), var(--surface-chat))",
  grove: "linear-gradient(180deg, var(--status-success-subtle), var(--surface-chat))",
};

export interface WallpaperPreference {
  blur: number;
  dim: number;
  preset: WallpaperPresetId;
}

export interface AppearancePersonalisation {
  alwaysShowTimestamps: boolean;
  bubbleCornerStyle: BubbleCornerStyle;
  emojiSkinTone: number;
  mediaAutoplay: MediaAutoplay;
  reduceTransparency: boolean;
  wallpaper: WallpaperPreference;
}

export const DEFAULT_APPEARANCE: AppearancePersonalisation = {
  alwaysShowTimestamps: false,
  bubbleCornerStyle: "rounded",
  emojiSkinTone: SKIN_TONE_MIN,
  mediaAutoplay: "wifi_only",
  reduceTransparency: false,
  wallpaper: { blur: UNIT_MIN, dim: UNIT_MIN, preset: "none" },
};

export const PALETTE_CONTRAST_PAIRS: ReadonlyArray<readonly [SemanticToken, SemanticToken]> = [
  ["--text-primary", "--surface-app"],
  ["--text-primary", "--surface-panel"],
  ["--text-primary", "--surface-chat"],
  ["--text-secondary", "--surface-panel"],
  ["--text-primary", "--bubble-sent-bg"],
  ["--text-primary", "--bubble-received-bg"],
];

export function clampUnit(value: number): number {
  if (value < UNIT_MIN) {
    return UNIT_MIN;
  }
  if (value > UNIT_MAX) {
    return UNIT_MAX;
  }
  return value;
}

export function sliderUnit(values: number[], max = UNIT_PERCENT): number {
  return (values[0] ?? 0) / max;
}

export function firstValue(values: number[], fallback: number): number {
  return values[0] ?? fallback;
}

export function clampSkinTone(value: number): number {
  if (value < SKIN_TONE_MIN) {
    return SKIN_TONE_MIN;
  }
  if (value > SKIN_TONE_MAX) {
    return SKIN_TONE_MAX;
  }
  return Math.round(value);
}

function isPreset(value: unknown): value is WallpaperPresetId {
  return typeof value === "string" && (WALLPAPER_PRESET_IDS as readonly string[]).includes(value);
}

function isCorner(value: unknown): value is BubbleCornerStyle {
  return typeof value === "string" && (CORNER_STYLES as readonly string[]).includes(value);
}

function isAutoplay(value: unknown): value is MediaAutoplay {
  return typeof value === "string" && (AUTOPLAY_POLICIES as readonly string[]).includes(value);
}

function isFiniteNumber(value: unknown): value is number {
  return typeof value === "number" && Number.isFinite(value);
}

export function parseWallpaper(value: unknown): WallpaperPreference | null {
  if (value === null || value === undefined) {
    return null;
  }
  if (typeof value !== "object" || Array.isArray(value)) {
    return null;
  }
  const wallpaperRaw = value as Record<string, unknown>;
  return {
    blur: isFiniteNumber(wallpaperRaw.blur)
      ? clampUnit(wallpaperRaw.blur)
      : DEFAULT_APPEARANCE.wallpaper.blur,
    dim: isFiniteNumber(wallpaperRaw.dim)
      ? clampUnit(wallpaperRaw.dim)
      : DEFAULT_APPEARANCE.wallpaper.dim,
    preset: isPreset(wallpaperRaw.preset)
      ? wallpaperRaw.preset
      : DEFAULT_APPEARANCE.wallpaper.preset,
  };
}

export function wallpaperLayerStyle(
  wallpaper: WallpaperPreference,
  reduceTransparency = false,
): Record<string, string> {
  const properties = appearanceCustomProperties({
    ...DEFAULT_APPEARANCE,
    reduceTransparency,
    wallpaper,
  });
  return {
    "--wallpaper-blur": properties["--wallpaper-blur"] as string,
    "--wallpaper-dim": properties["--wallpaper-dim"] as string,
    "--wallpaper-image": properties["--wallpaper-image"] as string,
  };
}

export function parseAppearance(value: unknown): AppearancePersonalisation {
  if (value === null || typeof value !== "object" || Array.isArray(value)) {
    return {
      ...DEFAULT_APPEARANCE,
      wallpaper: { ...DEFAULT_APPEARANCE.wallpaper },
    };
  }
  const record = value as Record<string, unknown>;
  const wallpaperRaw =
    record.wallpaper !== null &&
    typeof record.wallpaper === "object" &&
    !Array.isArray(record.wallpaper)
      ? (record.wallpaper as Record<string, unknown>)
      : {};
  return {
    alwaysShowTimestamps: record.alwaysShowTimestamps === true,
    bubbleCornerStyle: isCorner(record.bubbleCornerStyle)
      ? record.bubbleCornerStyle
      : DEFAULT_APPEARANCE.bubbleCornerStyle,
    emojiSkinTone: isFiniteNumber(record.emojiSkinTone)
      ? clampSkinTone(record.emojiSkinTone)
      : DEFAULT_APPEARANCE.emojiSkinTone,
    mediaAutoplay: isAutoplay(record.mediaAutoplay)
      ? record.mediaAutoplay
      : DEFAULT_APPEARANCE.mediaAutoplay,
    reduceTransparency: record.reduceTransparency === true,
    wallpaper: {
      blur: isFiniteNumber(wallpaperRaw.blur)
        ? clampUnit(wallpaperRaw.blur)
        : DEFAULT_APPEARANCE.wallpaper.blur,
      dim: isFiniteNumber(wallpaperRaw.dim)
        ? clampUnit(wallpaperRaw.dim)
        : DEFAULT_APPEARANCE.wallpaper.dim,
      preset: isPreset(wallpaperRaw.preset)
        ? wallpaperRaw.preset
        : DEFAULT_APPEARANCE.wallpaper.preset,
    },
  };
}

export function resolveAppearance(
  input?: AppearancePersonalisation | null,
): AppearancePersonalisation {
  return parseAppearance(input ?? DEFAULT_APPEARANCE);
}

export function appearanceCustomProperties(
  appearance: AppearancePersonalisation,
): Record<string, string> {
  const dim = clampUnit(appearance.wallpaper.dim);
  const blur = appearance.reduceTransparency ? UNIT_MIN : clampUnit(appearance.wallpaper.blur);
  return {
    "--emoji-skin-tone": String(clampSkinTone(appearance.emojiSkinTone)),
    "--media-autoplay": appearance.mediaAutoplay,
    "--overlay-scrim-mix": appearance.reduceTransparency
      ? "var(--overlay-scrim-mix-reduced)"
      : "var(--overlay-scrim-mix-default)",
    "--radius-bubble":
      appearance.bubbleCornerStyle === "square" ? "var(--radius-sm)" : "var(--radius-bubble-round)",
    "--timestamp-visibility": appearance.alwaysShowTimestamps ? "always" : "last",
    "--wallpaper-blur": `calc(var(--space-6) * ${blur})`,
    "--wallpaper-dim": `${Math.round(dim * UNIT_PERCENT)}%`,
    "--wallpaper-image": WALLPAPER_IMAGES[appearance.wallpaper.preset],
  };
}

export function appearanceDataset(
  appearance: AppearancePersonalisation,
): Record<
  "autoplay" | "corners" | "skinTone" | "timestamps" | "transparency" | "wallpaper",
  string
> {
  return {
    autoplay: appearance.mediaAutoplay,
    corners: appearance.bubbleCornerStyle,
    skinTone: String(clampSkinTone(appearance.emojiSkinTone)),
    timestamps: appearance.alwaysShowTimestamps ? "always" : "last",
    transparency: appearance.reduceTransparency ? "reduced" : "default",
    wallpaper: appearance.wallpaper.preset,
  };
}

export function palettePassesContrast(
  palette: Record<SemanticToken, string>,
  dim: number,
): boolean {
  for (const [foreground, background] of PALETTE_CONTRAST_PAIRS) {
    if (!sufficientContrast(palette[foreground], palette[background])) {
      return false;
    }
  }
  if (!wallpaperReadable(palette["--text-primary"], palette["--surface-chat"], dim)) {
    return false;
  }
  const onAccent = accentContrast(
    palette["--accent"],
    ACCENT_CONTRAST_WHITE,
    ACCENT_CONTRAST_NEAR_BLACK,
  );
  return sufficientContrast(onAccent, palette["--accent"]);
}
