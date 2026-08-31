import { shouldStartMsw } from "@/shared/lib/api/msw/flag";
import { publishMswRealtime } from "@/shared/lib/realtime/msw-bridge";

const OWN_FROM_TYPES = new Set(["answer", "ice_candidate", "offer"]);
const OWN_ACCOUNT_TYPES = new Set([
  "busy",
  "call_accepted",
  "call_cancelled",
  "call_declined",
  "call_ended",
  "mute_state",
  "screen_share",
  "user_joined",
  "user_left",
]);

export function isOwnMswCallEvent(data: unknown, accountId: number | null): boolean {
  if (accountId == null || typeof data !== "object" || data === null) {
    return false;
  }
  const row = data as Record<string, unknown>;
  const type = typeof row.type === "string" ? row.type : "";
  if (OWN_FROM_TYPES.has(type)) {
    return row.from_account_id === accountId;
  }
  if (OWN_ACCOUNT_TYPES.has(type)) {
    return row.account_id === accountId;
  }
  if (type === "incoming_call") {
    return row.initiator_account_id === accountId;
  }
  return false;
}

export function mswEventFromSignaling(
  action: string,
  data: Record<string, unknown>,
  accountId: number,
): Record<string, unknown> | null {
  const callId = data.call_id;
  if (action === "signal" && typeof data.type === "string") {
    return {
      type: data.type,
      call_id: callId,
      from_account_id: accountId,
      payload: data.payload,
    };
  }
  if (action === "mute_state") {
    return {
      type: "mute_state",
      call_id: callId,
      account_id: accountId,
      mic_on: data.mic_on === true,
      cam_on: data.cam_on === true,
    };
  }
  if (action === "join") {
    return { type: "user_joined", call_id: callId, account_id: accountId };
  }
  if (action === "leave") {
    return { type: "user_left", call_id: callId, account_id: accountId };
  }
  if (action === "busy") {
    return { type: "busy", call_id: callId, account_id: accountId };
  }
  if (action === "dismiss") {
    return { type: "call_dismissed", call_id: callId, reason: data.reason };
  }
  return null;
}

export function publishMswSignaling(
  action: string,
  data: Record<string, unknown>,
  accountId: number,
): void {
  if (!shouldStartMsw(import.meta.env.VITE_MSW)) {
    return;
  }
  const event = mswEventFromSignaling(action, data, accountId);
  if (event) {
    publishMswRealtime(event);
  }
}
