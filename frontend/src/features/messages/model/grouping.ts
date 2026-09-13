import type { BubbleRole, GroupableMessage, MessageRun } from "./constants";

export function isWithinGroupWindow(
  current: GroupableMessage,
  other: GroupableMessage | null | undefined,
): boolean {
  if (!other) {
    return false;
  }
  return current.senderId === other.senderId;
}

export function groupMessageRuns(messages: GroupableMessage[]): MessageRun[] {
  const runs: MessageRun[] = [];
  for (const message of messages) {
    const last = runs[runs.length - 1];
    const previous = last?.messages[last.messages.length - 1];
    if (last && message.senderId === previous?.senderId) {
      last.messages.push(message);
    } else {
      runs.push({ senderId: message.senderId, messages: [message] });
    }
  }
  return runs;
}

export function bubbleRole(index: number, count: number): BubbleRole {
  if (count <= 1) {
    return "single";
  }
  if (index <= 0) {
    return "first";
  }
  if (index >= count - 1) {
    return "last";
  }
  return "middle";
}

export function showsTail(role: BubbleRole): boolean {
  return role === "single" || role === "last";
}

export function showsTimestampByDefault(role: BubbleRole): boolean {
  return showsTail(role);
}
