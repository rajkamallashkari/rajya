import type { QueryClient } from "@tanstack/react-query";
import { getAccessSession } from "@/features/auth/model/access-session";
import {
  flattenMessages,
  type MessagePages,
} from "@/features/conversations/api/cache";
import type { Conversation, Message, MessagePage } from "@/features/conversations/api/http";
import { conversationKeys, messageKeys } from "@/features/conversations/api/keys";
import {
  cacheConversationList,
  cacheConversationMessages,
  getCachedConversationList,
  getCachedConversationMessages,
  upsertCachedMessages,
  type CachedConversationMessages,
} from "@/shared/lib/db";

function highestRevision(messages: Message[]): number | null {
  if (messages.length === 0) {
    return null;
  }
  return messages.reduce((max, message) => Math.max(max, message.revision), 0);
}

export function pagesFromCachedMessages(cached: CachedConversationMessages): MessagePages {
  const newest = cached.messages.at(-1);
  return {
    pageParams: [{}],
    pages: [
      {
        messages: cached.messages,
        meta: {
          has_more_after: false,
          has_more_before: cached.hasMoreBefore,
          newest_position: newest?.position ?? null,
          oldest_position: cached.oldestPosition,
          pivot_id: null,
        },
      },
    ],
  };
}

export function persistMessagePages(
  conversationId: number,
  data: MessagePages | undefined,
): void {
  const accountId = getAccessSession()?.accountId;
  if (accountId == null || data == null) {
    return;
  }
  const messages = flattenMessages(data);
  void cacheConversationMessages(accountId, conversationId, messages, {
    hasMoreBefore: data.pages.some((page) => page.meta.has_more_before),
    lastSyncedRevision: highestRevision(messages.filter((message) => message.id > 0)),
    oldestPosition: data.pages.at(-1)?.meta.oldest_position ?? null,
  });
}

export function persistFetchedPage(
  conversationId: number,
  page: MessagePage,
  pageParam: { after?: number; before?: number },
): void {
  const accountId = getAccessSession()?.accountId;
  if (accountId == null) {
    return;
  }
  if (pageParam.after == null && pageParam.before == null) {
    void cacheConversationMessages(accountId, conversationId, page.messages, {
      hasMoreBefore: page.meta.has_more_before,
      lastSyncedRevision: highestRevision(page.messages),
      oldestPosition: page.meta.oldest_position ?? null,
    });
    return;
  }
  void upsertCachedMessages(accountId, conversationId, page.messages);
}

export function persistConversationList(data: { conversations: Conversation[] } | undefined): void {
  const accountId = getAccessSession()?.accountId;
  if (accountId == null || data == null) {
    return;
  }
  void cacheConversationList(accountId, data.conversations);
}

export async function hydrateMessageQuery(
  client: QueryClient,
  accountId: number,
  conversationId: number,
): Promise<void> {
  const key = messageKeys.page(conversationId);
  if (client.getQueryData(key)) {
    return;
  }
  const cached = await getCachedConversationMessages(accountId, conversationId);
  if (!cached || cached.messages.length === 0 || client.getQueryData(key)) {
    return;
  }
  client.setQueryData(key, pagesFromCachedMessages(cached));
}

export async function hydrateConversationList(
  client: QueryClient,
  accountId: number,
): Promise<void> {
  const key = conversationKeys.list();
  if (client.getQueryData(key)) {
    return;
  }
  const cached = await getCachedConversationList(accountId);
  if (!cached || client.getQueryData(key)) {
    return;
  }
  client.setQueryData(key, { conversations: cached });
}

export function persistRealtimeMessage(conversationId: number, message: Message): void {
  const accountId = getAccessSession()?.accountId;
  if (accountId == null) {
    return;
  }
  void upsertCachedMessages(accountId, conversationId, [message]);
}
