import { describe, expect, it } from "vitest";
import {
  drainFromServiceWorker,
  OUTBOX_SYNC_EXHAUSTED,
  OUTBOX_SYNC_FAILED,
  OUTBOX_SYNC_SUCCESS,
  queuedCountFor,
} from "./worker";
import type { Message } from "./send";
import { queueOutbox } from "@/shared/lib/db/outbox";

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
    created_at: "t",
  };
}

describe("service worker drain", () => {
  it("posts success, failure, and last-chance exhaustion", async () => {
    const posted: unknown[] = [];
    await drainFromServiceWorker({
      drain: async () => ({
        failed: { f1: "rejected" },
        queued: ["q1"],
        sent: { s1: message(1) },
      }),
      lastChance: true,
      postMessage: (data) => posted.push(data),
    });
    expect(posted).toEqual([
      {
        clientId: "s1",
        conversationId: 1,
        message: message(1),
        type: OUTBOX_SYNC_SUCCESS,
      },
      {
        clientId: "f1",
        conversationId: 0,
        reason: "rejected",
        type: OUTBOX_SYNC_FAILED,
      },
      { count: 1, type: OUTBOX_SYNC_EXHAUSTED },
    ]);

    await drainFromServiceWorker({});
    await drainFromServiceWorker({
      drain: async () => ({ failed: {}, queued: ["q1"], sent: {} }),
      lastChance: false,
    });
    await queueOutbox(4, {
      attempts: 0,
      body: "q",
      conversationId: 1,
      createdAt: "t",
      id: "q",
      status: "queued",
    });
    expect(await queuedCountFor(4)).toBe(1);
    await drainFromServiceWorker({
      drain: async () => ({ failed: { f2: null }, queued: [], sent: {} }),
      lastChance: true,
      postMessage: () => undefined,
    });
  });
});
