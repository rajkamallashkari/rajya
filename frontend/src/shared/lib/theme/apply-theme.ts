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
  theme: ThemePreference;
  accentHex: string;
  userSetsAccent: boolean;
  sliders: TypographySliders;
  density: Density;
  adminOverrides: SemanticOverrides;
}

const DARK_CLASS = "dark";
const ACCENT_PRIMARY_VAR = "--color-accent-primary";
const ACCENT_CONTRAST_VAR = "--accent-contrast";
const SIZE_VAR = "--app-size-multiplier";
const WEIGHT_VAR = "--app-font-weight";
const LINE_HEIGHT_VAR = "--app-line-height";
const LETTER_SPACING_VAR = "--app-letter-spacing";
const DENSITY_Y_VAR = "--space-list-y";
const DENSITY_X_VAR = "--space-list-x";
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
  setVar(style, DENSITY_Y_VAR, density.listY);
  setVar(style, DENSITY_X_VAR, density.listX);

  updateThemeColorMeta(doc, palette["--surface-app"]);

  if (storage) {
    const cache: ThemeCache = {
      theme: input.theme,
      accentHex: input.accentHex,
      userSetsAccent: input.userSetsAccent,
      sliders: input.sliders,
      density: input.density,
      adminOverrides: input.adminOverrides,
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
