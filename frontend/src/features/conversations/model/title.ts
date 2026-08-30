import type { components } from "@/shared/lib/api/schema";

type Conversation = components["schemas"]["Conversation"];

export function conversationTitle(conversation: Conversation, untitled: string): string {
  if (conversation.title) {
    return conversation.title;
  }
  if (conversation.peer?.display_name) {
    return conversation.peer.display_name;
  }
  return untitled;
}

export function isGroupConversation(conversation: Conversation): boolean {
  return conversation.kind === "group" || conversation.kind === "channel";
}

export function isMuted(conversation: Conversation, now: Date = new Date()): boolean {
  if (!conversation.muted_until) {
    return false;
  }
  return new Date(conversation.muted_until) > now;
}
