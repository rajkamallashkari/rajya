import { describe, expect, it } from "vitest";
import { QueryClient } from "@tanstack/react-query";
import { setAccessSession } from "@/features/auth/model/access-session";
import { testSession } from "@/test/access-session";
import { conversationKeys, messageKeys } from "./keys";
import type { Message, MessagePage } from "./http";
import {
  hydrateConversationList,
  hydrateMessageQuery,
  pagesFromCachedMessages,
  persistConversationList,
  persistFetchedPage,
  persistMessagePages,
  persistRealtimeMessage,
} from "./persist";
import { cacheConversationList, cacheConversationMessages } from "@/shared/lib/db";
import type { MessagePages } from "./cache";

function message(id: number, extras: Partial<Message> = {}): Message {
  return {
    id,
    conversation_id: 1,
    position: id,
    revision: 1,
    kind: "text",
    body: `m${String(id)}`,
    deleted: false,
    silent: false,
    created_at: "2026-01-01T12:00:00.000Z",
    ...extras,
  };
}

function page(messages: Message[], extras: Partial<MessagePage["meta"]> = {}): MessagePage {
  return {
    messages,
    meta: {
      has_more_after: false,
      has_more_before: false,
      newest_position: messages.at(-1)?.position ?? null,
      oldest_position: messages[0]?.position ?? null,
      pivot_id: null,
      ...extras,
    },
  };
}

function pages(messages: Message[]): MessagePages {
  return { pageParams: [{}], pages: [page(messages)] };
}

describe("message persist", () => {
  it("hydrates and persists per-account caches", async () => {
    persistMessagePages(1, undefined);
    persistConversationList(undefined);
    persistFetchedPage(1, page([message(1)]), {});
    persistRealtimeMessage(1, message(1));
    const emptyClient = new QueryClient();
    await hydrateMessageQuery(emptyClient, 1, 1);
    await hydrateConversationList(emptyClient, 1);
    expect(emptyClient.getQueryData(messageKeys.page(1))).toBeUndefined();
    expect(emptyClient.getQueryData(conversationKeys.list())).toBeUndefined();

    await cacheConversationMessages(1, 1, [message(4)], {
      hasMoreBefore: true,
      lastSyncedRevision: 1,
      oldestPosition: 4,
    });
    await cacheConversationList(1, []);
    const client = new QueryClient();
    await hydrateMessageQuery(client, 1, 1);
    await hydrateConversationList(client, 1);
    expect(client.getQueryData<MessagePages>(messageKeys.page(1))?.pages[0]?.messages[0]?.id).toBe(
      4,
    );
    expect(client.getQueryData(conversationKeys.list())).toEqual({ conversations: [] });
    await cacheConversationMessages(1, 9, [], {
      hasMoreBefore: false,
      lastSyncedRevision: null,
      oldestPosition: null,
    });
    await hydrateMessageQuery(client, 1, 9);
    expect(client.getQueryData(messageKeys.page(9))).toBeUndefined();

    setAccessSession(testSession());
    persistFetchedPage(1, page([message(1)], { has_more_before: true }), {});
    persistFetchedPage(1, page([message(2)]), { before: 1 });
    persistFetchedPage(1, page([message(3)]), { after: 1 });
    persistMessagePages(1, pages([message(5)]));
    persistConversationList({ conversations: [] });
    persistRealtimeMessage(1, message(6));

    const hydrated = new QueryClient();
    await hydrateMessageQuery(hydrated, 1, 1);
    expect(hydrated.getQueryData<MessagePages>(messageKeys.page(1))?.pages[0]?.messages.length).toBeGreaterThan(
      0,
    );
    persistMessagePages(1, { pageParams: [{}], pages: [] });
    await hydrateMessageQuery(hydrated, 1, 1);
    await hydrateConversationList(hydrated, 1);
    expect(hydrated.getQueryData(conversationKeys.list())).toEqual({ conversations: [] });
    await hydrateConversationList(hydrated, 1);

    const skipped = new QueryClient();
    skipped.setQueryData(messageKeys.page(1), pages([message(9)]));
    skipped.setQueryData(conversationKeys.list(), { conversations: [{ id: 1 }] });
    await hydrateMessageQuery(skipped, 1, 1);
    await hydrateConversationList(skipped, 1);
    expect(skipped.getQueryData<MessagePages>(messageKeys.page(1))?.pages[0]?.messages[0]?.id).toBe(
      9,
    );

    expect(pagesFromCachedMessages({
      conversationId: 1,
      hasMoreBefore: false,
      lastSyncedRevision: null,
      messages: [],
      oldestPosition: null,
      savedAt: 0,
    }).pages[0]?.meta.newest_position).toBeNull();
  });
});
