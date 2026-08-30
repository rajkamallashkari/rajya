import { describe, expect, it } from "vitest";
import type { Conversation } from "@/features/conversations/api/http";
import {
  archivedUnreadCount,
  folderIdsForConversation,
  folderTabValue,
  moveFolderId,
  parseFolderTab,
  visibleConversations,
} from "./folders";

const inbox: Conversation[] = [
  {
    id: 1,
    kind: "direct",
    last_activity_at: "2026-01-01T12:00:00.000Z",
    unread_count: 2,
    members: [],
  },
  {
    id: 2,
    kind: "group",
    last_activity_at: "2026-01-01T12:00:00.000Z",
    unread_count: 0,
    members: [],
  },
];

const archived: Conversation[] = [
  {
    id: 3,
    kind: "direct",
    last_activity_at: "2026-01-01T12:00:00.000Z",
    unread_count: 1,
    archived_at: "2026-01-01T12:00:00.000Z",
    members: [],
  },
];

const folders = [{ id: 9, name: "Work", position: 0, conversation_ids: [2] }];

describe("folder tabs", () => {
  it("parses, filters, and reorders folder tabs", () => {
    expect(parseFolderTab("all")).toEqual({ kind: "all" });
    expect(parseFolderTab("unread")).toEqual({ kind: "unread" });
    expect(parseFolderTab("archived")).toEqual({ kind: "archived" });
    expect(parseFolderTab("folder:9")).toEqual({ kind: "folder", id: 9 });
    expect(parseFolderTab("folder:nope")).toEqual({ kind: "all" });
    expect(parseFolderTab("other")).toEqual({ kind: "all" });
    expect(folderTabValue({ kind: "all" })).toBe("all");
    expect(folderTabValue({ kind: "folder", id: 9 })).toBe("folder:9");
    expect(visibleConversations(inbox, archived, folders, { kind: "all" })).toEqual(inbox);
    expect(visibleConversations(inbox, archived, folders, { kind: "unread" }).map((row) => row.id)).toEqual([
      1,
    ]);
    expect(visibleConversations(inbox, archived, folders, { kind: "archived" })).toEqual(archived);
    expect(
      visibleConversations(inbox, archived, folders, { kind: "folder", id: 9 }).map((row) => row.id),
    ).toEqual([2]);
    expect(visibleConversations(inbox, archived, folders, { kind: "folder", id: 8 })).toEqual([]);
    expect(archivedUnreadCount(archived)).toBe(1);
    expect(archivedUnreadCount(inbox)).toBe(1);
    expect(folderIdsForConversation(folders, 2)).toEqual([9]);
    expect(folderIdsForConversation(folders, 1)).toEqual([]);
    expect(moveFolderId([1, 2, 3], 1, 3)).toEqual([2, 3, 1]);
    expect(moveFolderId([1, 2, 3], 1, 1)).toEqual([1, 2, 3]);
    expect(moveFolderId([1, 2, 3], 9, 2)).toEqual([1, 2, 3]);
    expect(moveFolderId([1, 2, 3], 1, 9)).toEqual([1, 2, 3]);
  });
});
