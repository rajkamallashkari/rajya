import { describe, expect, it } from "vitest";
import {
  callContactLayer,
  callLogDetail,
  callLogDirection,
  callLogFailed,
  callLogStatusKey,
  formatCallDuration,
  formatCallLogWhen,
} from "./log";

describe("call log model", () => {
  it("labels direction with arrows separately from missed or declined", () => {
    expect(callLogDirection({ initiator_account_id: 1, viewerId: 1 })).toBe("outgoing");
    expect(callLogDirection({ initiator_account_id: 2, viewerId: 1 })).toBe("incoming");
    expect(callLogFailed("missed")).toBe(true);
    expect(callLogFailed("declined")).toBe(true);
    expect(callLogFailed("ended")).toBe(false);
    expect(callLogStatusKey("declined")).toBe("calls.status_declined");
    expect(callLogStatusKey("unknown")).toBe("calls.status_ended");
  });

  it("formats datetime, duration, and status copy", () => {
    expect(formatCallDuration(72)).toBe("01:12");
    expect(formatCallLogWhen("2026-01-01T12:00:00.000Z", "en-GB")).toMatch(/1 Jan 2026/);
    expect(callLogDetail({ status: "ended", duration_seconds: 72 }, (key) => key)).toBe("01:12");
    expect(callLogDetail({ status: "ended", duration_seconds: 0 }, (key) => key)).toBe(
      "calls.status_ended",
    );
    expect(callLogDetail({ status: "missed" }, (key) => key)).toBe("calls.status_missed");
  });

  it("opens a peer layer for a DM and a group conversation layer otherwise", () => {
    expect(
      callContactLayer({ conversation_id: 9, conversation_kind: "direct", peer: { id: 4 } }, 1),
    ).toEqual({ accountId: "4", conversationId: "9" });
    expect(
      callContactLayer({ conversation_id: 9, conversation_kind: "direct", peer: { id: 1 } }, 1),
    ).toEqual({ conversationId: "9" });
    expect(callContactLayer({ conversation_id: 3, conversation_kind: "group" }, 1)).toEqual({
      conversationId: "3",
    });
  });
});
