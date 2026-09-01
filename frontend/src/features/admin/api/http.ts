import { apiClient, bearerHeaders, unwrap } from "@/features/auth/api/http";
import type { components } from "@/shared/lib/api/schema";

export type AdminSetting = components["schemas"]["AdminSetting"];
export type AdminFeatureFlag = components["schemas"]["AdminFeatureFlag"];
export type AdminTranslationString = components["schemas"]["AdminTranslationString"];
export type AdminThemeToken = components["schemas"]["AdminThemeToken"];
export type ThemeOverridePalette = components["schemas"]["ThemeOverridePalette"];
export type AdminUser = components["schemas"]["AdminUser"];
export type AdminUserDetail = components["schemas"]["AdminUserDetail"];
export type AdminAuditEvent = components["schemas"]["AdminAuditEvent"];
export type AdminDashboard = components["schemas"]["AdminDashboard"];
export type AdminPromptTemplate = components["schemas"]["AdminPromptTemplate"];
export type BotRequest = components["schemas"]["BotRequest"];
export type AdminReport = components["schemas"]["AdminReport"];
export type StickerPack = components["schemas"]["StickerPack"];
export type Sticker = components["schemas"]["Sticker"];

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

export async function listAdminUsers(q?: string) {
  return unwrap(
    await apiClient().GET("/api/v1/admin/users", {
      headers: bearerHeaders(),
      params: { query: q ? { q } : {} },
    }),
    "admin_users_failed",
  );
}

export async function getAdminUser(id: number) {
  return unwrap(
    await apiClient().GET("/api/v1/admin/users/{id}", {
      headers: bearerHeaders(),
      params: { path: { id } },
    }),
    "admin_user_failed",
  );
}

export async function listAdminTranscript(
  conversationId: number,
  query?: { before?: number; after?: number },
) {
  return unwrap(
    await apiClient().GET("/api/v1/admin/conversations/{conversation_id}/messages", {
      headers: bearerHeaders(),
      params: { path: { conversation_id: conversationId }, query: query ?? {} },
    }),
    "admin_transcript_failed",
  );
}

export async function startAdminImpersonation(account_id: number) {
  return unwrap(
    await apiClient().POST("/api/v1/admin/impersonation", {
      headers: bearerHeaders(),
      body: { account_id },
    }),
    "admin_impersonation_failed",
  );
}

export async function stopAdminImpersonation() {
  return unwrap(
    await apiClient().DELETE("/api/v1/admin/impersonation", { headers: bearerHeaders() }),
    "admin_impersonation_failed",
  );
}

export async function listAdminAuditEvents(action_name?: string) {
  return unwrap(
    await apiClient().GET("/api/v1/admin/audit_events", {
      headers: bearerHeaders(),
      params: { query: action_name ? { action_name } : {} },
    }),
    "admin_audit_failed",
  );
}

export async function getAdminDashboard() {
  return unwrap(
    await apiClient().GET("/api/v1/admin/dashboard", { headers: bearerHeaders() }),
    "admin_dashboard_failed",
  );
}

export async function listAdminPromptTemplates() {
  return unwrap(
    await apiClient().GET("/api/v1/admin/prompt_templates", { headers: bearerHeaders() }),
    "admin_prompts_failed",
  );
}

export async function updateAdminPromptTemplate(capability: string, template: string) {
  return unwrap(
    await apiClient().PATCH("/api/v1/admin/prompt_templates", {
      headers: bearerHeaders(),
      body: { capability, template },
    }),
    "admin_prompts_failed",
  );
}

export async function listAdminBotRequests() {
  return unwrap(
    await apiClient().GET("/api/v1/admin/bot_requests", { headers: bearerHeaders() }),
    "admin_bots_failed",
  );
}

export async function approveAdminBotRequest(id: number) {
  return unwrap(
    await apiClient().POST("/api/v1/admin/bot_requests/{id}/approve", {
      headers: bearerHeaders(),
      params: { path: { id } },
    }),
    "admin_bots_failed",
  );
}

export async function declineAdminBotRequest(id: number, reason?: string) {
  return unwrap(
    await apiClient().POST("/api/v1/admin/bot_requests/{id}/decline", {
      headers: bearerHeaders(),
      params: { path: { id } },
      body: reason ? { reason } : {},
    }),
    "admin_bots_failed",
  );
}

export async function listAdminReports(query?: {
  max_age_hours?: number;
  status?: string;
  subject_type?: string;
}) {
  return unwrap(
    await apiClient().GET("/api/v1/admin/reports", {
      headers: bearerHeaders(),
      params: { query: query ?? {} },
    }),
    "admin_reports_failed",
  );
}

export async function getAdminReport(id: number) {
  return unwrap(
    await apiClient().GET("/api/v1/admin/reports/{id}", {
      headers: bearerHeaders(),
      params: { path: { id } },
    }),
    "admin_reports_failed",
  );
}

export async function dismissAdminReport(id: number, note?: string) {
  return unwrap(
    await apiClient().POST("/api/v1/admin/reports/{id}/dismiss", {
      headers: bearerHeaders(),
      params: { path: { id } },
      body: note ? { note } : {},
    }),
    "admin_reports_failed",
  );
}

export async function warnAdminReport(id: number, note?: string) {
  return unwrap(
    await apiClient().POST("/api/v1/admin/reports/{id}/warn", {
      headers: bearerHeaders(),
      params: { path: { id } },
      body: note ? { note } : {},
    }),
    "admin_reports_failed",
  );
}

export async function removeAdminReportContent(id: number) {
  return unwrap(
    await apiClient().POST("/api/v1/admin/reports/{id}/remove_content", {
      headers: bearerHeaders(),
      params: { path: { id } },
    }),
    "admin_reports_failed",
  );
}

export async function deactivateAdminReportAccount(id: number) {
  return unwrap(
    await apiClient().POST("/api/v1/admin/reports/{id}/deactivate_account", {
      headers: bearerHeaders(),
      params: { path: { id } },
    }),
    "admin_reports_failed",
  );
}

export async function listAdminStickerPacks() {
  return unwrap(
    await apiClient().GET("/api/v1/admin/sticker_packs", { headers: bearerHeaders() }),
    "admin_packs_failed",
  );
}

export async function createAdminStickerPack(name: string, kind: "sticker" | "emoji") {
  return unwrap(
    await apiClient().POST("/api/v1/admin/sticker_packs", {
      headers: bearerHeaders(),
      body: { name, kind },
    }),
    "admin_packs_failed",
  );
}

export async function updateAdminStickerPack(
  id: number,
  body: { name?: string; position?: number; published?: boolean },
) {
  return unwrap(
    await apiClient().PATCH("/api/v1/admin/sticker_packs/{id}", {
      headers: bearerHeaders(),
      params: { path: { id } },
      body,
    }),
    "admin_packs_failed",
  );
}

export async function destroyAdminStickerPack(id: number) {
  return unwrap(
    await apiClient().DELETE("/api/v1/admin/sticker_packs/{id}", {
      headers: bearerHeaders(),
      params: { path: { id } },
    }),
    "admin_packs_failed",
  );
}

export async function reorderAdminStickerPacks(ids: number[]) {
  return unwrap(
    await apiClient().PATCH("/api/v1/admin/sticker_packs/reorder", {
      headers: bearerHeaders(),
      body: { ids },
    }),
    "admin_packs_failed",
  );
}

export async function addAdminSticker(packId: number, signedId: string, shortcode: string) {
  return unwrap(
    await apiClient().POST("/api/v1/admin/sticker_packs/{sticker_pack_id}/stickers", {
      headers: bearerHeaders(),
      params: { path: { sticker_pack_id: packId } },
      body: { signed_id: signedId, shortcode },
    }),
    "admin_packs_failed",
  );
}

export async function removeAdminSticker(packId: number, id: number) {
  return unwrap(
    await apiClient().DELETE("/api/v1/admin/sticker_packs/{sticker_pack_id}/stickers/{id}", {
      headers: bearerHeaders(),
      params: { path: { sticker_pack_id: packId, id } },
    }),
    "admin_packs_failed",
  );
}
