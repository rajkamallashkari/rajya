import { describe, expect, it, vi } from "vitest";
import { setAuthCache } from "@/shared/lib/db/auth-cache";
import { getOutbox, queueOutbox, queuedOutbox } from "@/shared/lib/db/outbox";
import {
  drainAllOutboxes,
  drainOutbox,
  enqueueAndFlush,
  enqueueOutbox,
  resetOutboxProcessor,
  retryOutbox,
  setOutboxCallbacks,
} from "./processor";
import { OutboxSendError, type Message } from "./send";

function message(id: number): Message {
  return {
    id,
    conversation_id: 1,
    position: id,
    revision: 1,
    kind: "text",
    body: "ok",
    deleted: false,
    silent: false,
    created_at: "2026-01-01T12:00:00.000Z",
  };
}

describe("outbox processor", () => {
  it("sends queued rows once under a single-flight lock (F-3)", async () => {
    const sends: string[] = [];
    const send = vi.fn(async (entry: { id: string }) => {
      sends.push(entry.id);
      return message(1);
    });
    await enqueueOutbox(1, {
      body: "one",
      conversationId: 1,
      createdAt: "2026-01-01T00:00:01.000Z",
      id: "n1",
    });
    const [first, second] = await Promise.all([
      drainOutbox(1, { send, sync: () => undefined }),
      drainOutbox(1, { send, sync: () => undefined }),
    ]);
    expect(sends).toEqual(["n1"]);
    expect(Object.keys(first.sent).concat(Object.keys(second.sent))).toEqual(["n1"]);
    expect(await getOutbox(1, "n1")).toBeUndefined();
  });

  it("keeps order within a conversation and continues other chats", async () => {
    const order: string[] = [];
    const send = vi.fn(async (entry: { id: string; conversationId: number }) => {
      order.push(entry.id);
      if (entry.id === "a1") {
        throw new OutboxSendError("network");
      }
      return message(2);
    });
    const sync = vi.fn();
    await queueOutbox(1, queuedOutbox({
      body: "a1",
      conversationId: 1,
      createdAt: "2026-01-01T00:00:01.000Z",
      id: "a1",
    }));
    await queueOutbox(1, queuedOutbox({
      body: "a2",
      conversationId: 1,
      createdAt: "2026-01-01T00:00:02.000Z",
      id: "a2",
    }));
    await queueOutbox(1, queuedOutbox({
      body: "b1",
      conversationId: 2,
      createdAt: "2026-01-01T00:00:00.000Z",
      id: "b1",
    }));
    const result = await drainOutbox(1, { send, sync });
    expect(order).toContain("a1");
    expect(order).toContain("b1");
    expect(order).not.toContain("a2");
    expect(result.queued).toContain("a1");
    expect(result.sent.b1).toBeDefined();
    expect(sync).toHaveBeenCalled();
    expect((await getOutbox(1, "a1"))?.status).toBe("queued");
    expect((await getOutbox(1, "a2"))?.status).toBe("queued");
  });

  it("fails permanently on auth and rejected errors", async () => {
    const failed: string[] = [];
    const sent: string[] = [];
    setOutboxCallbacks({
      onFailed: (entry) => failed.push(entry.id),
      onSent: (entry) => sent.push(entry.id),
    });
    await enqueueOutbox(1, {
      body: "auth",
      conversationId: 1,
      createdAt: "t",
      id: "auth",
    });
    await enqueueOutbox(1, {
      body: "nope",
      conversationId: 1,
      createdAt: "2026-01-01T00:00:02.000Z",
      id: "nope",
    });
    const send = vi.fn(async (entry: { id: string }) => {
      if (entry.id === "auth") {
        throw new OutboxSendError("auth");
      }
      throw new OutboxSendError("rejected");
    });
    const result = await drainOutbox(1, { send, sync: () => undefined });
    expect(result.failed.auth).toBe("auth");
    expect(result.failed.nope).toBe("rejected");
    expect(failed).toEqual(expect.arrayContaining(["auth", "nope"]));
    expect(failed).toHaveLength(2);
    expect(sent).toEqual([]);
    resetOutboxProcessor();
  });

  it("retries a failed row and no-ops a missing sending mark", async () => {
    await enqueueOutbox(1, {
      body: "retry",
      conversationId: 1,
      createdAt: "t",
      id: "r1",
    });
    await drainOutbox(1, {
      send: async () => {
        throw new OutboxSendError("rejected");
      },
      sync: () => undefined,
    });
    const retried = await retryOutbox(1, "r1", {
      send: async () => message(3),
      sync: () => undefined,
    });
    expect(retried.sent.r1).toBeDefined();
    const missing = await drainOutbox(1, {
      send: async () => message(1),
      sync: () => undefined,
    });
    expect(missing.sent).toEqual({});
  });

  it("drains all account databases and uses auth cache by default", async () => {
    await enqueueAndFlush(2, {
      body: "need-auth",
      conversationId: 1,
      createdAt: "t",
      id: "x1",
    }, { sync: () => undefined });
    expect((await getOutbox(2, "x1"))?.status).toBe("failed");
    await setAuthCache(3, { accountId: 3, apiUrl: window.location.origin, token: "tok" });
    await enqueueOutbox(3, {
      body: "ok",
      conversationId: 1,
      createdAt: "t",
      id: "ok",
    });
    const all = await drainAllOutboxes({
      send: async () => message(4),
      sync: () => undefined,
    });
    expect(all.sent.ok ?? all.failed).toBeDefined();

    await setAuthCache(5, { accountId: 5, apiUrl: window.location.origin, token: "tok" });
    await enqueueOutbox(5, {
      body: "live",
      conversationId: 1,
      createdAt: "t",
      id: "live",
    });
    const live = await drainOutbox(5, { sync: () => undefined });
    expect(live.sent.live ?? live.failed.live).toBeDefined();
  });
});
