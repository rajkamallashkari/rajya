import type { CallUiStatus } from "@/features/calls/store/call-store";

export function isLiveCallStatus(status: CallUiStatus): boolean {
  return status === "ringing-outgoing" || status === "connecting" || status === "active";
}
