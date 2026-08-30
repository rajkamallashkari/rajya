import { describe, expect, it } from "vitest";
import {
  conversationTitle,
  isArchived,
  isGroupConversation,
  isMuted,
  isUnread,
} from "@/features/conversations/model/title";
import type { components } from "@/shared/lib/api/schema";
import { conversationPermissionDefaults } from "@/features/conversations/model/permissions";

const base: components["schemas"]["Conversation"] = {
  id: 1,
  kind: "direct",
  title: null,
  last_activity_at: "2026-01-01T12:00:00.000Z",
  unread_count: 0,
  members: [],
  ...conversationPermissionDefaults(),
};

describe("conversation title", () => {
  it("prefers title, then peer, then untitled", () => {
    expect(conversationTitle({ ...base, title: "Team" }, "Untitled")).toBe("Team");
    expect(
      conversationTitle(
        { ...base, peer: { id: 2, username: "ada", display_name: "Ada", kind: "human" } },
        "Untitled",
      ),
    ).toBe("Ada");
    expect(conversationTitle(base, "Untitled")).toBe("Untitled");
    expect(isGroupConversation({ ...base, kind: "group" })).toBe(true);
    expect(isGroupConversation({ ...base, kind: "channel" })).toBe(true);
    expect(isGroupConversation(base)).toBe(false);
    expect(isMuted(base)).toBe(false);
    expect(isMuted({ ...base, muted_until: "2099-01-01T00:00:00.000Z" })).toBe(true);
    expect(isMuted({ ...base, muted_until: "2000-01-01T00:00:00.000Z" })).toBe(false);
    expect(isArchived(base)).toBe(false);
    expect(isArchived({ ...base, archived_at: "2026-01-01T00:00:00.000Z" })).toBe(true);
    expect(isUnread(base)).toBe(false);
    expect(isUnread({ ...base, unread_count: 1 })).toBe(true);
    expect(isUnread({ ...base, manually_unread_at: "2026-01-01T00:00:00.000Z" })).toBe(true);
  });
});
