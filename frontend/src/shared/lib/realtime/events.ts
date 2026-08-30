export interface RealtimePayloads {
  attachment_processed: { conversation_id: number; message_id: number; attachment_id: number };
  message_created: { conversation_id: number; message_id: number };
  message_deleted: { conversation_id: number; message_id: number };
  message_edited: { conversation_id: number; message_id: number };
  message_pinned: { conversation_id: number; message_id: number };
  message_reacted: { conversation_id: number; message_id: number };
  message_reminder: { id: number };
  message_unpinned: { conversation_id: number; message_id: number };
  phone_verified: { account_id?: number; phone?: string };
  poll_closed: { conversation_id: number; message_id: number };
  poll_voted: { conversation_id: number; message_id: number };
  presence: { account_id: number; online: boolean };
  receipts_updated: { conversation_id: number; account_id: number; kind: string; position: number };
  report_created: {
    report_id: number;
    subject_type: string;
    subject_id: number;
    reason: string;
    status: string;
    auto_flagged: boolean;
  };
  sidebar_update: { conversation_id: number };
  join_request: { conversation_id: number; join_request_id?: number; status: string };
  typing: {
    conversation_id: number;
    account_id: number;
    activity: string;
    display_name: string;
  };
}

export const REALTIME_EVENT_TYPES = [
  "attachment_processed",
  "message_created",
  "message_deleted",
  "message_edited",
  "message_pinned",
  "message_reacted",
  "message_reminder",
  "message_unpinned",
  "phone_verified",
  "poll_closed",
  "poll_voted",
  "presence",
  "receipts_updated",
  "report_created",
  "sidebar_update",
  "join_request",
  "typing",
] as const satisfies ReadonlyArray<keyof RealtimePayloads>;

type PayloadKey = keyof RealtimePayloads;
type ListedType = (typeof REALTIME_EVENT_TYPES)[number];
export type ExhaustiveEventList = [Exclude<PayloadKey, ListedType>, Exclude<ListedType, PayloadKey>] extends [
  never,
  never,
]
  ? true
  : false;

export const EVENT_UNION_IS_EXHAUSTIVE: ExhaustiveEventList = true;

export type RealtimeEvent = {
  [Type in ListedType]: { type: Type } & RealtimePayloads[Type];
}[ListedType];

function isRecord(value: unknown): value is Record<string, unknown> {
  return typeof value === "object" && value !== null && !Array.isArray(value);
}

function isEventType(value: string): value is ListedType {
  return (REALTIME_EVENT_TYPES as readonly string[]).includes(value);
}

function requireNumber(data: Record<string, unknown>, key: string): number {
  const value = data[key];
  if (typeof value !== "number" || !Number.isFinite(value)) {
    throw new Error(`invalid realtime event: ${key}`);
  }
  return value;
}

function optionalString(data: Record<string, unknown>, key: string): string | undefined {
  const value = data[key];
  return typeof value === "string" ? value : undefined;
}

function optionalNumber(data: Record<string, unknown>, key: string): number | undefined {
  const value = data[key];
  return typeof value === "number" && Number.isFinite(value) ? value : undefined;
}

function requireBoolean(data: Record<string, unknown>, key: string): boolean {
  const value = data[key];
  if (typeof value !== "boolean") {
    throw new Error(`invalid realtime event: ${key}`);
  }
  return value;
}

function parseMessageEvent<Type extends ListedType>(
  type: Type,
  data: Record<string, unknown>,
): { type: Type; conversation_id: number; message_id: number } {
  return {
    type,
    conversation_id: requireNumber(data, "conversation_id"),
    message_id: requireNumber(data, "message_id"),
  };
}

const PARSERS: { [Type in ListedType]: (data: Record<string, unknown>) => RealtimeEvent } = {
  attachment_processed: (data) => ({
    ...parseMessageEvent("attachment_processed", data),
    attachment_id: requireNumber(data, "attachment_id"),
  }),
  message_created: (data) => parseMessageEvent("message_created", data),
  message_deleted: (data) => parseMessageEvent("message_deleted", data),
  message_edited: (data) => parseMessageEvent("message_edited", data),
  message_pinned: (data) => parseMessageEvent("message_pinned", data),
  message_reacted: (data) => parseMessageEvent("message_reacted", data),
  message_reminder: (data) => ({ type: "message_reminder", id: requireNumber(data, "id") }),
  message_unpinned: (data) => parseMessageEvent("message_unpinned", data),
  phone_verified: (data) => ({
    type: "phone_verified",
    account_id: optionalNumber(data, "account_id"),
    phone: optionalString(data, "phone"),
  }),
  poll_closed: (data) => parseMessageEvent("poll_closed", data),
  poll_voted: (data) => parseMessageEvent("poll_voted", data),
  presence: (data) => {
    if (typeof data.online !== "boolean") {
      throw new Error("invalid realtime event: online");
    }
    return {
      type: "presence",
      account_id: requireNumber(data, "account_id"),
      online: data.online,
    };
  },
  receipts_updated: (data) => ({
    type: "receipts_updated",
    conversation_id: requireNumber(data, "conversation_id"),
    account_id: requireNumber(data, "account_id"),
    kind: optionalString(data, "kind") ?? "",
    position: requireNumber(data, "position"),
  }),
  report_created: (data) => ({
    type: "report_created",
    report_id: requireNumber(data, "report_id"),
    subject_type: optionalString(data, "subject_type") ?? "",
    subject_id: requireNumber(data, "subject_id"),
    reason: optionalString(data, "reason") ?? "",
    status: optionalString(data, "status") ?? "",
    auto_flagged: requireBoolean(data, "auto_flagged"),
  }),
  sidebar_update: (data) => ({
    type: "sidebar_update",
    conversation_id: requireNumber(data, "conversation_id"),
  }),
  join_request: (data) => ({
    type: "join_request",
    conversation_id: requireNumber(data, "conversation_id"),
    join_request_id: optionalNumber(data, "join_request_id"),
    status: optionalString(data, "status") ?? "",
  }),
  typing: (data) => ({
    type: "typing",
    conversation_id: requireNumber(data, "conversation_id"),
    account_id: requireNumber(data, "account_id"),
    activity: optionalString(data, "activity") ?? "typing",
    display_name: optionalString(data, "display_name") ?? "",
  }),
};

export function parseRealtimeEvent(data: unknown): RealtimeEvent {
  if (!isRecord(data) || typeof data.type !== "string") {
    throw new Error("invalid realtime event");
  }
  if (!isEventType(data.type)) {
    throw new Error(`unhandled realtime event: ${data.type}`);
  }
  return PARSERS[data.type](data);
}
