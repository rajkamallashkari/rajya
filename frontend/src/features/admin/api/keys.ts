export const adminKeys = {
  flags: () => ["admin-flags"] as const,
  me: () => ["me"] as const,
  settings: () => ["admin-settings"] as const,
  strings: (query: { q?: string; surface?: string }) => ["admin-strings", query] as const,
  stringsRoot: () => ["admin-strings"] as const,
  themeAdmin: () => ["admin-theme"] as const,
  themePalette: () => ["theme-overrides"] as const,
};
