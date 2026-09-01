import { apiClient, bearerHeaders, unwrap } from "@/features/auth/api/http";
import type { components } from "@/shared/lib/api/schema";

export type AdminSetting = components["schemas"]["AdminSetting"];
export type AdminFeatureFlag = components["schemas"]["AdminFeatureFlag"];
export type AdminTranslationString = components["schemas"]["AdminTranslationString"];
export type AdminThemeToken = components["schemas"]["AdminThemeToken"];
export type ThemeOverridePalette = components["schemas"]["ThemeOverridePalette"];

export async function listAdminSettings() {
  return unwrap(
    await apiClient().GET("/api/v1/admin/settings", { headers: bearerHeaders() }),
    "admin_settings_failed",
  );
}

export async function updateAdminSetting(key: string, value: unknown) {
  return unwrap(
    await apiClient().PATCH("/api/v1/admin/settings", {
      headers: bearerHeaders(),
      body: { key, value },
    }),
    "admin_settings_failed",
  );
}

export async function resetAdminSetting(key: string) {
  return unwrap(
    await apiClient().DELETE("/api/v1/admin/settings", {
      headers: bearerHeaders(),
      params: { query: { key } },
    }),
    "admin_settings_failed",
  );
}

export async function listAdminFeatureFlags() {
  return unwrap(
    await apiClient().GET("/api/v1/admin/feature_flags", { headers: bearerHeaders() }),
    "admin_flags_failed",
  );
}

export async function updateAdminFeatureFlag(
  key: string,
  enabled: boolean,
  rollout: Record<string, unknown>,
) {
  return unwrap(
    await apiClient().PATCH("/api/v1/admin/feature_flags", {
      headers: bearerHeaders(),
      body: { key, enabled, rollout },
    }),
    "admin_flags_failed",
  );
}

export async function listAdminTranslationStrings(query?: {
  locale?: string;
  q?: string;
  surface?: string;
}) {
  return unwrap(
    await apiClient().GET("/api/v1/admin/translation_strings", {
      headers: bearerHeaders(),
      params: { query: query ?? {} },
    }),
    "admin_strings_failed",
  );
}

export async function updateAdminTranslationString(key: string, value: string, locale = "en") {
  return unwrap(
    await apiClient().PATCH("/api/v1/admin/translation_strings", {
      headers: bearerHeaders(),
      body: { key, locale, value },
    }),
    "admin_strings_failed",
  );
}

export async function resetAdminTranslationString(key: string, locale = "en") {
  return unwrap(
    await apiClient().DELETE("/api/v1/admin/translation_strings", {
      headers: bearerHeaders(),
      params: { query: { key, locale } },
    }),
    "admin_strings_failed",
  );
}

export async function listAdminThemeOverrides() {
  return unwrap(
    await apiClient().GET("/api/v1/admin/theme_overrides", { headers: bearerHeaders() }),
    "admin_colours_failed",
  );
}

export async function updateAdminThemeOverride(theme: string, token_name: string, value: string) {
  return unwrap(
    await apiClient().PATCH("/api/v1/admin/theme_overrides", {
      headers: bearerHeaders(),
      body: { theme, token_name, value },
    }),
    "admin_colours_failed",
  );
}

export async function resetAdminThemeOverrides(theme?: string, token_name?: string) {
  return unwrap(
    await apiClient().DELETE("/api/v1/admin/theme_overrides", {
      headers: bearerHeaders(),
      params: { query: { theme, token_name } },
    }),
    "admin_colours_failed",
  );
}

export async function getThemeOverridePalette() {
  return unwrap(
    await apiClient().GET("/api/v1/theme_overrides", { headers: bearerHeaders() }),
    "theme_overrides_failed",
  );
}
