import { describe, expect, it } from "vitest";
import { EVENT_UNION_IS_EXHAUSTIVE, REALTIME_EVENT_TYPES, parseRealtimeEvent } from "./events";

describe("realtime events", () => {
  it("keeps the router union exhaustive over every backend event", () => {
    expect(EVENT_UNION_IS_EXHAUSTIVE).toBe(true);
    expect(REALTIME_EVENT_TYPES).toContain("message_created");
  });

  it("parses each event type and rejects invalid envelopes", () => {
    expect(
      parseRealtimeEvent({ type: "message_created", conversation_id: 1, message_id: 2 }),
    ).toEqual({
      type: "message_created",
      conversation_id: 1,
      message_id: 2,
    });
    expect(
      parseRealtimeEvent({
        type: "attachment_processed",
        conversation_id: 1,
        message_id: 2,
        attachment_id: 9,
      }),
    ).toEqual({
      type: "attachment_processed",
      conversation_id: 1,
      message_id: 2,
      attachment_id: 9,
    });
    expect(parseRealtimeEvent({ type: "sidebar_update", conversation_id: 3 })).toEqual({
      type: "sidebar_update",
      conversation_id: 3,
    });
    expect(parseRealtimeEvent({ type: "presence", account_id: 4, online: true })).toEqual({
      type: "presence",
      account_id: 4,
      online: true,
    });
    expect(
      parseRealtimeEvent({
        type: "receipts_updated",
        conversation_id: 1,
        account_id: 2,
        kind: "read",
        position: 3,
      }),
    ).toEqual({
      type: "receipts_updated",
      conversation_id: 1,
      account_id: 2,
      kind: "read",
      position: 3,
    });
    expect(
      parseRealtimeEvent({
        type: "receipts_updated",
        conversation_id: 1,
        account_id: 2,
        position: 3,
      }),
    ).toEqual({
      type: "receipts_updated",
      conversation_id: 1,
      account_id: 2,
      kind: "",
      position: 3,
    });
    expect(
      parseRealtimeEvent({
        type: "join_request",
        conversation_id: 4,
        join_request_id: 5,
        status: "pending",
      }),
    ).toEqual({
      type: "join_request",
      conversation_id: 4,
      join_request_id: 5,
      status: "pending",
    });
    expect(parseRealtimeEvent({ type: "join_request", conversation_id: 4 })).toEqual({
      type: "join_request",
      conversation_id: 4,
      status: "",
    });
    expect(parseRealtimeEvent({ type: "phone_verified", account_id: 5, phone: "+1" })).toEqual({
      type: "phone_verified",
      account_id: 5,
      phone: "+1",
    });
    expect(parseRealtimeEvent({ type: "phone_verified" })).toEqual({ type: "phone_verified" });
    expect(parseRealtimeEvent({ type: "message_reminder", id: 9 })).toEqual({
      type: "message_reminder",
      id: 9,
    });
    expect(
      parseRealtimeEvent({
        type: "report_created",
        report_id: 3,
        subject_type: "account",
        subject_id: 8,
        reason: "spam",
        status: "pending",
        auto_flagged: true,
      }),
    ).toEqual({
      type: "report_created",
      report_id: 3,
      subject_type: "account",
      subject_id: 8,
      reason: "spam",
      status: "pending",
      auto_flagged: true,
    });
    expect(
      parseRealtimeEvent({
        type: "typing",
        conversation_id: 1,
        account_id: 2,
        activity: "recording_audio",
        display_name: "Priya",
      }),
    ).toEqual({
      type: "typing",
      conversation_id: 1,
      account_id: 2,
      activity: "recording_audio",
      display_name: "Priya",
    });
    expect(parseRealtimeEvent({ type: "typing", conversation_id: 1, account_id: 2 })).toEqual({
      type: "typing",
      conversation_id: 1,
      account_id: 2,
      activity: "typing",
      display_name: "",
    });
    expect(
      parseRealtimeEvent({
        type: "generation_started",
        conversation_id: 1,
        generation_id: "g-1",
        bot_account_id: 9,
        triggered_by_message_id: 4,
      }),
    ).toEqual({
      type: "generation_started",
      conversation_id: 1,
      generation_id: "g-1",
      bot_account_id: 9,
      triggered_by_message_id: 4,
    });
    expect(
      parseRealtimeEvent({
        type: "generation_chunk",
        conversation_id: 1,
        generation_id: "g-1",
        delta: "Hi",
      }),
    ).toEqual({
      type: "generation_chunk",
      conversation_id: 1,
      generation_id: "g-1",
      delta: "Hi",
    });
    expect(
      parseRealtimeEvent({
        type: "generation_cancelled",
        conversation_id: 1,
        generation_id: "g-1",
        error: "upstream",
      }),
    ).toEqual({
      type: "generation_cancelled",
      conversation_id: 1,
      generation_id: "g-1",
      error: "upstream",
    });
    expect(
      parseRealtimeEvent({
        type: "generation_cancelled",
        conversation_id: 1,
        generation_id: "g-1",
      }),
    ).toEqual({
      type: "generation_cancelled",
      conversation_id: 1,
      generation_id: "g-1",
    });
    for (const type of [
      "message_deleted",
      "message_edited",
      "message_pinned",
      "message_reacted",
      "message_unpinned",
      "poll_closed",
      "poll_voted",
    ] as const) {
      expect(parseRealtimeEvent({ type, conversation_id: 1, message_id: 2 }).type).toBe(type);
    }
    expect(() => parseRealtimeEvent(null)).toThrow("invalid realtime event");
    expect(() => parseRealtimeEvent([])).toThrow("invalid realtime event");
    expect(() => parseRealtimeEvent({ type: 1 })).toThrow("invalid realtime event");
    expect(() => parseRealtimeEvent({ type: "nope" })).toThrow("unhandled realtime event: nope");
    expect(() => parseRealtimeEvent({ type: "message_created" })).toThrow("conversation_id");
    expect(() =>
      parseRealtimeEvent({ type: "message_created", conversation_id: Number.NaN, message_id: 1 }),
    ).toThrow("conversation_id");
    expect(() => parseRealtimeEvent({ type: "presence", account_id: 1 })).toThrow("online");
    expect(() => parseRealtimeEvent({ type: "message_reminder", id: "x" })).toThrow("id");
    expect(() =>
      parseRealtimeEvent({
        type: "generation_chunk",
        conversation_id: 1,
        generation_id: 1,
        delta: "x",
      }),
    ).toThrow("generation_id");
    expect(() =>
      parseRealtimeEvent({ type: "generation_chunk", conversation_id: 1, generation_id: "g-1" }),
    ).toThrow("delta");
    expect(() =>
      parseRealtimeEvent({
        type: "report_created",
        report_id: 1,
        subject_id: 2,
        auto_flagged: "yes",
      }),
    ).toThrow("auto_flagged");
    expect(parseRealtimeEvent({ type: "phone_verified", account_id: "x", phone: 1 })).toEqual({
      type: "phone_verified",
    });
    expect(parseRealtimeEvent({ type: "phone_verified", account_id: Number.NaN })).toEqual({
      type: "phone_verified",
    });
  });
});
