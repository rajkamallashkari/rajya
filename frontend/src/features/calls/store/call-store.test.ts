import { act, renderHook } from "@testing-library/react";
import { describe, expect, it } from "vitest";
import { SPEAKER_EARPIECE_VOLUME } from "@/features/calls/model/constants";
import { resetCallStore, useCallStore } from "./call-store";

describe("call store", () => {
  it("starts idle and runs the outgoing lifecycle", () => {
    const { result } = renderHook(() => useCallStore((state) => state));
    expect(result.current.status).toBe("idle");
    act(() => {
      result.current.setOutgoing({
        callId: 1,
        callType: "audio",
        conversationId: 2,
        iceServers: [{ urls: "stun:x" }],
        initiatorId: 9,
        participants: [],
      });
    });
    expect(result.current.status).toBe("ringing-outgoing");
    act(() => result.current.setConnecting());
    expect(result.current.status).toBe("connecting");
    act(() => result.current.setActive());
    expect(result.current.status).toBe("active");
    expect(result.current.startedAt).toBeTypeOf("number");
  });

  it("setIncoming maps initiator fields and clears a stuck banner", () => {
    const { result } = renderHook(() => useCallStore((state) => state));
    act(() => {
      result.current.setStuckCall({ id: 5, conversationId: 1, callType: "audio", status: "active" });
      result.current.setIncoming({
        type: "incoming_call",
        call_id: 7,
        conversation_id: 3,
        kind: "video",
        initiator_account_id: 2,
        initiator_display_name: "Alice",
        initiator_username: "alice",
      });
    });
    expect(result.current.status).toBe("ringing-incoming");
    expect(result.current.callId).toBe(7);
    expect(result.current.callType).toBe("video");
    expect(result.current.initiatorName).toBe("Alice");
    expect(result.current.initiatorUsername).toBe("alice");
    expect(result.current.stuckCall).toBeNull();
  });

  it("treats a non-video incoming kind as audio", () => {
    const { result } = renderHook(() => useCallStore((state) => state));
    act(() => {
      result.current.setIncoming({
        type: "incoming_call",
        call_id: 1,
        conversation_id: 1,
        kind: "audio",
        initiator_account_id: 2,
      });
    });
    expect(result.current.callType).toBe("audio");
  });

  it("tracks remote streams, media, speaking, and UI flags", () => {
    const { result } = renderHook(() => useCallStore((state) => state));
    const stream = { id: "remote" } as unknown as MediaStream;
    act(() => {
      result.current.setRemoteStream(42, stream);
      result.current.setRemoteMedia(7, { micOn: false, camOn: true });
      result.current.setSpeakingIds([7, 8]);
      result.current.setSpeakerOn(false);
      result.current.setIncomingSilenced(true);
      result.current.setPipSwapped(true);
      result.current.setFacingMode("environment");
      result.current.setMinimized(true);
      result.current.setActiveSpeaker(7);
      result.current.setIceServers([{ urls: "stun:x" }]);
    });
    expect(result.current.remoteStreams[42]).toBe(stream);
    act(() => result.current.setRemoteStream(42, null));
    expect(result.current.remoteStreams[42]).toBeUndefined();
    expect(result.current.remoteMedia[7]).toEqual({ micOn: false, camOn: true });
    expect(result.current.speakingIds).toEqual([7, 8]);
    expect(result.current.speakerOn).toBe(false);
    expect(result.current.speakerVolume).toBe(SPEAKER_EARPIECE_VOLUME);
    expect(result.current.incomingSilenced).toBe(true);
    expect(result.current.pipSwapped).toBe(true);
    expect(result.current.facingMode).toBe("environment");
    act(() => {
      result.current.setScreenSharing(true);
      result.current.setRemoteScreenStream(42, stream);
      result.current.updateScreenSharing(7, true);
    });
    expect(result.current.isScreenSharing).toBe(true);
    expect(result.current.remoteScreenStreams[42]).toBe(stream);
    act(() => result.current.setRemoteScreenStream(42, null));
    expect(result.current.remoteScreenStreams[42]).toBeUndefined();
    act(() => result.current.clearRemoteMedia(7));
    expect(result.current.remoteMedia[7]).toBeUndefined();
  });

  it("reset preserves error, stuckCall, and speaker preference", () => {
    const { result } = renderHook(() => useCallStore((state) => state));
    act(() => {
      result.current.setStuckCall({ id: 5, conversationId: 1, callType: "audio", status: "active" });
      result.current.setError("Something went wrong");
      result.current.setSpeakerOn(false);
      result.current.setRemoteMedia(1, { micOn: true, camOn: false });
      result.current.setSpeakingIds([1]);
      result.current.setPipSwapped(true);
      result.current.setIncomingSilenced(true);
      result.current.reset();
    });
    expect(result.current.status).toBe("idle");
    expect(result.current.error).toBe("Something went wrong");
    expect(result.current.stuckCall).toEqual({
      id: 5,
      conversationId: 1,
      callType: "audio",
      status: "active",
    });
    expect(result.current.remoteMedia).toEqual({});
    expect(result.current.speakingIds).toEqual([]);
    expect(result.current.pipSwapped).toBe(false);
    expect(result.current.incomingSilenced).toBe(false);
    expect(result.current.speakerOn).toBe(false);
  });

  it("preview and silence flags are mutually exclusive", () => {
    const { result } = renderHook(() => useCallStore((state) => state));
    act(() => result.current.setIncomingPreview(true));
    expect(result.current.incomingPreview).toBe(true);
    act(() => result.current.setIncomingPreview(false));
    expect(result.current.incomingPreview).toBe(false);
    act(() => result.current.setIncomingSilenced(true));
    expect(result.current.incomingPreview).toBe(false);
    act(() => result.current.setIncomingPreview(true));
    expect(result.current.incomingSilenced).toBe(false);
  });

  it("clamps speaker volume and updates participant status", () => {
    const { result } = renderHook(() => useCallStore((state) => state));
    act(() => {
      result.current.setOutgoing({
        callId: 1,
        callType: "video",
        conversationId: 2,
        iceServers: [],
        initiatorId: 1,
        participants: [{ id: 1, account_id: 9, status: "ringing", is_screen_sharing: false }],
      });
      result.current.setSpeakerVolume(2);
      result.current.updateParticipantStatus(9, "joined");
      result.current.updateScreenSharing(9, true);
      result.current.setLocalStream(null);
    });
    expect(result.current.speakerVolume).toBe(1);
    expect(result.current.participants[0]?.status).toBe("joined");
    expect(result.current.participants[0]?.is_screen_sharing).toBe(true);
    act(() => result.current.setSpeakerVolume(-1));
    expect(result.current.speakerVolume).toBe(0);
    act(() => {
      result.current.setSpeakerOn(true);
      result.current.updateParticipantStatus(404, "left");
      result.current.updateScreenSharing(404, true);
      result.current.setIncomingSilenced(false);
    });
    expect(result.current.speakerOn).toBe(true);
    expect(result.current.participants[0]?.status).toBe("joined");
  });

  it("resetCallStore restores idle data", () => {
    useCallStore.getState().setError("x");
    resetCallStore();
    expect(useCallStore.getState().error).toBeNull();
    expect(useCallStore.getState().status).toBe("idle");
  });
});
