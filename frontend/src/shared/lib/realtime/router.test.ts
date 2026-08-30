import { describe, expect, it, vi } from "vitest";
import { QueryClient } from "@tanstack/react-query";
import { setAccessSession } from "@/features/auth/model/access-session";
import { messageKeys } from "@/features/conversations/api/keys";
import type { Message } from "@/features/conversations/api/http";
import type { MessagePages } from "@/features/conversations/api/cache";
import { dispatchRealtimePayload, routeRealtimeEvent, type RealtimeEvent } from "./router";
import { realtimeKeys } from "./keys";
import { testSession } from "@/test/access-session";

function message(id: number, extras: Partial<Message> = {}): Message {
  return {
    id,
    conversation_id: 1,
    position: id,
    revision: id,
    kind: "text",
    body: `m${String(id)}`,
    deleted: false,
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

describe("routeRealtimeEvent", () => {
  it("writes fetched messages into the query cache and covers every event type", async () => {
    const client = new QueryClient();
    client.setQueryData(messageKeys.page(1), pages([message(1)]));
    const fetchMessage = vi.fn(async (id: number) =>
      message(id, { body: "live", revision: 9, deleted: id === 3, reaction_summary: { "👍": 1 } }),
    );
    const deps = { cache: client, fetchMessage };

    const invalidate = vi.spyOn(client, "invalidateQueries");
    await dispatchRealtimePayload(
      { type: "message_created", conversation_id: 1, message_id: 2 },
      deps,
    );
    await routeRealtimeEvent(
      { type: "message_edited", conversation_id: 1, message_id: 1 },
      deps,
    );
    await routeRealtimeEvent(
      { type: "message_deleted", conversation_id: 1, message_id: 3 },
      deps,
    );
    await routeRealtimeEvent(
      { type: "message_reacted", conversation_id: 1, message_id: 1 },
      deps,
    );
    await routeRealtimeEvent({ type: "poll_voted", conversation_id: 1, message_id: 1 }, deps);
    await routeRealtimeEvent({ type: "poll_closed", conversation_id: 1, message_id: 1 }, deps);
    await routeRealtimeEvent({ type: "message_pinned", conversation_id: 1, message_id: 1 }, deps);
    await routeRealtimeEvent({ type: "message_unpinned", conversation_id: 1, message_id: 1 }, deps);
    await routeRealtimeEvent({ type: "sidebar_update", conversation_id: 1 }, deps);
    await routeRealtimeEvent({ type: "presence", account_id: 8, online: false }, deps);
    await routeRealtimeEvent(
      { type: "receipts_updated", conversation_id: 1, account_id: 2, kind: "read", position: 1 },
      deps,
    );
    await routeRealtimeEvent({ type: "phone_verified", phone: "+1" }, deps);
    await routeRealtimeEvent({ type: "message_reminder", id: 4 }, deps);
    await routeRealtimeEvent(
      {
        type: "typing",
        conversation_id: 1,
        account_id: 9,
        activity: "recording_audio",
        display_name: "Priya",
      },
      deps,
    );
    await routeRealtimeEvent(
      { type: "typing", conversation_id: 1, account_id: 9, activity: "dancing", display_name: "X" },
      deps,
    );

    const cached = client.getQueryData<MessagePages>(messageKeys.page(1));
    expect(cached?.pages[0]?.messages.some((row) => row.id === 2)).toBe(true);
    expect(client.getQueryData(realtimeKeys.presence(8))).toBe(false);
    expect(invalidate).toHaveBeenCalled();
    expect(client.getQueryData(realtimeKeys.typing(1))).toEqual([
      expect.objectContaining({ accountId: 9, activity: "recording_audio", displayName: "Priya" }),
    ]);
  });

  it("skips cache writes when the message fetch fails or the page is empty", async () => {
    const client = new QueryClient();
    await routeRealtimeEvent(
      { type: "message_created", conversation_id: 2, message_id: 1 },
      {
        cache: client,
        fetchMessage: async () => {
          throw new Error("gone");
        },
      },
    );
    await routeRealtimeEvent(
      { type: "message_edited", conversation_id: 2, message_id: 1 },
      { cache: client, fetchMessage: async () => message(1) },
    );
    expect(client.getQueryData(messageKeys.page(2))).toBeUndefined();
    expect(client.getQueryData(messageKeys.permalink(1))).toEqual(message(1));
  });

  it("rejects an unhandled member", async () => {
    await expect(
      routeRealtimeEvent({ type: "nope" } as unknown as RealtimeEvent, {
        cache: new QueryClient(),
        fetchMessage: vi.fn(),
      }),
    ).rejects.toThrow();
  });

  it("patches ticks from another account and ignores the viewer's own receipts", async () => {
    setAccessSession(testSession());
    const client = new QueryClient();
    client.setQueryData(
      messageKeys.page(1),
      pages([
        message(1, { sender: { id: 1, username: "ada", display_name: "Ada", kind: "human" }, tick: "sent" }),
        message(2, { sender: { id: 2, username: "grace", display_name: "Grace", kind: "human" }, tick: "sent" }),
        message(-3, { sender: { id: 1, username: "ada", display_name: "Ada", kind: "human" }, tick: "sent" }),
      ]),
    );
    const deps = { cache: client, fetchMessage: vi.fn() };
    await routeRealtimeEvent(
      { type: "receipts_updated", conversation_id: 1, account_id: 1, kind: "read", position: 9 },
      deps,
    );
    expect(client.getQueryData<MessagePages>(messageKeys.page(1))?.pages[0]?.messages[0]?.tick).toBe("sent");
    await routeRealtimeEvent(
      { type: "receipts_updated", conversation_id: 1, account_id: 2, kind: "read", position: 1 },
      deps,
    );
    const afterRead = client.getQueryData<MessagePages>(messageKeys.page(1))?.pages[0]?.messages;
    expect(afterRead?.[0]?.tick).toBe("read");
    expect(afterRead?.[1]?.tick).toBe("sent");
    expect(afterRead?.[2]?.tick).toBe("sent");
    await routeRealtimeEvent(
      { type: "receipts_updated", conversation_id: 1, account_id: 2, kind: "delivered", position: 1 },
      deps,
    );
    expect(client.getQueryData<MessagePages>(messageKeys.page(1))?.pages[0]?.messages[0]?.tick).toBe("read");
    await routeRealtimeEvent(
      { type: "receipts_updated", conversation_id: 99, account_id: 2, kind: "read", position: 1 },
      deps,
    );
    await routeRealtimeEvent(
      { type: "receipts_updated", conversation_id: 1, account_id: 2, kind: "viewed", position: 1 },
      deps,
    );
    expect(client.getQueryData<MessagePages>(messageKeys.page(1))?.pages[0]?.messages[0]?.tick).toBe("read");
  });

  it("clears a sender's typing bubble when their message arrives", async () => {
    const client = new QueryClient();
    client.setQueryData(messageKeys.page(1), pages([message(1)]));
    client.setQueryData(realtimeKeys.typing(1), [
      { accountId: 8, activity: "typing", displayName: "Priya", expiresAt: Date.now() + 5000 },
    ]);
    await routeRealtimeEvent(
      { type: "message_created", conversation_id: 1, message_id: 2 },
      {
        cache: client,
        fetchMessage: async () =>
          message(2, { sender: { id: 8, username: "priya", display_name: "Priya", kind: "human" } }),
      },
    );
    expect(client.getQueryData(realtimeKeys.typing(1))).toEqual([]);
  });
});
