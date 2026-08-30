export interface RealtimePayloads {
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
  sidebar_update: { conversation_id: number };
}

export const REALTIME_EVENT_TYPES = [
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
  "sidebar_update",
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
  sidebar_update: (data) => ({
    type: "sidebar_update",
    conversation_id: requireNumber(data, "conversation_id"),
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
