import { describe, expect, it } from "vitest";
import {
  appendToNewest,
  flattenMessages,
  mapPages,
  restorePages,
  type MessagePages,
} from "./cache";
import { CLIENT_CACHE_SIZE } from "@/features/conversations/model/settings";
import type { Message } from "@/features/conversations/api/http";

function message(id: number): Message {
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
  };
}

function pages(messages: Message[], extras: Partial<MessagePages> = {}): MessagePages {
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
    ...extras,
  };
}

describe("message cache", () => {
  it("flattens, caps newest, maps, appends, and restores", () => {
    expect(flattenMessages(undefined)).toEqual([]);
    const over = Array.from({ length: CLIENT_CACHE_SIZE + 1 }, (_, index) => message(index + 1));
    expect(flattenMessages(pages(over))).toHaveLength(CLIENT_CACHE_SIZE);
    expect(flattenMessages(pages(over))[0]?.id).toBe(2);
    const mapped = mapPages(pages([message(1)]), (row) => ({ ...row, body: "x" }));
    expect(mapped.pages[0]?.messages[0]?.body).toBe("x");
    const appended = appendToNewest(pages([message(1)]), message(2));
    expect(appended.pages[0]?.messages).toHaveLength(2);
    expect(
      appendToNewest({ pageParams: [], pages: [] }, message(1)).pages[0]?.messages,
    ).toHaveLength(1);
    expect(
      appendToNewest({ pageParams: [], pages: [undefined as never] }, message(1)).pages,
    ).toHaveLength(1);
    expect(restorePages(undefined)).toBeUndefined();
    expect(restorePages(pages([message(1)]))?.pages).toHaveLength(1);
  });
});
