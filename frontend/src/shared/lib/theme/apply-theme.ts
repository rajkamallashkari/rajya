import {
  appearanceCustomProperties,
  appearanceDataset,
  resolveAppearance,
  type AppearancePersonalisation,
} from "./appearance";
import { accentContrast } from "./contrast";
import {
  ACCENT_CONTRAST_NEAR_BLACK,
  ACCENT_CONTRAST_WHITE,
  DENSITY_VARS,
  SEMANTIC_DEFAULTS,
  SEMANTIC_TOKENS,
  type Density,
  type ResolvedTheme,
  type SemanticOverrides,
  type SemanticToken,
  type ThemePreference,
} from "./constants";
import {
  DEFAULT_THEME_CACHE,
  readThemeCache,
  resolveTheme,
  writeThemeCache,
  type ThemeCache,
} from "./cache";
import { deriveTypography } from "./derive-typography";
import { DEFAULT_SLIDERS, type TypographySliders } from "./typography-config";

export interface ApplyThemeInput {
  accentHex: string;
  adminOverrides: SemanticOverrides;
  appearance?: AppearancePersonalisation;
  density: Density;
  sliders: TypographySliders;
  theme: ThemePreference;
  userSetsAccent: boolean;
}

const DARK_CLASS = "dark";
const ACCENT_PRIMARY_VAR = "--color-accent-primary";
const ACCENT_CONTRAST_VAR = "--accent-contrast";
const SIZE_VAR = "--app-size-multiplier";
const WEIGHT_VAR = "--app-font-weight";
const LINE_HEIGHT_VAR = "--app-line-height";
const LETTER_SPACING_VAR = "--app-letter-spacing";
const THEME_COLOR_META = "theme-color";

export function mergeSemanticPalette(
  resolved: ResolvedTheme,
  adminOverrides: SemanticOverrides,
  accentHex: string,
  userSetsAccent: boolean,
): Record<SemanticToken, string> {
  const merged: Record<SemanticToken, string> = { ...SEMANTIC_DEFAULTS[resolved] };
  for (const token of SEMANTIC_TOKENS) {
    const override = adminOverrides[token];
    if (typeof override === "string") {
      merged[token] = override;
    }
  }
  if (userSetsAccent) {
    merged["--accent"] = accentHex;
  }
  return merged;
}

function setVar(root: CSSStyleDeclaration, name: string, value: string): void {
  root.setProperty(name, value);
}

function updateThemeColorMeta(doc: Document, color: string): void {
  const meta = doc.querySelector(`meta[name="${THEME_COLOR_META}"]`);
  if (meta) {
    meta.setAttribute("content", color);
  }
}

export function applyTheme(
  input: ApplyThemeInput,
  doc: Document = document,
  storage?: Pick<Storage, "getItem" | "setItem">,
  matchMedia?: ((query: string) => MediaQueryList) | undefined,
): ResolvedTheme {
  const resolved = resolveTheme(
    input.theme,
    matchMedia ?? doc.defaultView?.matchMedia?.bind(doc.defaultView),
  );
  const rootEl = doc.documentElement;
  const style = rootEl.style;
  const palette = mergeSemanticPalette(
    resolved,
    input.adminOverrides,
    input.accentHex,
    input.userSetsAccent,
  );
  const typography = deriveTypography(input.sliders);
  const density = DENSITY_VARS[input.density];
  const accentHex = palette["--accent"];
  const contrast = accentContrast(accentHex, ACCENT_CONTRAST_WHITE, ACCENT_CONTRAST_NEAR_BLACK);

  rootEl.classList.toggle(DARK_CLASS, resolved === "dark");

  for (const token of SEMANTIC_TOKENS) {
    setVar(style, token, palette[token]);
  }

  setVar(style, ACCENT_PRIMARY_VAR, accentHex);
  setVar(style, ACCENT_CONTRAST_VAR, contrast);
  setVar(style, SIZE_VAR, String(typography.sizeMultiplier));
  setVar(style, WEIGHT_VAR, String(typography.fontWeight));
  setVar(style, LINE_HEIGHT_VAR, String(typography.lineHeight));
  setVar(style, LETTER_SPACING_VAR, typography.letterSpacing);

  for (const [name, value] of Object.entries(density)) {
    setVar(style, name, value);
  }

  const appearance = resolveAppearance(input.appearance);
  for (const [name, value] of Object.entries(appearanceCustomProperties(appearance))) {
    setVar(style, name, value);
  }
  const data = appearanceDataset(appearance);
  rootEl.dataset.autoplay = data.autoplay;
  rootEl.dataset.corners = data.corners;
  rootEl.dataset.skinTone = data.skinTone;
  rootEl.dataset.timestamps = data.timestamps;
  rootEl.dataset.transparency = data.transparency;
  rootEl.dataset.wallpaper = data.wallpaper;

  updateThemeColorMeta(doc, palette["--surface-app"]);

  if (storage) {
    const cache: ThemeCache = {
      accentHex: input.accentHex,
      adminOverrides: input.adminOverrides,
      appearance,
      density: input.density,
      sliders: input.sliders,
      theme: input.theme,
      userSetsAccent: input.userSetsAccent,
    };
    writeThemeCache(storage, cache);
  }

  return resolved;
}

export function bootFromDocument(
  doc: Document = document,
  storage: Pick<Storage, "getItem" | "setItem"> = localStorage,
  matchMedia?: ((query: string) => MediaQueryList) | undefined,
): ResolvedTheme {
  const cached = readThemeCache(storage);
  return applyTheme(cached, doc, storage, matchMedia);
}

export function defaultThemeInput(): ApplyThemeInput {
  return {
    ...DEFAULT_THEME_CACHE,
    sliders: { ...DEFAULT_SLIDERS },
  };
}
