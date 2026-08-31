import { apiClient, bearerHeaders, unwrap } from "@/features/auth/api/http";
import { getAccessSession } from "@/features/auth/model/access-session";
import type { components } from "@/shared/lib/api/schema";

export type Call = components["schemas"]["Call"];
export type CallEnvelope = components["schemas"]["CallEnvelope"];
export type CallKind = "audio" | "video";
export type CallParticipant = components["schemas"]["CallParticipant"];
export type IceServers = components["schemas"]["IceServers"];

export async function createCall(conversationId: number, kind: CallKind) {
  return unwrap(
    await apiClient().POST("/api/v1/calls", {
      headers: bearerHeaders(),
      body: { conversation_id: conversationId, kind },
    }),
    "call_create_failed",
  );
}

export async function getActiveCall() {
  return unwrap(
    await apiClient().GET("/api/v1/calls/active", { headers: bearerHeaders() }),
    "call_active_failed",
  );
}

export async function acceptCallRequest(id: number) {
  return unwrap(
    await apiClient().POST("/api/v1/calls/{id}/accept", {
      headers: bearerHeaders(),
      params: { path: { id } },
    }),
    "call_accept_failed",
  );
}

export async function declineCallRequest(id: number) {
  return unwrap(
    await apiClient().POST("/api/v1/calls/{id}/decline", {
      headers: bearerHeaders(),
      params: { path: { id } },
    }),
    "call_decline_failed",
  );
}

export async function cancelCallRequest(id: number) {
  return unwrap(
    await apiClient().POST("/api/v1/calls/{id}/cancel", {
      headers: bearerHeaders(),
      params: { path: { id } },
    }),
    "call_cancel_failed",
  );
}

export async function hangupCallRequest(id: number) {
  return unwrap(
    await apiClient().POST("/api/v1/calls/{id}/hangup", {
      headers: bearerHeaders(),
      params: { path: { id } },
    }),
    "call_hangup_failed",
  );
}

export async function setScreenSharingRequest(id: number, sharing: boolean) {
  return unwrap(
    await apiClient().POST("/api/v1/calls/{id}/screen_share", {
      headers: bearerHeaders(),
      params: { path: { id } },
      body: { sharing },
    }),
    "call_screen_share_failed",
  );
}

export type UnloadCallAction = "cancel" | "decline" | "hangup";

export function endCallOnUnload(callId: number, action: UnloadCallAction): void {
  const token = getAccessSession()?.token;
  try {
    void fetch(`${window.location.origin}/api/v1/calls/${String(callId)}/${action}`, {
      method: "POST",
      headers: {
        ...(token ? { Authorization: `Bearer ${token}` } : {}),
        "Content-Type": "application/json",
      },
      keepalive: true,
    });
  } catch {
    return;
  }
}
