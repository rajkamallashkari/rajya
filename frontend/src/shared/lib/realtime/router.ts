import type { QueryClient } from "@tanstack/react-query";
import { getAccessSession } from "@/features/auth/model/access-session";
import { conversationKeys, inviteKeys, messageKeys } from "@/features/conversations/api/keys";
import { getMessage, type Message } from "@/features/conversations/api/http";
import {
  applyReceiptTick,
  upsertMessages,
  type MessagePages,
} from "@/features/conversations/api/cache";
import { persistRealtimeMessage } from "@/features/conversations/api/persist";
import {
  isActivityKind,
  removeTypist,
  upsertTypingEntry,
  TYPING_KEY_TTL_MS,
  type TypingEntry,
} from "@/features/conversations/model/typing";
import {
  generationMatchesReply,
  type GenerationState,
} from "@/features/conversations/model/generation";
import { parseRealtimeEvent, type RealtimeEvent } from "@/shared/lib/realtime/events";
import { realtimeKeys } from "@/shared/lib/realtime/keys";

export type { RealtimeEvent };

export interface RealtimeRouterDeps {
  cache: Pick<QueryClient, "getQueryData" | "invalidateQueries" | "setQueryData">;
  fetchMessage: (id: number) => Promise<Message>;
}

export function realtimeDeps(client: QueryClient): RealtimeRouterDeps {
  return { cache: client, fetchMessage: getMessage };
}

export async function dispatchRealtimePayload(
  data: unknown,
  deps: RealtimeRouterDeps,
): Promise<void> {
  await routeRealtimeEvent(parseRealtimeEvent(data), deps);
}

export async function routeRealtimeEvent(
  event: RealtimeEvent,
  deps: RealtimeRouterDeps,
): Promise<void> {
  switch (event.type) {
    case "message_created":
      await mergeFetchedMessage(event.message_id, event.conversation_id, deps);
      await deps.cache.invalidateQueries({ queryKey: conversationKeys.list() });
      return;
    case "message_deleted":
    case "message_edited":
    case "message_reacted":
    case "attachment_processed":
    case "poll_closed":
    case "poll_voted":
      await mergeFetchedMessage(event.message_id, event.conversation_id, deps);
      return;
    case "message_pinned":
    case "message_unpinned":
      await deps.cache.invalidateQueries({ queryKey: messageKeys.pinned(event.conversation_id) });
      return;
    case "sidebar_update":
      await deps.cache.invalidateQueries({ queryKey: conversationKeys.list() });
      await deps.cache.invalidateQueries({
        queryKey: conversationKeys.detail(event.conversation_id),
      });
      return;
    case "join_request":
      await deps.cache.invalidateQueries({
        queryKey: inviteKeys.joinRequests(event.conversation_id),
      });
      await deps.cache.invalidateQueries({ queryKey: conversationKeys.list() });
      if (event.status === "approved") {
        await deps.cache.invalidateQueries({
          queryKey: conversationKeys.detail(event.conversation_id),
        });
      }
      return;
    case "presence":
      deps.cache.setQueryData(realtimeKeys.presence(event.account_id), event.online);
      return;
    case "report_created":
      return;
    case "receipts_updated": {
      const viewerId = getAccessSession()?.accountId;
      if (viewerId == null || event.account_id === viewerId) {
        return;
      }
      const key = messageKeys.page(event.conversation_id);
      const current = deps.cache.getQueryData<MessagePages>(key);
      if (current) {
        deps.cache.setQueryData(
          key,
          applyReceiptTick(current, viewerId, event.kind, event.position),
        );
      }
      return;
    }
    case "typing":
      applyTyping(event, deps);
      return;
    case "generation_started":
      deps.cache.setQueryData(realtimeKeys.generation(event.conversation_id), {
        botAccountId: event.bot_account_id,
        generationId: event.generation_id,
        text: "",
      } satisfies GenerationState);
      return;
    case "generation_chunk":
      applyGenerationChunk(event, deps);
      return;
    case "generation_cancelled":
      clearGeneration(event.conversation_id, event.generation_id, deps);
      return;
    case "phone_verified":
      await deps.cache.invalidateQueries({ queryKey: realtimeKeys.me });
      return;
    case "message_reminder":
      await deps.cache.invalidateQueries({ queryKey: realtimeKeys.reminders });
      return;
    case "answer":
    case "busy":
    case "call_accepted":
    case "call_cancelled":
    case "call_declined":
    case "call_dismissed":
    case "call_ended":
    case "call_missed":
    case "ice_candidate":
    case "incoming_call":
    case "mute_state":
    case "offer":
    case "user_joined":
    case "user_left":
      return;
    default: {
      const exhaustive: never = event;
      throw new Error(String(exhaustive));
    }
  }
}

function applyGenerationChunk(
  event: Extract<RealtimeEvent, { type: "generation_chunk" }>,
  deps: RealtimeRouterDeps,
): void {
  const key = realtimeKeys.generation(event.conversation_id);
  const current = deps.cache.getQueryData<GenerationState | null>(key);
  if (!current || current.generationId !== event.generation_id) {
    return;
  }
  deps.cache.setQueryData(key, { ...current, text: `${current.text}${event.delta}` });
}

function clearGeneration(
  conversationId: number,
  generationId: string,
  deps: RealtimeRouterDeps,
): void {
  const key = realtimeKeys.generation(conversationId);
  const current = deps.cache.getQueryData<GenerationState | null>(key);
  if (!current || current.generationId === generationId) {
    deps.cache.setQueryData(key, null);
  }
}

function clearGenerationIfReply(
  conversationId: number,
  message: Message,
  deps: RealtimeRouterDeps,
): void {
  const key = realtimeKeys.generation(conversationId);
  const current = deps.cache.getQueryData<GenerationState | null>(key);
  if (!current || !generationMatchesReply(current, message)) {
    return;
  }
  deps.cache.setQueryData(key, null);
}

function applyTyping(
  event: Extract<RealtimeEvent, { type: "typing" }>,
  deps: RealtimeRouterDeps,
): void {
  if (!isActivityKind(event.activity)) {
    return;
  }
  const now = Date.now();
  const key = realtimeKeys.typing(event.conversation_id);
  const current = deps.cache.getQueryData<TypingEntry[]>(key) ?? [];
  deps.cache.setQueryData(
    key,
    upsertTypingEntry(
      current,
      {
        accountId: event.account_id,
        activity: event.activity,
        displayName: event.display_name,
        expiresAt: now + TYPING_KEY_TTL_MS,
      },
      now,
    ),
  );
}

async function mergeFetchedMessage(
  messageId: number,
  conversationId: number,
  deps: RealtimeRouterDeps,
): Promise<void> {
  let message: Message;
  try {
    message = await deps.fetchMessage(messageId);
  } catch {
    await deps.cache.invalidateQueries({ queryKey: messageKeys.page(conversationId) });
    return;
  }
  const key = messageKeys.page(conversationId);
  const current = deps.cache.getQueryData<MessagePages>(key);
  if (current) {
    deps.cache.setQueryData(key, upsertMessages(current, [message]));
  }
  deps.cache.setQueryData(messageKeys.permalink(messageId), message);
  persistRealtimeMessage(conversationId, message);
  clearGenerationIfReply(conversationId, message, deps);
  if (message.sender) {
    const typingKey = realtimeKeys.typing(conversationId);
    const typists = deps.cache.getQueryData<TypingEntry[]>(typingKey);
    if (typists) {
      deps.cache.setQueryData(typingKey, removeTypist(typists, message.sender.id, Date.now()));
    }
  }
}
