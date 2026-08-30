import { describe, expect, it, vi } from "vitest";
import { QueryClient } from "@tanstack/react-query";
import type { Message } from "@/features/conversations/api/http";
import type { MessagePages } from "@/features/conversations/api/cache";
import { messageKeys } from "@/features/conversations/api/keys";
import { RECONNECT_DELAY_MS } from "@/shared/lib/cable/timing";
import {
  cachedConversationIds,
  catchUpCachedConversations,
  catchUpConversation,
  maxRevision,
  resetCatchUpScheduler,
  scheduleCatchUp,
} from "./catch-up";

function message(id: number, extras: Partial<Message> = {}): Message {
  return {
    id,
    conversation_id: 1,
    position: id,
    revision: extras.revision ?? id,
    kind: "text",
    body: extras.body ?? `m${String(id)}`,
    deleted: extras.deleted ?? false,
    silent: false,
    created_at: "2026-01-01T12:00:00.000Z",
    ...extras,
  };
}

function pages(messages: Message[]): MessagePages {
  return {
    pageParams: [{}],
    pages: [
      {
        messages,
        meta: {
          has_more_before: false,
          has_more_after: false,
          oldest_position: messages[0]?.position ?? null,
          newest_position: messages[messages.length - 1]?.position ?? null,
          pivot_id: null,
        },
      },
    ],
  };
}

describe("catch-up", () => {
  it("merges send, edit, tombstone, and reaction after reconnect (BR-26, BR-30, BR-33)", async () => {
    const client = new QueryClient();
    client.setQueryData(messageKeys.page(1), pages([message(1, { revision: 1 })]));
    await catchUpConversation(client, 1, async () => ({
      messages: [
        message(2, { body: "new", revision: 2 }),
        message(1, { body: "edited", revision: 3 }),
        message(3, { body: null, deleted: true, revision: 4 }),
        message(1, { body: "edited", revision: 5, reaction_summary: { "👍": 1 } }),
      ],
      meta: {
        has_more_before: false,
        has_more_after: false,
        oldest_position: 1,
        newest_position: 3,
        pivot_id: null,
      },
    }));
    const cached = client.getQueryData<MessagePages>(messageKeys.page(1));
    const byId = new Map(cached?.pages[0]?.messages.map((row) => [row.id, row]));
    expect(byId.get(2)?.body).toBe("new");
    expect(byId.get(1)?.body).toBe("edited");
    expect(byId.get(1)?.reaction_summary).toEqual({ "👍": 1 });
    expect(byId.get(3)?.deleted).toBe(true);
  });

  it("invalidates an empty cache and no-ops an empty catch-up page", async () => {
    const client = new QueryClient();
    const invalidate = vi.spyOn(client, "invalidateQueries");
    await catchUpConversation(client, 7, async () => {
      throw new Error("should not fetch");
    });
    expect(invalidate).toHaveBeenCalled();
    client.setQueryData(messageKeys.page(8), pages([message(1)]));
    await catchUpConversation(client, 8, async () => ({
      messages: [],
      meta: {
        has_more_before: false,
        has_more_after: false,
        oldest_position: null,
        newest_position: null,
        pivot_id: null,
      },
    }));
    expect(client.getQueryData<MessagePages>(messageKeys.page(8))?.pages[0]?.messages).toHaveLength(1);
  });

  it("schedules a delayed catch-up and lists cached conversation ids", async () => {
    vi.useFakeTimers();
    const client = new QueryClient();
    client.setQueryData(["messages", "page", "x"], pages([]));
    client.setQueryData(messageKeys.page(1), pages([message(1)]));
    expect(maxRevision([])).toBeNull();
    expect(maxRevision([message(1, { revision: 2 }), message(2, { revision: 5 })])).toBe(5);
    expect(cachedConversationIds(client)).toEqual([1]);
    const run = vi.fn();
    scheduleCatchUp(run);
    scheduleCatchUp(run);
    expect(run).not.toHaveBeenCalled();
    await vi.advanceTimersByTimeAsync(RECONNECT_DELAY_MS);
    expect(run).toHaveBeenCalledTimes(1);
    resetCatchUpScheduler();
    const fetchPage = vi.fn(async () => ({
      messages: [],
      meta: {
        has_more_before: false,
        has_more_after: false,
        oldest_position: null,
        newest_position: null,
        pivot_id: null,
      },
    }));
    await catchUpCachedConversations(client, fetchPage);
    expect(fetchPage).toHaveBeenCalledWith(1, 1);
    vi.useRealTimers();
  });
});
