import { describe, expect, it } from "vitest";
import type { Message } from "@/features/conversations/api/http";
import { THREAD_PERF_VOLUME } from "@/features/conversations/model/constants";
import {
  buildThreadWindow,
  countNewerArrivals,
  messageDayKey,
  nextPendingCount,
  restoreAnchorIndex,
  shouldShowJumpPill,
  toGroupable,
} from "./thread-window";

function message(id: number, extras: Partial<Message> = {}): Message {
  const day = extras.created_at ?? "2026-01-01T12:00:00.000Z";
  return {
    attachments: [],
    body: `m${String(id)}`,
    client_nonce: null,
    created_at: day,
    deleted: false,
    edited_at: null,
    id,
    kind: "text",
    position: id,
    reply_to_message_id: null,
    revision: 1,
    sender: { display_name: "Ada", id: 1, kind: "human", username: "ada" },
    silent: false,
    ...extras,
  } as Message;
}

function call(id: number, initiatorId: number | null = 1, extras: Partial<Message> = {}): Message {
  return message(id, {
    kind: "system",
    metadata: {
      call_id: id,
      initiator_account_id: initiatorId,
      status: "ended",
    } as unknown as Message["metadata"],
    sender: undefined,
    system_event: "call_ended",
    ...extras,
  });
}

describe("thread window", () => {
  it("groups by calendar day and sender runs", () => {
    const messages = [
      message(1, { created_at: "2026-01-01T10:00:00.000Z" }),
      message(2, { created_at: "2026-01-01T10:01:00.000Z" }),
      message(3, {
        created_at: "2026-01-02T10:00:00.000Z",
        sender: { display_name: "Priya", id: 2, kind: "human", username: "priya" },
      }),
      message(4, {
        created_at: "2026-01-02T10:00:01.000Z",
        kind: "system",
        sender: undefined,
      }),
    ];
    const window = buildThreadWindow(messages);
    expect(window.groups).toHaveLength(2);
    expect(window.groupCounts).toEqual([1, 2]);
    expect(window.runs[0]?.messages).toHaveLength(2);
    expect(window.runs[1]?.kind).toBe("user");
    expect(window.runs[2]?.kind).toBe("system");
    expect(toGroupable(messages[3]!).senderId).toBe("system:4");
    expect(messageDayKey("2026-01-01T23:00:00.000Z")).toContain("2026");
  });

  it("counts arrivals below the previous max and restores prepend anchors", () => {
    expect(countNewerArrivals(0, [message(2)])).toBe(0);
    expect(countNewerArrivals(2, [message(2), message(3), message(4)])).toBe(2);
    expect(restoreAnchorIndex(4, 10)).toBe(14);
    expect(shouldShowJumpPill(true, 3)).toBe(false);
    expect(shouldShowJumpPill(false, 0)).toBe(false);
    expect(shouldShowJumpPill(false, 2)).toBe(true);
    expect(nextPendingCount(true, 2, [message(3)], 4)).toBe(0);
    expect(nextPendingCount(false, 2, [message(3)], 1)).toBe(2);
  });

  it("uses the account grouping key for calls with a resolvable initiator", () => {
    const accountIds = new Set([1, 2]);
    expect(toGroupable(message(1)).senderId).toBe("1");
    expect(toGroupable(call(2), accountIds).senderId).toBe("1");
    expect(toGroupable(call(3, 2), accountIds).senderId).toBe("2");
    expect(toGroupable(call(4, 999), accountIds).senderId).toBe("system:4");
    expect(toGroupable(call(5)).senderId).toBe("1");
  });

  it("groups text-to-call and call-to-text adjacency for sent and received runs", () => {
    const received = { display_name: "Priya", id: 2, kind: "human", username: "priya" } as const;
    const rows = [
      message(1),
      call(2),
      call(3),
      message(4),
      call(5, 2),
      message(6, { sender: received }),
      call(7, 2),
    ];

    expect(
      buildThreadWindow(rows, [1, 2]).runs.map((run) => ({
        ids: run.messages.map((row) => row.id),
        kind: run.kind,
      })),
    ).toEqual([
      { ids: [1, 2, 3, 4], kind: "user" },
      { ids: [5, 6, 7], kind: "user" },
    ]);
  });

  it("keeps system, unresolved-call, time-window, sender, and day boundaries", () => {
    const nextDay = "2026-01-02T12:00:00.000Z";
    const rows = [
      message(1),
      message(2, { kind: "system", sender: undefined, system_event: "member_left" }),
      call(3),
      call(4, null),
      message(5),
      call(6, 2),
      message(7, { created_at: "2026-01-01T13:00:00.000Z" }),
      call(8, 1, { created_at: nextDay }),
      message(9, { created_at: nextDay }),
    ];

    expect(
      buildThreadWindow(rows, [1, 2]).runs.map((run) => run.messages.map((row) => row.id)),
    ).toEqual([[1], [2], [3], [4], [5], [6], [7], [8, 9]]);
    expect(toGroupable(call(10, null)).senderId).toBe("system:10");
  });

  it("builds a 10k-message window without quadratic grouping", () => {
    const messages = Array.from({ length: THREAD_PERF_VOLUME }, (_, index) =>
      message(index + 1, {
        created_at: `2026-01-${String((index % 28) + 1).padStart(2, "0")}T12:00:00.000Z`,
      }),
    );
    const started = performance.now();
    const window = buildThreadWindow(messages);
    expect(performance.now() - started).toBeLessThan(1_000);
    expect(window.runs.length).toBeGreaterThan(0);
    expect(window.groups.length).toBeGreaterThan(1);
    expect(window.groupCounts.reduce((sum, count) => sum + count, 0)).toBe(window.runs.length);
  });
});
