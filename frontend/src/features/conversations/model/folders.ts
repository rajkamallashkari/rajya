import type { Conversation, ConversationFolder } from "@/features/conversations/api/http";
import { isUnread } from "@/features/conversations/model/title";

export const FOLDER_TAB_PREFIX = "folder:";

export type FolderTab =
  | { kind: "all" }
  | { kind: "unread" }
  | { kind: "archived" }
  | { kind: "folder"; id: number };

export function folderTabValue(tab: FolderTab): string {
  return tab.kind === "folder" ? `${FOLDER_TAB_PREFIX}${String(tab.id)}` : tab.kind;
}

export function parseFolderTab(value: string): FolderTab {
  if (value === "all" || value === "unread" || value === "archived") {
    return { kind: value };
  }
  if (value.startsWith(FOLDER_TAB_PREFIX)) {
    const id = Number(value.slice(FOLDER_TAB_PREFIX.length));
    if (Number.isFinite(id)) {
      return { kind: "folder", id };
    }
  }
  return { kind: "all" };
}

export function visibleConversations(
  inbox: Conversation[],
  archived: Conversation[],
  folders: ConversationFolder[],
  tab: FolderTab,
): Conversation[] {
  if (tab.kind === "unread") {
    return inbox.filter((row) => isUnread(row));
  }
  if (tab.kind === "archived") {
    return archived;
  }
  if (tab.kind === "folder") {
    const ids = folders.find((folder) => folder.id === tab.id)?.conversation_ids ?? [];
    return inbox.filter((row) => ids.includes(row.id));
  }
  return inbox;
}

export function archivedUnreadCount(archived: Conversation[]): number {
  return archived.filter((row) => isUnread(row)).length;
}

export function moveFolderId(ids: number[], fromId: number, toId: number): number[] {
  const from = ids.indexOf(fromId);
  const to = ids.indexOf(toId);
  if (from < 0 || to < 0 || from === to) {
    return ids;
  }
  const next = [...ids];
  const [item] = next.splice(from, 1);
  next.splice(to, 0, item as number);
  return next;
}

export function folderIdsForConversation(
  folders: ConversationFolder[],
  conversationId: number,
): number[] {
  return folders
    .filter((folder) => folder.conversation_ids.includes(conversationId))
    .map((folder) => folder.id);
}
