import { describe, expect, it, vi } from "vitest";
import {
  isOwnMswCallEvent,
  mswEventFromSignaling,
  publishMswSignaling,
} from "./msw-signaling";

describe("msw signaling helpers", () => {
  it("maps cable actions and skips heartbeat", () => {
    expect(mswEventFromSignaling("signal", { call_id: 1, type: "offer", payload: { sdp: "v=0" } }, 9)).toEqual({
      type: "offer",
      call_id: 1,
      from_account_id: 9,
      payload: { sdp: "v=0" },
    });
    expect(mswEventFromSignaling("mute_state", { call_id: 1, mic_on: true, cam_on: false }, 2)).toEqual({
      type: "mute_state",
      call_id: 1,
      account_id: 2,
      mic_on: true,
      cam_on: false,
    });
    expect(mswEventFromSignaling("join", { call_id: 4 }, 1)).toEqual({
      type: "user_joined",
      call_id: 4,
      account_id: 1,
    });
    expect(mswEventFromSignaling("leave", { call_id: 4 }, 1)).toEqual({
      type: "user_left",
      call_id: 4,
      account_id: 1,
    });
    expect(mswEventFromSignaling("busy", { call_id: 4 }, 1)).toEqual({
      type: "busy",
      call_id: 4,
      account_id: 1,
    });
    expect(mswEventFromSignaling("dismiss", { call_id: 4, reason: "answered_here" }, 1)).toEqual({
      type: "call_dismissed",
      call_id: 4,
      reason: "answered_here",
    });
    expect(mswEventFromSignaling("heartbeat", { call_id: 4 }, 1)).toBeNull();
    expect(mswEventFromSignaling("signal", { call_id: 1 }, 1)).toBeNull();
  });

  it("detects own call events so the publisher does not apply them", () => {
    expect(isOwnMswCallEvent(null, 1)).toBe(false);
    expect(isOwnMswCallEvent({ type: "offer" }, null)).toBe(false);
    expect(isOwnMswCallEvent("x", 1)).toBe(false);
    expect(isOwnMswCallEvent({ type: "offer", from_account_id: 1 }, 1)).toBe(true);
    expect(isOwnMswCallEvent({ type: "answer", from_account_id: 2 }, 1)).toBe(false);
    expect(isOwnMswCallEvent({ type: "ice_candidate", from_account_id: 1 }, 1)).toBe(true);
    expect(isOwnMswCallEvent({ type: "mute_state", account_id: 1 }, 1)).toBe(true);
    expect(isOwnMswCallEvent({ type: "user_joined", account_id: 2 }, 1)).toBe(false);
    expect(isOwnMswCallEvent({ type: "incoming_call", initiator_account_id: 1 }, 1)).toBe(true);
    expect(isOwnMswCallEvent({ type: "incoming_call", initiator_account_id: 2 }, 1)).toBe(false);
    expect(isOwnMswCallEvent({ type: 1 }, 1)).toBe(false);
  });

  it("publishes only when MSW is on", () => {
    const posted: unknown[] = [];
    vi.stubGlobal(
      "BroadcastChannel",
      class {
        public postMessage(data: unknown): void {
          posted.push(data);
        }
        public close(): void {
          return undefined;
        }
      },
    );
    publishMswSignaling("join", { call_id: 1 }, 3);
    expect(posted).toEqual([]);
    vi.stubEnv("VITE_MSW", "1");
    publishMswSignaling("join", { call_id: 1 }, 3);
    publishMswSignaling("heartbeat", { call_id: 1 }, 3);
    expect(posted).toEqual([{ type: "user_joined", call_id: 1, account_id: 3 }]);
    vi.unstubAllEnvs();
    vi.unstubAllGlobals();
  });
});
