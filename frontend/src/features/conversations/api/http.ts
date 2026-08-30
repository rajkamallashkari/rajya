import { apiClient, bearerHeaders, unwrap } from "@/features/auth/api/http";
import type { components } from "@/shared/lib/api/schema";

export type Conversation = components["schemas"]["Conversation"];
export type Message = components["schemas"]["Message"];
export type MessagePage = components["schemas"]["MessagePage"];
export type MessageInfo = components["schemas"]["MessageInfo"];

export async function listConversations() {
  return unwrap(
    await apiClient().GET("/api/v1/conversations", { headers: bearerHeaders() }),
    "conversations_failed",
  );
}

export async function getConversation(id: number) {
  return unwrap(
    await apiClient().GET("/api/v1/conversations/{id}", {
      headers: bearerHeaders(),
      params: { path: { id } },
    }),
    "conversation_failed",
  );
}

export async function listMessages(
  conversationId: number,
  query?: { after?: number; around_at?: string; around_id?: number; before?: number },
) {
  return unwrap(
    await apiClient().GET("/api/v1/conversations/{conversation_id}/messages", {
      headers: bearerHeaders(),
      params: { path: { conversation_id: conversationId }, query },
    }),
    "messages_failed",
  );
}

export async function getMessageInfo(id: number) {
  return unwrap(
    await apiClient().GET("/api/v1/messages/{id}/info", {
      headers: bearerHeaders(),
      params: { path: { id } },
    }),
    "message_info_failed",
  );
}

export async function sendMessage(body: {
  body?: string;
  client_nonce?: string;
  contacts?: components["schemas"]["MessageContact"][];
  conversation_id: number;
  location?: components["schemas"]["MessageLocation"];
  poll?: {
    allows_multiple?: boolean;
    closes_at?: string;
    is_anonymous?: boolean;
    options: string[];
    question: string;
  };
  reply_to_message_id?: number;
}) {
  return unwrap(
    await apiClient().POST("/api/v1/messages", { headers: bearerHeaders(), body }),
    "send_failed",
  );
}

export async function editMessage(id: number, body: string) {
  return unwrap(
    await apiClient().PATCH("/api/v1/messages/{id}", {
      headers: bearerHeaders(),
      params: { path: { id } },
      body: { body },
    }),
    "edit_failed",
  );
}

export async function unsendMessage(id: number) {
  return unwrap(
    await apiClient().DELETE("/api/v1/messages/{id}", {
      headers: bearerHeaders(),
      params: { path: { id } },
    }),
    "unsend_failed",
  );
}

export async function reactToMessage(messageId: number, emoji: string) {
  return unwrap(
    await apiClient().POST("/api/v1/messages/{message_id}/reactions", {
      headers: bearerHeaders(),
      params: { path: { message_id: messageId } },
      body: { emoji },
    }),
    "react_failed",
  );
}

export async function pinMessage(conversationId: number, messageId: number) {
  return unwrap(
    await apiClient().POST("/api/v1/conversations/{conversation_id}/pins", {
      headers: bearerHeaders(),
      params: { path: { conversation_id: conversationId } },
      body: { message_id: messageId },
    }),
    "pin_failed",
  );
}

export async function saveMessage(messageId: number) {
  return unwrap(
    await apiClient().POST("/api/v1/saved_messages", {
      headers: bearerHeaders(),
      body: { message_id: messageId },
    }),
    "save_failed",
  );
}

export async function votePoll(pollId: number, optionIds: number[]) {
  return unwrap(
    await apiClient().POST("/api/v1/polls/{id}/vote", {
      headers: bearerHeaders(),
      params: { path: { id: pollId } },
      body: { option_ids: optionIds },
    }),
    "poll_vote_failed",
  );
}

export async function closePoll(pollId: number) {
  return unwrap(
    await apiClient().POST("/api/v1/polls/{id}/close", {
      headers: bearerHeaders(),
      params: { path: { id: pollId } },
    }),
    "poll_close_failed",
  );
}

export async function getPoll(pollId: number) {
  return unwrap(
    await apiClient().GET("/api/v1/polls/{id}", {
      headers: bearerHeaders(),
      params: { path: { id: pollId } },
    }),
    "poll_failed",
  );
}
