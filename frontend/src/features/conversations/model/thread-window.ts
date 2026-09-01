import type { Message } from "@/features/conversations/api/http";
import type { GroupableMessage } from "@/features/messages/model/constants";
import { groupMessageRuns } from "@/features/messages/model/grouping";

export interface ThreadRun {
  id: string;
  kind: "system" | "user";
  messages: Message[];
}

export interface ThreadDayGroup {
  dayKey: string;
  iso: string;
  runs: ThreadRun[];
}

export function messageDayKey(iso: string): string {
  const date = new Date(iso);
  return `${String(date.getFullYear())}-${String(date.getMonth())}-${String(date.getDate())}`;
}

export function toGroupable(message: Message): GroupableMessage & { message: Message } {
  return {
    createdAt: Date.parse(message.created_at),
    id: String(message.id),
    message,
    senderId:
      message.kind === "system" ? `system:${String(message.id)}` : String(message.sender?.id ?? 0),
  };
}

export function buildThreadWindow(messages: Message[]): {
  groups: ThreadDayGroup[];
  groupCounts: number[];
  runs: ThreadRun[];
} {
  const groups: ThreadDayGroup[] = [];
  for (const message of messages) {
    const dayKey = messageDayKey(message.created_at);
    const last = groups[groups.length - 1];
    if (!last || last.dayKey !== dayKey) {
      groups.push({ dayKey, iso: message.created_at, runs: [] });
    }
    groups[groups.length - 1]!.runs.push({
      id: String(message.id),
      kind: message.kind === "system" ? "system" : "user",
      messages: [message],
    });
  }
  const merged = groups.map((group) => {
    const groupable = group.runs.flatMap((run) => run.messages).map(toGroupable);
    const runs = groupMessageRuns(groupable).map((run) => {
      const rows = run.messages as Array<GroupableMessage & { message: Message }>;
      const first = rows[0]!.message;
      return {
        id: String(first.id),
        kind: first.kind === "system" ? ("system" as const) : ("user" as const),
        messages: rows.map((row) => row.message),
      };
    });
    return { ...group, runs };
  });
  return {
    groups: merged,
    groupCounts: merged.map((group) => group.runs.length),
    runs: merged.flatMap((group) => group.runs),
  };
}

export function countNewerArrivals(previousMaxPosition: number, messages: Message[]): number {
  if (previousMaxPosition <= 0) {
    return 0;
  }
  return messages.filter((message) => message.position > previousMaxPosition).length;
}

export function restoreAnchorIndex(startIndex: number, addedCount: number): number {
  return startIndex + addedCount;
}

export function shouldShowJumpPill(atBottom: boolean, pendingCount: number): boolean {
  return !atBottom && pendingCount > 0;
}

export function nextPendingCount(
  atBottom: boolean,
  previousMaxPosition: number,
  messages: Message[],
  currentPending: number,
): number {
  if (atBottom) {
    return 0;
  }
  return currentPending + countNewerArrivals(previousMaxPosition, messages);
}
