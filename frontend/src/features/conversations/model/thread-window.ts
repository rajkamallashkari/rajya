import type { Message } from "@/features/conversations/api/http";
import type { GroupableMessage } from "@/features/messages/model/constants";
import { groupMessageRuns } from "@/features/messages/model/grouping";

const CALL_SYSTEM_EVENTS = new Set(["call_ended", "call_missed", "call_started"]);

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

export function toGroupable(
  message: Message,
  accountIds?: ReadonlySet<number>,
): GroupableMessage & { message: Message } {
  const metadata =
    message.metadata && typeof message.metadata === "object"
      ? (message.metadata as Record<string, unknown>)
      : {};
  const callInitiatorId = metadata.initiator_account_id;
  const callSenderId =
    CALL_SYSTEM_EVENTS.has(message.system_event ?? "") &&
    typeof callInitiatorId === "number" &&
    (!accountIds || accountIds.has(callInitiatorId))
      ? String(callInitiatorId)
      : null;
  return {
    createdAt: Date.parse(message.created_at),
    id: String(message.id),
    message,
    senderId:
      message.kind === "system"
        ? (callSenderId ?? `system:${String(message.id)}`)
        : String(message.sender?.id ?? 0),
  };
}

export function buildThreadWindow(
  messages: Message[],
  accountIds?: readonly number[],
): {
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
  const knownAccountIds = accountIds ? new Set(accountIds) : undefined;
  const merged = groups.map((group) => {
    const groupable = group.runs
      .flatMap((run) => run.messages)
      .map((message) => toGroupable(message, knownAccountIds));
    const runs = groupMessageRuns(groupable).map((run) => {
      const rows = run.messages as Array<GroupableMessage & { message: Message }>;
      const first = rows[0]!.message;
      return {
        id: String(first.id),
        kind: run.senderId.startsWith("system:") ? ("system" as const) : ("user" as const),
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
