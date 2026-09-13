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

export async function listDeviceSessions() {
  return unwrap(
    await apiClient().GET("/api/v1/sessions", { headers: bearerHeaders() }),
    "sessions_failed",
  );
}

export async function revokeDeviceSession(id: number) {
  return unwrap(
    await apiClient().DELETE("/api/v1/sessions/{id}", {
      headers: bearerHeaders(),
      params: { path: { id } },
    }),
    "session_revoke_failed",
  );
}

export async function revokeOtherDeviceSessions() {
  return unwrap(
    await apiClient().DELETE("/api/v1/sessions/others", { headers: bearerHeaders() }),
    "sessions_revoke_others_failed",
  );
}

export async function listContactNicknames() {
  return unwrap(
    await apiClient().GET("/api/v1/contact_nicknames", { headers: bearerHeaders() }),
    "nicknames_failed",
  );
}

export async function upsertContactNickname(accountId: number, nickname: string) {
  return unwrap(
    await apiClient().PUT("/api/v1/contact_nicknames/{account_id}", {
      headers: bearerHeaders(),
      params: { path: { account_id: accountId } },
      body: { nickname },
    }),
    "nickname_save_failed",
  );
}

export async function destroyContactNickname(accountId: number) {
  return unwrap(
    await apiClient().DELETE("/api/v1/contact_nicknames/{account_id}", {
      headers: bearerHeaders(),
      params: { path: { account_id: accountId } },
    }),
    "nickname_destroy_failed",
  );
}

export async function listExportJobs() {
  return unwrap(
    await apiClient().GET("/api/v1/export_jobs", { headers: bearerHeaders() }),
    "export_jobs_failed",
  );
}

export async function createExportJob(body: {
  conversation_id?: number | null;
  format?: "json" | "txt" | "html";
  include_media?: boolean;
}) {
  return unwrap(
    await apiClient().POST("/api/v1/export_jobs", {
      headers: bearerHeaders(),
      body,
    }),
    "export_create_failed",
  );
}

export async function downloadExportJob(id: number) {
  return unwrap(
    await apiClient().GET("/api/v1/export_jobs/{id}/download", {
      headers: bearerHeaders(),
      params: { path: { id } },
    }),
    "export_download_failed",
  );
}

export async function listScheduledMessages() {
  return unwrap(
    await apiClient().GET("/api/v1/scheduled_messages", { headers: bearerHeaders() }),
    "scheduled_messages_failed",
  );
}

export async function createScheduledMessage(body: {
  body: string;
  client_nonce: string;
  conversation_id: number;
  scheduled_at: string;
}) {
  return unwrap(
    await apiClient().POST("/api/v1/scheduled_messages", {
      headers: bearerHeaders(),
      body,
    }),
    "scheduled_create_failed",
  );
}

export async function updateScheduledMessage(
  id: number,
  body: { body?: string; scheduled_at?: string },
) {
  return unwrap(
    await apiClient().PATCH("/api/v1/scheduled_messages/{id}", {
      headers: bearerHeaders(),
      params: { path: { id } },
      body,
    }),
    "scheduled_update_failed",
  );
}

export async function cancelScheduledMessage(id: number) {
  return unwrap(
    await apiClient().DELETE("/api/v1/scheduled_messages/{id}", {
      headers: bearerHeaders(),
      params: { path: { id } },
    }),
    "scheduled_cancel_failed",
  );
}

export async function sendScheduledMessageNow(id: number) {
  return unwrap(
    await apiClient().POST("/api/v1/scheduled_messages/{id}/send_now", {
      headers: bearerHeaders(),
      params: { path: { id } },
    }),
    "scheduled_send_now_failed",
  );
}
