import type { Conversation } from "@/features/conversations/api/http";
import type { ShellDestination } from "@/shared/lib/navigation/destinations";

export function mostRecentConversation(rows: Conversation[]): Conversation | undefined {
  let recent: Conversation | undefined;
  for (const row of rows) {
    if (!recent || row.last_activity_at > recent.last_activity_at) {
      recent = row;
    }
  }
  return recent;
}

export type DesktopChatHydration =
  | { kind: "ignore" }
  | { kind: "remember" }
  | { kind: "wait" }
  | { kind: "open"; conversation: Conversation | undefined };

export function desktopChatHydration({
  alreadyAttempted,
  destination,
  hasConversation,
  isError,
  isPending,
  layerCount,
  mobile,
  permalink,
  rows,
}: {
  alreadyAttempted: boolean;
  destination: ShellDestination;
  hasConversation: boolean;
  isError: boolean;
  isPending: boolean;
  layerCount: number;
  mobile: boolean;
  permalink: boolean;
  rows: Conversation[];
}): DesktopChatHydration {
  if (destination !== "chats" || mobile || permalink) {
    return { kind: "ignore" };
  }
  if (hasConversation) {
    return { kind: "remember" };
  }
  if (alreadyAttempted || layerCount > 0 || isPending) {
    return { kind: "wait" };
  }
  if (isError) {
    return { kind: "open", conversation: undefined };
  }
  return { kind: "open", conversation: mostRecentConversation(rows) };
}
