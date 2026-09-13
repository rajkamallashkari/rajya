import { DURATION_PAD, SECONDS_PER_MINUTE } from "@/features/composer/model/constants";
import {
  DEFAULT_DATE_TIME_PREFERENCES,
  formatPreferenceDateTime,
} from "@/shared/lib/date-time";

export type CallLogDirection = "incoming" | "outgoing";

export const CALL_LOG_STATUSES = ["active", "declined", "ended", "missed", "ringing"] as const;
export type CallLogStatus = (typeof CALL_LOG_STATUSES)[number];

export function callLogDirection(row: {
  initiator_account_id: number;
  viewerId: number;
}): CallLogDirection {
  return row.initiator_account_id === row.viewerId ? "outgoing" : "incoming";
}

export function callLogFailed(status: string): boolean {
  return status === "declined" || status === "missed";
}

export function isCallLogStatus(status: string): status is CallLogStatus {
  return (CALL_LOG_STATUSES as readonly string[]).includes(status);
}

export function callLogStatusKey(status: string): `calls.status_${CallLogStatus}` {
  return `calls.status_${isCallLogStatus(status) ? status : "ended"}`;
}

export function formatCallLogWhen(iso: string, locale: string): string {
  return formatPreferenceDateTime(iso, locale, DEFAULT_DATE_TIME_PREFERENCES);
}

export function formatCallDuration(seconds: number): string {
  const minutes = Math.floor(seconds / SECONDS_PER_MINUTE);
  const remainder = seconds % SECONDS_PER_MINUTE;
  return `${minutes.toString().padStart(DURATION_PAD, "0")}:${remainder.toString().padStart(DURATION_PAD, "0")}`;
}

export function callLogDetail(
  row: { status: string; duration_seconds?: number | null },
  translate: (key: string) => string,
): string {
  const seconds = row.duration_seconds;
  if (row.status === "ended" && seconds != null && seconds > 0) {
    return formatCallDuration(seconds);
  }
  return translate(callLogStatusKey(row.status));
}

export function callContactLayer(
  row: {
    conversation_id: number;
    conversation_kind: string;
    peer?: { id: number } | null;
  },
  viewerId: number,
): { accountId?: string; conversationId: string } {
  const conversationId = String(row.conversation_id);
  if (row.conversation_kind === "direct" && row.peer && row.peer.id !== viewerId) {
    return { accountId: String(row.peer.id), conversationId };
  }
  return { conversationId };
}
