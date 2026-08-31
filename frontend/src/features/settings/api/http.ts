import { apiClient, bearerHeaders, unwrap } from "@/features/auth/api/http";
import type { components } from "@/shared/lib/api/schema";

export type Preferences = components["schemas"]["Preferences"];
export type FontConfig = components["schemas"]["FontConfig"];
export type FontConfigList = components["schemas"]["FontConfigList"];
export type AccentConfig = components["schemas"]["AccentConfig"];
export type AccentConfigList = components["schemas"]["AccentConfigList"];

export async function getPreferences() {
  return unwrap(
    await apiClient().GET("/api/v1/preferences", { headers: bearerHeaders() }),
    "preferences_failed",
  );
}

export async function updatePreferences(data: Record<string, unknown>) {
  return unwrap(
    await apiClient().PATCH("/api/v1/preferences", {
      headers: bearerHeaders(),
      body: { data },
    }),
    "preferences_failed",
  );
}

export async function listFontConfigs() {
  return unwrap(
    await apiClient().GET("/api/v1/font_configs", { headers: bearerHeaders() }),
    "font_configs_failed",
  );
}

export async function listAccentConfigs() {
  return unwrap(
    await apiClient().GET("/api/v1/accent_configs", { headers: bearerHeaders() }),
    "accent_configs_failed",
  );
}
