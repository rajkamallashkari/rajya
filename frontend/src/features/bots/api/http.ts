import { apiClient, bearerHeaders, unwrap } from "@/features/auth/api/http";
import type { components } from "@/shared/lib/api/schema";

export type Bot = components["schemas"]["Bot"];
export type BotList = components["schemas"]["BotList"];
export type BotRequest = components["schemas"]["BotRequest"];
export type Rewrite = components["schemas"]["Rewrite"];
export type StyleProfile = components["schemas"]["StyleProfile"];
export type SuggestReplies = components["schemas"]["SuggestReplies"];
export type Summary = components["schemas"]["Summary"];
export type Translation = components["schemas"]["Translation"];

export async function listBots() {
  return unwrap(
    await apiClient().GET("/api/v1/bots", { headers: bearerHeaders() }),
    "bots_failed",
  );
}

export async function getBot(id: number) {
  return unwrap(
    await apiClient().GET("/api/v1/bots/{id}", {
      headers: bearerHeaders(),
      params: { path: { id } },
    }),
    "bot_failed",
  );
}

export async function listBotRequests() {
  return unwrap(
    await apiClient().GET("/api/v1/bot_requests", { headers: bearerHeaders() }),
    "bot_requests_failed",
  );
}

export async function createBotRequest(body: {
  kind?: string;
  payload?: {
    bio?: string;
    name?: string;
    persona_prompt?: string;
    username?: string;
  };
  target_bot_id?: number | null;
}) {
  return unwrap(
    await apiClient().POST("/api/v1/bot_requests", { headers: bearerHeaders(), body }),
    "bot_request_failed",
  );
}

export async function rewriteDraft(body: {
  conversation_id?: number | null;
  instruction?: string;
  text: string;
  tones?: string[];
}) {
  return unwrap(
    await apiClient().POST("/api/v1/ai/rewrite", { headers: bearerHeaders(), body }),
    "rewrite_failed",
  );
}

export async function translateMessage(
  id: number,
  body: { source_language?: string | null; target_language: string },
) {
  return unwrap(
    await apiClient().POST("/api/v1/messages/{id}/translate", {
      headers: bearerHeaders(),
      params: { path: { id } },
      body,
    }),
    "translate_failed",
  );
}

export async function translateText(body: {
  source_language?: string | null;
  target_language: string;
  text: string;
}) {
  return unwrap(
    await apiClient().POST("/api/v1/ai/translate_text", { headers: bearerHeaders(), body }),
    "translate_text_failed",
  );
}

export async function suggestReplies(conversationId: number, messageId: number) {
  return unwrap(
    await apiClient().POST("/api/v1/conversations/{id}/suggest_replies", {
      headers: bearerHeaders(),
      params: { path: { id: conversationId } },
      body: { message_id: messageId },
    }),
    "suggest_failed",
  );
}

export async function summarizeConversation(
  conversationId: number,
  mode: "unread" | "recent" = "unread",
) {
  return unwrap(
    await apiClient().POST("/api/v1/conversations/{id}/summarize", {
      headers: bearerHeaders(),
      params: { path: { id: conversationId } },
      body: { mode },
    }),
    "summarize_failed",
  );
}

export async function getStyleProfile() {
  return unwrap(
    await apiClient().GET("/api/v1/style_profile", { headers: bearerHeaders() }),
    "style_profile_failed",
  );
}

export async function updateStyleConsent(enabled: boolean) {
  return unwrap(
    await apiClient().PATCH("/api/v1/style_profile", {
      headers: bearerHeaders(),
      body: { enabled },
    }),
    "style_consent_failed",
  );
}

export async function buildStyleProfile() {
  return unwrap(
    await apiClient().POST("/api/v1/style_profile", { headers: bearerHeaders() }),
    "style_build_failed",
  );
}
