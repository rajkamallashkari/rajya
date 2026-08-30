import { describe, expect, it } from "vitest";
import { CLIENT_CACHE_SIZE } from "@/features/conversations/model/settings";
import type { Conversation, Message } from "@/features/conversations/api/http";
import {
  cacheConversationList,
  cacheConversationMessages,
  clearCachedConversation,
  getCachedConversationList,
  getCachedConversationMessages,
  upsertCachedMessages,
} from "./messages";
import { conversationCacheId } from "./schema";

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

describe("conversation message cache", () => {
  it("keeps the newest window and ignores optimistic rows (BR-107)", async () => {
    expect(conversationCacheId(4)).toBe("messages:4");
    const overflow = Array.from({ length: CLIENT_CACHE_SIZE + 2 }, (_, index) =>
      message(index + 1),
    );
    await cacheConversationMessages(1, 1, [...overflow, message(-1, { position: 999 })], {
      hasMoreBefore: true,
      lastSyncedRevision: 9,
      oldestPosition: 1,
    });
    const cached = await getCachedConversationMessages(1, 1);
    expect(cached?.messages).toHaveLength(CLIENT_CACHE_SIZE);
    expect(cached?.messages[0]?.id).toBe(3);
    expect(cached?.messages.at(-1)?.id).toBe(CLIENT_CACHE_SIZE + 2);
    expect(cached?.hasMoreBefore).toBe(true);
    expect(cached?.lastSyncedRevision).toBe(9);

    await upsertCachedMessages(1, 1, [message(3, { body: "edited" }), message(-2)]);
    const upserted = await getCachedConversationMessages(1, 1);
    expect(upserted?.messages.find((row) => row.id === 3)?.body).toBe("edited");

    await upsertCachedMessages(1, 1, [message(-3)]);
    expect((await getCachedConversationMessages(1, 1))?.messages).toHaveLength(CLIENT_CACHE_SIZE);

    await upsertCachedMessages(2, 1, [message(9999, { conversation_id: 1 })]);
    expect((await getCachedConversationMessages(1, 1))?.messages.some((row) => row.id === 9999)).toBe(
      false,
    );
    const created = await getCachedConversationMessages(2, 1);
    expect(created?.messages).toEqual([message(9999, { conversation_id: 1 })]);
    await clearCachedConversation(1, 1);
    expect(await getCachedConversationMessages(1, 1)).toBeNull();
  });

  it("isolates conversation lists per account", async () => {
    const list: Conversation[] = [];
    await cacheConversationList(1, list);
    expect(await getCachedConversationList(1)).toEqual([]);
    expect(await getCachedConversationList(2)).toBeNull();
    await cacheConversationList(2, [{ id: 1 } as Conversation]);
    expect(await getCachedConversationList(2)).toHaveLength(1);
    expect(await getCachedConversationList(1)).toEqual([]);
  });
});
