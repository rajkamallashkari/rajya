import { describe, expect, it } from "vitest";
import type { Conversation } from "@/features/conversations/api/http";
import { conversationPermissionDefaults } from "@/features/conversations/model/permissions";
import {
  desktopChatHydration,
  mostRecentConversation,
} from "@/features/conversations/model/recent";

function row(id: number, lastActivityAt: string): Conversation {
  return {
    id,
    kind: "direct",
    member_count: 2,
    last_activity_at: lastActivityAt,
    members: [],
    title: null,
    unread_count: 0,
    ...conversationPermissionDefaults(),
  };
}

describe("mostRecentConversation", () => {
  it("picks the newest activity and keeps the earlier row when timestamps tie", () => {
    expect(mostRecentConversation([])).toBeUndefined();
    const older = row(1, "2026-01-01T10:00:00.000Z");
    const newer = row(2, "2026-01-02T10:00:00.000Z");
    const tied = row(3, "2026-01-02T10:00:00.000Z");
    expect(mostRecentConversation([older, newer, tied])).toBe(newer);
    expect(mostRecentConversation([older, row(4, "2026-01-01T10:00:00.000Z")])).toBe(older);
  });
});

describe("desktopChatHydration", () => {
  const base = {
    alreadyAttempted: false,
    destination: "chats" as const,
    hasConversation: false,
    isError: false,
    isPending: false,
    layerCount: 0,
    mobile: false,
    permalink: false,
    rows: [row(1, "2026-01-01T10:00:00.000Z")],
  };

  it("ignores other destinations, mobile, and permalinks", () => {
    expect(desktopChatHydration({ ...base, destination: "calls" })).toEqual({ kind: "ignore" });
    expect(desktopChatHydration({ ...base, mobile: true })).toEqual({ kind: "ignore" });
    expect(desktopChatHydration({ ...base, permalink: true })).toEqual({ kind: "ignore" });
  });

  it("remembers an already open chat and waits while layers or the inbox are loading", () => {
    expect(desktopChatHydration({ ...base, hasConversation: true })).toEqual({ kind: "remember" });
    expect(desktopChatHydration({ ...base, alreadyAttempted: true })).toEqual({ kind: "wait" });
    expect(desktopChatHydration({ ...base, layerCount: 1 })).toEqual({ kind: "wait" });
    expect(desktopChatHydration({ ...base, isPending: true })).toEqual({ kind: "wait" });
  });

  it("opens the most recent chat or stays on the empty welcome", () => {
    expect(desktopChatHydration(base)).toEqual({ kind: "open", conversation: base.rows[0] });
    expect(desktopChatHydration({ ...base, isError: true })).toEqual({
      kind: "open",
      conversation: undefined,
    });
    expect(desktopChatHydration({ ...base, rows: [] })).toEqual({
      kind: "open",
      conversation: undefined,
    });
  });
});
