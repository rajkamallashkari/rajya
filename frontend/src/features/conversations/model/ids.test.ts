import { describe, expect, it } from "vitest";
import { parseConversationId, newClientNonce } from "./ids";
import { formatThreadDate, sameCalendarDay } from "./dates";
import { JUMP_HALF_WINDOW, CLIENT_CACHE_SIZE, JUMP_WINDOW, MESSAGE_PAGE_SIZE } from "./settings";

describe("conversation ids and dates", () => {
  it("parses numeric ids and formats dates", () => {
    expect(parseConversationId("12")).toBe(12);
    expect(parseConversationId("ada")).toBeNull();
    expect(newClientNonce()).toMatch(
      /^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i,
    );
    expect(sameCalendarDay("2026-01-01T12:00:00.000Z", "2026-01-01T18:00:00.000Z")).toBe(true);
    expect(sameCalendarDay("2026-01-01T12:00:00.000Z", "2026-01-02T12:00:00.000Z")).toBe(false);
    expect(formatThreadDate("2026-01-01T12:00:00.000Z", "en")).toContain("2026");
    expect(MESSAGE_PAGE_SIZE).toBeGreaterThan(0);
    expect(JUMP_WINDOW).toBeGreaterThan(0);
    expect(CLIENT_CACHE_SIZE).toBeGreaterThan(0);
    expect(JUMP_HALF_WINDOW).toBeGreaterThan(0);
  });
});
