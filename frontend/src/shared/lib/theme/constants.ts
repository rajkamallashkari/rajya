export const THEME_CACHE_KEY = "rajya:theme-cache";

export const THEME_VALUES = ["light", "dark", "system"] as const;
export type ThemePreference = (typeof THEME_VALUES)[number];
export type ResolvedTheme = "light" | "dark";

export const DENSITY_VALUES = ["comfortable", "compact"] as const;
export type Density = (typeof DENSITY_VALUES)[number];

export const DEFAULT_THEME: ThemePreference = "system";
export const DEFAULT_DENSITY: Density = "comfortable";
export const FALLBACK_RESOLVED_THEME: ResolvedTheme = "dark";

export const ACCENT_BOOT_HEX = "#4F46E5";
export const ACCENT_CONTRAST_WHITE = "#FFFFFF";
export const ACCENT_CONTRAST_NEAR_BLACK = "#0E1621";

export const SEMANTIC_TOKENS = [
  "--surface-app",
  "--surface-chat",
  "--surface-panel",
  "--surface-raised",
  "--surface-input",
  "--surface-hover",
  "--surface-active",
  "--surface-selected",
  "--border-subtle",
  "--border-default",
  "--border-strong",
  "--text-primary",
  "--text-secondary",
  "--text-tertiary",
  "--text-inverse",
  "--bubble-sent-bg",
  "--bubble-received-bg",
  "--status-success",
  "--status-warning",
  "--status-danger",
  "--status-info",
  "--accent",
] as const;

export type SemanticToken = (typeof SEMANTIC_TOKENS)[number];
export type SemanticOverrides = Partial<Record<SemanticToken, string>>;

export const SEMANTIC_DEFAULTS: Record<ResolvedTheme, Record<SemanticToken, string>> = {
  light: {
    "--surface-app": "#EFF6FF",
    "--surface-chat": "#EFF6FF",
    "--surface-panel": "#FFFFFF",
    "--surface-raised": "#FFFFFF",
    "--surface-input": "#FFFFFF",
    "--surface-hover": "#F8FAFC",
    "--surface-active": "#EFF6FF",
    "--surface-selected": "#EFF6FF",
    "--border-subtle": "#E2E8F0",
    "--border-default": "#E2E8F0",
    "--border-strong": "#CBD5E1",
    "--text-primary": "#1E293B",
    "--text-secondary": "#64748B",
    "--text-tertiary": "#94A3B8",
    "--text-inverse": "#FFFFFF",
    "--bubble-sent-bg": "#DBEAFE",
    "--bubble-received-bg": "#F8FAFC",
    "--status-success": "#16A34A",
    "--status-warning": "#D97706",
    "--status-danger": "#DC2626",
    "--status-info": "#2563EB",
    "--accent": ACCENT_BOOT_HEX,
  },
  dark: {
    "--surface-app": "#0E1621",
    "--surface-chat": "#0E1621",
    "--surface-panel": "#232E3C",
    "--surface-raised": "#2C3A4B",
    "--surface-input": "#1A2534",
    "--surface-hover": "#2C3A4B",
    "--surface-active": "#344A5E",
    "--surface-selected": "#344A5E",
    "--border-subtle": "#2E3D4F",
    "--border-default": "#2E3D4F",
    "--border-strong": "#3A5068",
    "--text-primary": "#F1F5F9",
    "--text-secondary": "#94A3B8",
    "--text-tertiary": "#64748B",
    "--text-inverse": "#0E1621",
    "--bubble-sent-bg": "#2B5278",
    "--bubble-received-bg": "#182533",
    "--status-success": "#22C55E",
    "--status-warning": "#FBBF24",
    "--status-danger": "#F87171",
    "--status-info": "#60A5FA",
    "--accent": ACCENT_BOOT_HEX,
  },
};

export const DENSITY_VARS: Record<Density, { listY: string; listX: string }> = {
  comfortable: { listY: "var(--space-3)", listX: "var(--space-4)" },
  compact: { listY: "var(--space-2)", listX: "var(--space-3)" },
};
