import { describe, expect, it } from "vitest";
import { tickStatus } from "./ticks";
import type { Message } from "@/features/conversations/api/http";

function message(extras: Partial<Message> = {}): Message {
  return {
    id: 1,
    conversation_id: 1,
    position: 1,
    revision: 1,
    kind: "text",
    body: "hi",
    deleted: false,
    silent: false,
    created_at: "2026-01-01T12:00:00.000Z",
    ...extras,
  };
}

describe("tickStatus", () => {
  it("maps queued, server ticks, and omits incoming state", () => {
    expect(tickStatus(message({ id: -1 }))).toBe("queued");
    expect(tickStatus(message({ tick: "sent" }))).toBe("sent");
    expect(tickStatus(message({ tick: "delivered" }))).toBe("delivered");
    expect(tickStatus(message({ tick: "read" }))).toBe("read");
    expect(tickStatus(message({ tick: null }))).toBeUndefined();
    expect(tickStatus(message())).toBeUndefined();
  });
});
