import { describe, expect, it } from "vitest";
import { putRecord } from "./account-db";
import {
  getOutbox,
  getQueuedOutbox,
  groupOutboxByConversation,
  isQueued,
  patchOutbox,
  queueOutbox,
  queuedOutbox,
  resetSendingOutbox,
  sortOutbox,
  withOutboxStatus,
  type OutboxRecord,
} from "./outbox";

function entry(id: string, extras: Partial<OutboxRecord> = {}): OutboxRecord {
  return queuedOutbox({
    body: id,
    conversationId: 1,
    createdAt: "2026-01-01T00:00:00.000Z",
    id,
    ...extras,
  });
}

describe("outbox records", () => {
  it("queues, patches, and resets sending rows", async () => {
    await expect(patchOutbox(1, "missing", { status: "failed" })).resolves.toBeUndefined();
    const queued = entry("a", { createdAt: "2026-01-01T00:00:02.000Z" });
    const sending = entry("b", { status: "sending", createdAt: "2026-01-01T00:00:01.000Z" });
    await queueOutbox(1, queued);
    await queueOutbox(1, sending);
    expect(await getOutbox(1, "a")).toEqual({ ...queued, queuedAt: expect.any(Number) });
    expect(isQueued({ ...queued, status: undefined as unknown as OutboxRecord["status"] })).toBe(
      true,
    );
    expect(await getQueuedOutbox(1)).toEqual([
      expect.objectContaining({ id: "a", status: "queued" }),
    ]);
    await resetSendingOutbox(1);
    expect((await getOutbox(1, "b"))?.status).toBe("queued");
    expect(sortOutbox([queued, sending]).map((row) => row.id)).toEqual(["b", "a"]);
    expect(
      sortOutbox([
        entry("x", { queuedAt: 2 }),
        entry("y", { createdAt: "2026-01-01T00:00:00.000Z", queuedAt: 1 }),
      ]).map((row) => row.id),
    ).toEqual(["y", "x"]);
    expect(groupOutboxByConversation([queued, entry("c", { conversationId: 2 })]).size).toBe(2);
    expect(withOutboxStatus(queued, "failed", "rejected").failReason).toBe("rejected");
    expect((await patchOutbox(1, "a", { status: "failed", failReason: "auth" }))?.status).toBe(
      "failed",
    );
    await queueOutbox(2, entry("first"));
    await queueOutbox(2, entry("second"));
    await queueOutbox(2, entry("held", { queuedAt: Date.now() + 100_000 }));
    await queueOutbox(2, entry("late"));
    expect(sortOutbox(await getQueuedOutbox(2)).map((row) => row.id)).toEqual([
      "first",
      "second",
      "held",
      "late",
    ]);
    await putRecord(3, "outbox", entry("bare"));
    await queueOutbox(3, entry("after-bare"));
    expect(sortOutbox(await getQueuedOutbox(3)).map((row) => row.id)).toEqual(["bare", "after-bare"]);
    await Promise.all([queueOutbox(4, entry("p1")), queueOutbox(4, entry("p2")), queueOutbox(4, entry("p3"))]);
    expect(sortOutbox(await getQueuedOutbox(4)).map((row) => row.id)).toEqual(["p1", "p2", "p3"]);
  });
});
