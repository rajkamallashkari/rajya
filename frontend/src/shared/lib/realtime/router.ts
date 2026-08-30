import type { QueryClient } from "@tanstack/react-query";
import { conversationKeys, messageKeys } from "@/features/conversations/api/keys";
import { getMessage, type Message } from "@/features/conversations/api/http";
import { upsertMessages, type MessagePages } from "@/features/conversations/api/cache";
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
    case "presence":
      deps.cache.setQueryData(realtimeKeys.presence(event.account_id), event.online);
      return;
    case "phone_verified":
      await deps.cache.invalidateQueries({ queryKey: realtimeKeys.me });
      return;
    case "message_reminder":
      await deps.cache.invalidateQueries({ queryKey: realtimeKeys.reminders });
      return;
    default: {
      const exhaustive: never = event;
      throw new Error(String(exhaustive));
    }
  }
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
    return;
  }
  const key = messageKeys.page(conversationId);
  const current = deps.cache.getQueryData<MessagePages>(key);
  if (current) {
    deps.cache.setQueryData(key, upsertMessages(current, [message]));
  }
  deps.cache.setQueryData(messageKeys.permalink(messageId), message);
}
