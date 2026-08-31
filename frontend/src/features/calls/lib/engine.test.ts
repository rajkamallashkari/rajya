import { beforeEach, describe, expect, it, vi } from "vitest";
import { ICE_RESTART_MAX_ATTEMPTS, SPEAKER_POLL_MS, VOLUME_PROBE_DEFAULT } from "@/features/calls/model/constants";
import { resetCallStore, useCallStore } from "@/features/calls/store/call-store";
import { i18n } from "@/shared/lib/i18n";

const {
  mockAccept,
  mockCancel,
  mockCreate,
  mockDecline,
  mockGetActive,
  mockHangup,
  mockScreenShare,
  mockUnload,
} = vi.hoisted(() => ({
  mockAccept: vi.fn(),
  mockCancel: vi.fn(),
  mockCreate: vi.fn(),
  mockDecline: vi.fn(),
  mockGetActive: vi.fn(),
  mockHangup: vi.fn(),
  mockScreenShare: vi.fn(),
  mockUnload: vi.fn(),
}));

vi.mock("@/features/calls/api/http", () => ({
  acceptCallRequest: mockAccept,
  cancelCallRequest: mockCancel,
  createCall: mockCreate,
  declineCallRequest: mockDecline,
  endCallOnUnload: mockUnload,
  getActiveCall: mockGetActive,
  hangupCallRequest: mockHangup,
  setScreenSharingRequest: mockScreenShare,
}));

const volumeDescriptor = Object.getOwnPropertyDescriptor(HTMLMediaElement.prototype, "volume");
const createElement = document.createElement.bind(document);

class FakePC {
  public static offers: unknown[] = [];
  public connectionState: RTCPeerConnectionState = "new";
  public iceConnectionState: RTCIceConnectionState = "new";
  public localDescription: RTCSessionDescriptionInit | null = null;
  public remoteDescription: RTCSessionDescriptionInit | null = null;
  public signalingState: RTCSignalingState = "stable";
  public addIceCandidate = vi.fn(async () => undefined);
  public senders: Array<{ track: MediaStreamTrack | null }> = [];
  public addTrack = vi.fn((track: MediaStreamTrack) => {
    const sender = { track };
    this.senders.push(sender);
    return sender;
  });
  public close = vi.fn();
  public createAnswer = vi.fn(async () => ({ type: "answer" as const, sdp: "v=0" }));
  public createOffer = vi.fn(async (opts?: RTCOfferOptions) => {
    FakePC.offers.push(opts);
    return { type: "offer" as const, sdp: "v=0" };
  });
  public getSenders = vi.fn(() => this.senders as RTCRtpSender[]);
  public removeTrack = vi.fn((sender: { track: MediaStreamTrack | null }) => {
    this.senders = this.senders.filter((row) => row !== sender);
  });
  public onconnectionstatechange: (() => void) | null = null;
  public onicecandidate: ((ev: RTCPeerConnectionIceEvent) => void) | null = null;
  public oniceconnectionstatechange: (() => void) | null = null;
  public onnegotiationneeded: (() => void) | null = null;
  public ontrack: ((ev: RTCTrackEvent) => void) | null = null;
  public setLocalDescription = vi.fn(async (desc: RTCSessionDescriptionInit) => {
    this.localDescription = desc;
  });
  public setRemoteDescription = vi.fn(async (desc: RTCSessionDescriptionInit) => {
    this.remoteDescription = desc;
    this.signalingState = "stable";
  });
}

function fakeStream(kind: "audio" | "video" | "both" = "audio"): MediaStream {
  const audio = { kind: "audio", enabled: true, stop: vi.fn() } as unknown as MediaStreamTrack;
  const video = { kind: "video", enabled: true, stop: vi.fn() } as unknown as MediaStreamTrack;
  const tracks = kind === "video" ? [video] : kind === "both" ? [audio, video] : [audio];
  return {
    id: `${kind}-${String(Math.random())}`,
    addTrack: vi.fn(),
    getAudioTracks: () => (kind === "video" ? [] : [audio]),
    getTracks: () => tracks,
    getVideoTracks: () => (kind === "audio" ? [] : [video]),
    removeTrack: vi.fn(),
  } as unknown as MediaStream;
}

function stubPeerConnection(): void {
  FakePC.offers = [];
  vi.stubGlobal("RTCPeerConnection", FakePC);
}

describe("webrtc engine", () => {
  beforeEach(async () => {
    resetCallStore();
    mockAccept.mockReset();
    mockCancel.mockReset();
    mockCreate.mockReset();
    mockDecline.mockReset();
    mockGetActive.mockReset();
    mockHangup.mockReset();
    mockScreenShare.mockReset();
    mockUnload.mockReset();
    stubPeerConnection();
    Object.defineProperty(navigator, "mediaDevices", {
      configurable: true,
      value: {
        enumerateDevices: vi.fn(async () => []),
        getDisplayMedia: vi.fn(async () => fakeStream("video")),
        getUserMedia: vi.fn(async () => fakeStream("both")),
      },
    });
    if (volumeDescriptor) {
      Object.defineProperty(HTMLMediaElement.prototype, "volume", volumeDescriptor);
    }
    document.createElement = createElement as typeof document.createElement;
    const { __test, setSignalingSender } = await import("./engine");
    __test.cleanupAllPeers();
    __test.stopLocalMedia();
    setSignalingSender(null);
  });

  it("queues ICE until the remote description is set (BR-69)", async () => {
    const { __test } = await import("./engine");
    useCallStore.setState({ callId: 99, iceServers: [{ urls: "stun:x" }] });
    __test.createPeerConnection(5);
    __test.getIceQueues()[5] = [
      { candidate: "a", sdpMid: "0" },
      { candidate: "b", sdpMid: "0" },
    ];
    expect(__test.getRemoteDescSet()[5]).toBe(false);
    const pc = __test.getPeerConnections()[5] as unknown as FakePC;
    await pc.setRemoteDescription({ type: "offer", sdp: "v=0" });
    __test.getRemoteDescSet()[5] = true;
    await __test.flushIceQueue(5);
    expect(__test.getIceQueues()[5]).toEqual([]);
    expect(pc.addIceCandidate).toHaveBeenCalledTimes(2);
    __test.cleanupAllPeers();
  });

  it("restarts ICE on failed iceconnectionstate and drops after the bound (F-32)", async () => {
    const { __test, setSignalingSender } = await import("./engine");
    const sent: Array<[string, Record<string, unknown>]> = [];
    setSignalingSender((action, data) => sent.push([action, data]));
    useCallStore.setState({ callId: 4, iceServers: [{ urls: "stun:x" }], status: "active" });
    mockHangup.mockResolvedValue({});
    __test.createPeerConnection(8);
    await __test.simulateIceState(8, "checking");
    await __test.simulateIceState(8, "failed");
    expect(FakePC.offers).toContainEqual({ iceRestart: true });
    expect(__test.getIceRestartAttempts()[8]).toBe(1);
    await __test.simulateIceState(8, "connected");
    expect(__test.getIceRestartAttempts()[8]).toBe(0);
    for (let i = 0; i < ICE_RESTART_MAX_ATTEMPTS; i += 1) {
      await __test.simulateIceState(8, "failed");
    }
    expect(__test.getIceRestartAttempts()[8]).toBe(ICE_RESTART_MAX_ATTEMPTS);
    await __test.simulateIceState(8, "failed");
    expect(mockHangup).toHaveBeenCalledWith(4);
    expect(useCallStore.getState().error).toBe(i18n.t("calls.errors.dropped"));
    expect(useCallStore.getState().status).toBe("idle");
    expect(sent.some((row) => row[0] === "leave")).toBe(true);
  });

  it("does not restart ICE while a restart is already in flight", async () => {
    const { __test } = await import("./engine");
    useCallStore.setState({ callId: 1, iceServers: [{ urls: "stun:x" }] });
    __test.createPeerConnection(3);
    FakePC.offers = [];
    __test.setIceRestarting(true);
    await __test.simulateIceState(3, "failed");
    expect(FakePC.offers).toEqual([]);
    __test.setIceRestarting(false);
    __test.cleanupAllPeers();
  });

  it("group video constraints stay at 480p / 20fps (BR-111)", async () => {
    const { __test } = await import("./engine");
    expect(__test.GROUP_VIDEO_CONSTRAINTS).toMatchObject({
      width: { ideal: 640, max: 640 },
      height: { ideal: 480, max: 480 },
      frameRate: { ideal: 20, max: 20 },
    });
  });

  it("maps start-call error codes and recovers stuck calls", async () => {
    const { startCall, checkForStuckCall, endStuckCall } = await import("./engine");
    mockCreate.mockRejectedValueOnce({ error: { code: "conflict", details: { reason: "already_in_call" } } });
    mockGetActive.mockResolvedValueOnce({
      call: { id: 11, conversation_id: 1, kind: "audio", status: "active", participants: [] },
    });
    await startCall(1, "audio", 42);
    expect(useCallStore.getState().error).toBe(i18n.t("calls.errors.already_in_call"));
    await Promise.resolve();
    expect(useCallStore.getState().stuckCall).toEqual({
      id: 11,
      conversationId: 1,
      callType: "audio",
      status: "active",
    });
    mockHangup.mockRejectedValueOnce(new Error("network"));
    await endStuckCall();
    expect(useCallStore.getState().stuckCall).toBeNull();
    mockGetActive.mockResolvedValueOnce({ call: null });
    await checkForStuckCall();
    expect(useCallStore.getState().stuckCall).toBeNull();
  });

  it("does not probe for a stuck call while one is live locally", async () => {
    const { checkForStuckCall } = await import("./engine");
    useCallStore.setState({ status: "active", callId: 42 });
    await checkForStuckCall();
    expect(mockGetActive).not.toHaveBeenCalled();
  });

  it("cancels a ringing stuck call", async () => {
    const { endStuckCall } = await import("./engine");
    useCallStore.getState().setStuckCall({ id: 9, conversationId: 1, callType: "audio", status: "ringing" });
    mockCancel.mockResolvedValueOnce({});
    await endStuckCall();
    expect(mockCancel).toHaveBeenCalledWith(9);
  });

  it("starts an outgoing call and tears down when everyone is busy", async () => {
    const { startCall } = await import("./engine");
    mockCreate.mockResolvedValueOnce({
      call: {
        id: 3,
        conversation_id: 8,
        initiator_account_id: 1,
        kind: "audio",
        status: "missed",
        participants: [
          { id: 1, account_id: 1, status: "joined" },
          { id: 2, account_id: 2, status: "busy" },
        ],
      },
      ice_servers: [{ urls: "stun:x" }],
    });
    await startCall(8, "audio", 1);
    expect(useCallStore.getState().status).toBe("idle");
  });

  it("cancels the server call when media permission is denied on start", async () => {
    const { startCall } = await import("./engine");
    mockCreate.mockResolvedValueOnce({
      call: {
        id: 2,
        conversation_id: 1,
        initiator_account_id: 1,
        kind: "video",
        status: "ringing",
        participants: [
          { id: 1, account_id: 1, status: "joined" },
          { id: 2, account_id: 2, status: "ringing" },
        ],
      },
      ice_servers: [],
    });
    (navigator.mediaDevices.getUserMedia as ReturnType<typeof vi.fn>).mockRejectedValueOnce(
      new DOMException("denied", "NotAllowedError"),
    );
    mockCancel.mockResolvedValue({});
    await startCall(1, "video", 1);
    expect(mockCancel).toHaveBeenCalledWith(2);
    expect(useCallStore.getState().error).toBe(i18n.t("calls.errors.permission"));
  });

  it("refuses a second local start", async () => {
    const { startCall } = await import("./engine");
    useCallStore.setState({ status: "active" });
    await startCall(1, "audio", 1);
    expect(useCallStore.getState().error).toBe(i18n.t("calls.errors.in_progress"));
  });

  it("handles signaling: incoming, busy, mute, join, leave, dismiss", async () => {
    const { handleSignalingMessage, setLocalAccountId, setSignalingSender, __test } = await import("./engine");
    const sent: Array<[string, Record<string, unknown>]> = [];
    setSignalingSender((action, data) => sent.push([action, data]));
    setLocalAccountId(1);
    await handleSignalingMessage({
      type: "incoming_call",
      call_id: 4,
      conversation_id: 2,
      kind: "audio",
      initiator_account_id: 1,
    });
    expect(useCallStore.getState().status).toBe("idle");
    useCallStore.setState({ callId: 5 });
    await handleSignalingMessage({
      type: "incoming_call",
      call_id: 5,
      conversation_id: 2,
      kind: "audio",
      initiator_account_id: 9,
    });
    expect(useCallStore.getState().status).toBe("idle");
    useCallStore.setState({ callId: null });
    await handleSignalingMessage({
      type: "incoming_call",
      call_id: 5,
      conversation_id: 2,
      kind: "audio",
      initiator_account_id: 9,
      initiator_display_name: "Bo",
    });
    expect(useCallStore.getState().status).toBe("ringing-incoming");
    await handleSignalingMessage({
      type: "incoming_call",
      call_id: 6,
      conversation_id: 2,
      kind: "audio",
      initiator_account_id: 8,
    });
    expect(sent).toContainEqual(["busy", { call_id: 6 }]);
    useCallStore.setState({ callId: 5, status: "active" });
    await handleSignalingMessage({
      type: "mute_state",
      call_id: 5,
      account_id: 9,
      mic_on: false,
      cam_on: true,
    });
    expect(useCallStore.getState().remoteMedia[9]).toEqual({ micOn: false, camOn: true });
    await handleSignalingMessage({ type: "user_joined", call_id: 5, account_id: 4 });
    expect(Object.keys(__test.getPeerConnections())).toContain("4");
    await handleSignalingMessage({ type: "user_left", call_id: 5, account_id: 4 });
    expect(__test.getPeerConnections()[4]).toBeUndefined();
    useCallStore.setState({ status: "ringing-incoming", callId: 5 });
    await handleSignalingMessage({ type: "call_dismissed", call_id: 5, reason: "answered_here" });
    expect(useCallStore.getState().status).toBe("idle");
  });

  it("accepts, rejects, cancels, and ends calls", async () => {
    const { acceptCall, rejectCall, cancelCall, endCall, setSignalingSender, __test } = await import(
      "./engine"
    );
    setSignalingSender(() => undefined);
    useCallStore.setState({
      callId: 7,
      callType: "audio",
      participants: [
        { id: 1, account_id: 1, status: "joined" },
        { id: 2, account_id: 2, status: "joined" },
      ],
      status: "ringing-incoming",
    });
    mockAccept.mockResolvedValueOnce({
      call: {
        participants: [
          { id: 1, account_id: 1, status: "joined" },
          { id: 2, account_id: 2, status: "joined" },
        ],
      },
      ice_servers: [{ urls: "stun:x" }],
    });
    __test.setLocalStreamForTest(null);
    await acceptCall();
    expect(mockAccept).toHaveBeenCalledWith(7);
    expect(useCallStore.getState().status).toBe("active");
    mockDecline.mockResolvedValueOnce({});
    useCallStore.setState({ callId: 8, status: "ringing-incoming" });
    await rejectCall();
    expect(mockDecline).toHaveBeenCalledWith(8);
    useCallStore.setState({ callId: 9, status: "ringing-outgoing" });
    mockCancel.mockResolvedValueOnce({});
    await cancelCall();
    expect(mockCancel).toHaveBeenCalledWith(9);
    useCallStore.setState({ callId: 10, status: "active" });
    mockHangup.mockResolvedValueOnce({});
    await endCall();
    expect(mockHangup).toHaveBeenCalledWith(10);
  });

  it("toggles mic and camera and broadcasts mute state", async () => {
    const { toggleMic, toggleCamera, setSignalingSender, __test } = await import("./engine");
    const sent: Array<[string, Record<string, unknown>]> = [];
    setSignalingSender((action, data) => sent.push([action, data]));
    const audio = { enabled: true, kind: "audio", stop: vi.fn() };
    const video = { enabled: true, kind: "video", stop: vi.fn() };
    __test.setLocalStreamForTest({
      getAudioTracks: () => [audio],
      getTracks: () => [audio, video],
      getVideoTracks: () => [video],
    } as unknown as MediaStream);
    useCallStore.setState({ callId: 5, status: "active", micOn: true, camOn: true });
    toggleMic();
    toggleCamera();
    expect(audio.enabled).toBe(false);
    expect(video.enabled).toBe(false);
    expect(sent.filter((row) => row[0] === "mute_state")).toHaveLength(2);
  });

  it("heartbeats while active and stops after hangup", async () => {
    vi.useFakeTimers();
    const { handleSignalingMessage, setSignalingSender, endCall, setLocalAccountId } = await import(
      "./engine"
    );
    const sent: Array<[string, Record<string, unknown>]> = [];
    setSignalingSender((action, data) => sent.push([action, data]));
    setLocalAccountId(1);
    useCallStore.setState({ callId: 3, status: "connecting", participants: [], iceServers: [{ urls: "stun:x" }] });
    await handleSignalingMessage({ type: "call_accepted", call_id: 3, account_id: 55 });
    await vi.advanceTimersByTimeAsync(20_000);
    expect(sent).toContainEqual(["heartbeat", { call_id: 3 }]);
    mockHangup.mockResolvedValueOnce({});
    await endCall();
    sent.length = 0;
    await vi.advanceTimersByTimeAsync(60_000);
    expect(sent).toEqual([]);
    vi.useRealTimers();
  });

  it("relays offer and answer payloads and ignores a colliding impolite offer", async () => {
    const { handleSignalingMessage, setLocalAccountId, setSignalingSender, __test } = await import(
      "./engine"
    );
    setSignalingSender(() => undefined);
    setLocalAccountId(1);
    useCallStore.setState({ callId: 1, iceServers: [{ urls: "stun:x" }] });
    await handleSignalingMessage({
      type: "offer",
      call_id: 1,
      from_account_id: 9,
      payload: { type: "offer", sdp: "v=0" },
    });
    expect(__test.getPeerConnections()[9]).toBeDefined();
    await handleSignalingMessage({
      type: "answer",
      call_id: 1,
      from_account_id: 9,
      payload: { type: "answer", sdp: "v=0" },
    });
    await handleSignalingMessage({
      type: "ice_candidate",
      call_id: 1,
      from_account_id: 9,
      payload: { candidate: "c", sdpMid: "0" },
    });
    await handleSignalingMessage({ type: "not-a-call" });
    await handleSignalingMessage({
      type: "call_ended",
      call_id: 1,
    });
  });

  it("best-effort unloads the live call on pagehide", async () => {
    await import("./engine");
    useCallStore.setState({ callId: 2, status: "ringing-outgoing" });
    window.dispatchEvent(new Event("pagehide"));
    expect(mockUnload).toHaveBeenCalledWith(2, "cancel");
    useCallStore.setState({ callId: 3, status: "ringing-incoming" });
    window.dispatchEvent(new Event("pagehide"));
    expect(mockUnload).toHaveBeenCalledWith(3, "decline");
    useCallStore.setState({ callId: 4, status: "active" });
    window.dispatchEvent(new Event("pagehide"));
    expect(mockUnload).toHaveBeenCalledWith(4, "hangup");
  });

  it("falls back to STUN when the store has no ICE servers", async () => {
    const { __test } = await import("./engine");
    useCallStore.setState({ callId: 1, iceServers: [] });
    const pc = __test.createPeerConnection(2);
    expect(pc).toBeInstanceOf(FakePC);
    __test.cleanupAllPeers();
  });

  it("stopLocalMedia stops tracks", async () => {
    const { __test } = await import("./engine");
    const stop = vi.fn();
    __test.setLocalStreamForTest({
      getTracks: () => [{ stop }, { stop }],
    } as unknown as MediaStream);
    __test.stopLocalMedia();
    expect(stop).toHaveBeenCalledTimes(2);
  });

  it("applies speaker volume to call audio elements", async () => {
    const { setSpeakerVolume, __test } = await import("./engine");
    const el = document.createElement("audio");
    el.setAttribute("data-call-audio", "");
    document.body.append(el);
    __test.resetVolumeWritable();
    setSpeakerVolume(0.2);
    expect(el.volume).toBeCloseTo(0.2);
    el.remove();
  });

  it("covers peer callbacks, speaker routing, flips, and remaining signaling edges", async () => {
    vi.useFakeTimers();
    const {
      __test,
      acceptCall,
      applyAudioOutputToElement,
      cancelCall,
      checkForStuckCall,
      endCall,
      endStuckCall,
      flipCamera,
      handleSignalingMessage,
      rejectCall,
      setLocalAccountId,
      setSignalingSender,
      startCall,
      switchAudioInput,
      switchAudioOutput,
      toggleSpeaker,
    } = await import("./engine");
    const sent: Array<[string, Record<string, unknown>]> = [];
    setSignalingSender((action, data) => sent.push([action, data]));
    setLocalAccountId(1);
    class FakeAudioContext {
      public destination = {};
      public createMediaStreamSource() {
        return { connect: vi.fn() };
      }
      public createAnalyser() {
        return {
          fftSize: 0,
          connect: vi.fn(),
          getByteFrequencyData: (data: Uint8Array) => {
            data.fill(80);
          },
        };
      }
      public createGain() {
        return { gain: { value: 1 }, disconnect: vi.fn(), connect: vi.fn() };
      }
      public close() {
        return Promise.resolve();
      }
    }
    vi.stubGlobal("AudioContext", FakeAudioContext);
    const audioEl = document.createElement("audio");
    audioEl.setAttribute("data-call-audio", "");
    Object.assign(audioEl, { setSinkId: vi.fn(async () => undefined) });
    document.body.append(audioEl);
    useCallStore.setState({
      callId: 12,
      callType: "video",
      camOn: true,
      iceServers: [{ urls: "stun:x" }],
      micOn: true,
      participants: [
        { id: 1, account_id: 1, status: "joined" },
        { id: 2, account_id: 2, status: "joined" },
        { id: 3, account_id: 3, status: "joined" },
      ],
      status: "active",
    });
    __test.setLocalStreamForTest(fakeStream("both"));
    const pc = __test.createPeerConnection(9) as unknown as FakePC;
    pc.onicecandidate?.({ candidate: null } as RTCPeerConnectionIceEvent);
    pc.onicecandidate?.({ candidate: { toJSON: () => ({ candidate: "x" }) } } as unknown as RTCPeerConnectionIceEvent);
    pc.ontrack?.({ streams: [fakeStream("audio")] } as unknown as RTCTrackEvent);
    pc.onnegotiationneeded?.();
    await vi.advanceTimersByTimeAsync(SPEAKER_POLL_MS);
    expect(useCallStore.getState().speakingIds.length).toBeGreaterThan(0);
    pc.connectionState = "closed";
    pc.onconnectionstatechange?.();
    __test.resetVolumeWritable();
    const origCreate = document.createElement.bind(document);
    document.createElement = ((tag: string) => {
      if (tag === "audio") {
        throw new Error("probe");
      }
      return origCreate(tag);
    }) as typeof document.createElement;
    expect(__test.detectVolumeWritable()).toBe(false);
    document.createElement = origCreate;
    __test.applySpeakerVolume(0.5);
    (navigator.mediaDevices.enumerateDevices as ReturnType<typeof vi.fn>).mockResolvedValueOnce([
      { deviceId: "spk", kind: "audiooutput", label: "Loudspeaker" },
      { deviceId: "ear", kind: "audiooutput", label: "Earpiece" },
    ]);
    await toggleSpeaker();
    await switchAudioOutput("spk");
    await applyAudioOutputToElement(audioEl);
    const sender = { replaceTrack: vi.fn(async () => undefined), track: { kind: "audio" } };
    const videoSender = { replaceTrack: vi.fn(async () => undefined), track: { kind: "video" } };
    __test.setLocalStreamForTest(fakeStream("both"));
    const live = __test.createPeerConnection(11) as unknown as FakePC;
    live.getSenders = vi.fn(() => [sender, videoSender] as unknown as RTCRtpSender[]);
    await switchAudioInput("mic-1");
    await flipCamera();
    expect(__test.callErrorMessage({ error: { details: { reason: "feature_disabled" } } })).toBe(
      i18n.t("calls.errors.feature_disabled"),
    );
    expect(__test.callErrorMessage(null)).toBe(i18n.t("calls.errors.start_failed"));
    mockCreate.mockResolvedValueOnce({ call: null });
    useCallStore.setState({ status: "idle", callId: null });
    await startCall(1, "audio", 1);
    mockGetActive.mockRejectedValueOnce(new Error("offline"));
    await checkForStuckCall();
    await endStuckCall();
    useCallStore.setState({ callId: null, status: "idle" });
    await acceptCall();
    await rejectCall();
    await cancelCall();
    await endCall();
    useCallStore.setState({ callId: 20, callType: "audio", participants: [], status: "ringing-incoming" });
    (navigator.mediaDevices.getUserMedia as ReturnType<typeof vi.fn>).mockRejectedValueOnce(new Error("device"));
    mockDecline.mockRejectedValueOnce(new Error("x"));
    await acceptCall();
    useCallStore.setState({ callId: 21, status: "ringing-incoming" });
    mockDecline.mockRejectedValueOnce(new Error("x"));
    await rejectCall();
    useCallStore.setState({ callId: 22, status: "ringing-outgoing" });
    mockCancel.mockRejectedValueOnce(new Error("x"));
    await cancelCall();
    useCallStore.setState({ callId: 23, status: "active" });
    mockHangup.mockRejectedValueOnce(new Error("x"));
    await endCall();
    setLocalAccountId(9);
    useCallStore.setState({ callId: 1, iceServers: [{ urls: "stun:x" }] });
    __test.createPeerConnection(2);
    const impolite = __test.getPeerConnections()[2] as unknown as FakePC;
    impolite.signalingState = "have-local-offer";
    await handleSignalingMessage({
      type: "offer",
      call_id: 1,
      from_account_id: 2,
      payload: { type: "offer", sdp: "v=0" },
    });
    await handleSignalingMessage({ type: "offer", call_id: 99, payload: { type: "offer", sdp: "v=0" } });
    await handleSignalingMessage({ type: "answer", call_id: 1, from_account_id: 77, payload: { type: "answer", sdp: "v=0" } });
    await handleSignalingMessage({ type: "ice_candidate", call_id: 1, from_account_id: 77, payload: { candidate: "z" } });
    live.addIceCandidate.mockRejectedValueOnce(new Error("late"));
    __test.getRemoteDescSet()[11] = true;
    await handleSignalingMessage({
      type: "ice_candidate",
      call_id: 12,
      from_account_id: 11,
      payload: { candidate: "late" },
    });
    useCallStore.setState({
      callId: 1,
      participants: [
        { id: 1, account_id: 1, status: "joined" },
        { id: 2, account_id: 2, status: "joined" },
      ],
      status: "active",
    });
    await handleSignalingMessage({ type: "call_declined", call_id: 1, account_id: 2 });
    useCallStore.setState({
      callId: 5,
      participants: [
        { id: 1, account_id: 1, status: "joined" },
        { id: 2, account_id: 2, status: "joined" },
        { id: 3, account_id: 3, status: "joined" },
      ],
      status: "active",
    });
    await handleSignalingMessage({ type: "busy", call_id: 5, account_id: 3 });
    expect(useCallStore.getState().status).toBe("active");
    await handleSignalingMessage({ type: "call_accepted", call_id: 0 });
    await handleSignalingMessage({ type: "user_joined", call_id: 0 });
    await handleSignalingMessage({ type: "user_left", call_id: 0 });
    await handleSignalingMessage({ type: "mute_state", call_id: 0, mic_on: true, cam_on: true });
    await handleSignalingMessage({ type: "call_cancelled", call_id: 0 });
    await handleSignalingMessage({ type: "message_created", conversation_id: 1, message_id: 1 });
    useCallStore.setState({ callId: 4, status: "connecting" });
    window.dispatchEvent(new Event("pagehide"));
    useCallStore.setState({ callId: null, status: "idle" });
    window.dispatchEvent(new Event("pagehide"));
    __test.createPeerConnection(44);
    (__test.getPeerConnections()[44] as unknown as FakePC).close = vi.fn(() => {
      throw new Error("close");
    });
    __test.cleanupAllPeers();
    setSignalingSender(() => {
      throw new Error("signal");
    });
    __test.broadcastMuteState();
    mockCreate.mockResolvedValueOnce({
      call: {
        id: 30,
        conversation_id: 1,
        initiator_account_id: 1,
        kind: "video",
        status: "ringing",
        participants: [
          { id: 1, account_id: 1, status: "joined" },
          { id: 2, account_id: 2, status: "ringing" },
          { id: 3, account_id: 3, status: "ringing" },
        ],
      },
      ice_servers: [{ urls: "stun:x" }],
    });
    useCallStore.setState({ status: "idle", callId: null });
    setSignalingSender((action, data) => sent.push([action, data]));
    await startCall(1, "video", 1);
    (navigator.mediaDevices.getUserMedia as ReturnType<typeof vi.fn>).mockResolvedValueOnce({
      getAudioTracks: () => [],
      getTracks: () => [],
      getVideoTracks: () => [],
    });
    await switchAudioInput("x");
    useCallStore.setState({ callType: "audio" });
    await flipCamera();
    (navigator.mediaDevices.getUserMedia as ReturnType<typeof vi.fn>).mockRejectedValueOnce(new Error("flip"));
    useCallStore.setState({ callType: "video" });
    __test.setLocalStreamForTest(fakeStream("both"));
    await flipCamera();
    __test.setIceRestartAttempts(1, 2);
    await __test.restartIce(99);
    await __test.simulateIceState(99, "failed");
    await __test.flushIceQueue(99);
    useCallStore.setState({ callId: 12, iceServers: [{ urls: "stun:x" }] });
    __test.createPeerConnection(13);
    const offerPc = __test.getPeerConnections()[13] as unknown as FakePC;
    offerPc.createOffer.mockRejectedValueOnce(new Error("offer"));
    await offerPc.onnegotiationneeded?.();
    audioEl.remove();
    vi.useRealTimers();
  });

  it("covers leftover early-returns and catch paths", async () => {
    const {
      __test,
      applyAudioOutputToElement,
      handleSignalingMessage,
      setLocalAccountId,
      setSignalingSender,
      startCall,
      switchAudioInput,
      switchAudioOutput,
      toggleSpeaker,
      flipCamera,
      acceptCall,
      endStuckCall,
    } = await import("./engine");
    setLocalAccountId(1);
    setSignalingSender(() => {
      throw new Error("boom");
    });
    useCallStore.setState({ callId: 1, camOn: true, micOn: true });
    __test.broadcastMuteState();
    setSignalingSender(() => undefined);
    expect(__test.callErrorMessage({ details: { reason: "invalid_call_type" } })).toBe(
      i18n.t("calls.errors.invalid_call_type"),
    );
    expect(__test.callErrorMessage({ error: { code: "insufficient_participants" } })).toBe(
      i18n.t("calls.errors.insufficient_participants"),
    );
    useCallStore.setState({ callId: 1, iceServers: [{ urls: "stun:x" }], status: "connecting" });
    await handleSignalingMessage({ type: "call_accepted", call_id: 1, account_id: 2 });
    await handleSignalingMessage({ type: "call_accepted", call_id: 1, account_id: 2 });
    const pc = __test.createPeerConnection(5) as unknown as FakePC;
    pc.iceConnectionState = "failed";
    await pc.oniceconnectionstatechange?.();
    useCallStore.setState({ callId: null });
    pc.onnegotiationneeded?.();
    await __test.simulateIceState(5, "failed");
    pc.addIceCandidate.mockRejectedValueOnce(new Error("bad"));
    __test.getRemoteDescSet()[5] = true;
    __test.getIceQueues()[5] = [{ candidate: "x" }];
    await __test.flushIceQueue(5);
    const origAC = globalThis.AudioContext;
    // @ts-expect-error force analyser failure
    globalThis.AudioContext = undefined;
    pc.ontrack?.({ streams: [fakeStream("audio")] } as unknown as RTCTrackEvent);
    globalThis.AudioContext = origAC;
    __test.setLocalStreamForTest(null);
    await switchAudioInput("mic");
    await applyAudioOutputToElement(document.createElement("audio"));
    const sinkEl = document.createElement("audio");
    sinkEl.setAttribute("data-call-audio", "");
    Object.assign(sinkEl, {
      setSinkId: vi.fn(async () => {
        throw new Error("sink");
      }),
    });
    document.body.append(sinkEl);
    await switchAudioOutput("out");
    await applyAudioOutputToElement(sinkEl);
    sinkEl.remove();
    (navigator.mediaDevices.enumerateDevices as ReturnType<typeof vi.fn>).mockRejectedValueOnce(new Error("enum"));
    await toggleSpeaker();
    (navigator.mediaDevices.enumerateDevices as ReturnType<typeof vi.fn>).mockResolvedValueOnce([
      { deviceId: "d", kind: "audiooutput", label: "Default" },
    ]);
    await toggleSpeaker();
    (navigator.mediaDevices.getUserMedia as ReturnType<typeof vi.fn>).mockResolvedValueOnce({
      getAudioTracks: () => [],
      getTracks: () => [],
      getVideoTracks: () => [],
    });
    __test.setLocalStreamForTest(fakeStream("audio"));
    await toggleSpeaker();
    (navigator.mediaDevices.getUserMedia as ReturnType<typeof vi.fn>).mockRejectedValueOnce(new Error("mic"));
    await switchAudioInput("mic-2");
    (navigator.mediaDevices.getUserMedia as ReturnType<typeof vi.fn>).mockResolvedValueOnce({
      getVideoTracks: () => [],
      getAudioTracks: () => [],
      getTracks: () => [],
    });
    useCallStore.setState({ callType: "video" });
    __test.setLocalStreamForTest(fakeStream("both"));
    await flipCamera();
    mockCreate.mockResolvedValueOnce({
      call: {
        id: 40,
        conversation_id: 1,
        initiator_account_id: 1,
        kind: "audio",
        status: "ringing",
        participants: [
          { id: 1, account_id: 1, status: "joined" },
          { id: 2, account_id: 2, status: "ringing" },
        ],
      },
      ice_servers: [],
    });
    (navigator.mediaDevices.getUserMedia as ReturnType<typeof vi.fn>).mockRejectedValueOnce(
      new DOMException("denied", "NotAllowedError"),
    );
    mockCancel.mockRejectedValueOnce(new Error("cancel"));
    useCallStore.setState({ status: "idle", callId: null });
    await startCall(1, "audio", 1);
    await handleSignalingMessage({ type: "offer", call_id: 1, from_account_id: 2, payload: { type: "pranswer", sdp: "x" } });
    await handleSignalingMessage({ type: "ice_candidate", call_id: 1, payload: { candidate: "z" } });
    await handleSignalingMessage({ type: "ice_candidate", call_id: 1, from_account_id: 2, payload: null });
    await handleSignalingMessage({ type: "call_declined", call_id: 1 });
    await handleSignalingMessage({ type: "busy", call_id: 99, account_id: 1 });
    useCallStore.setState({ callId: 1, status: "connecting" });
    await handleSignalingMessage({ type: "user_joined", call_id: 1, account_id: 8 });
    await handleSignalingMessage({ type: "mute_state", call_id: 1, mic_on: true, cam_on: false });
    await __test.onIceConnectionState(404);
    expect(__test.asSdp(null)).toBeNull();
    expect(__test.asSdp({ type: "foo" })).toBeNull();
    expect(__test.asSdp({ type: "rollback", sdp: "x" })).toEqual({ type: "rollback", sdp: "x" });
    expect(__test.asCandidate(null)).toBeNull();
    expect(__test.asCandidate({ candidate: "c" })).toEqual({ candidate: "c" });
    class Ctx {
      public destination = {};
      public createMediaStreamSource() {
        return { connect: vi.fn() };
      }
      public createAnalyser() {
        return { fftSize: 0, connect: vi.fn(), getByteFrequencyData: vi.fn() };
      }
      public createGain() {
        return {
          connect: vi.fn(),
          disconnect: vi.fn(() => {
            throw new Error("disc");
          }),
          gain: { value: 1 },
        };
      }
      public close() {
        return Promise.resolve();
      }
    }
    vi.stubGlobal("AudioContext", Ctx);
    __test.attachSpeakerAnalyser(21, fakeStream("audio"));
    __test.startSpeakerPolling();
    __test.detachSpeakerAnalyser(21);
    __test.attachSpeakerAnalyser(22, fakeStream("audio"));
    __test.stopSpeakerPolling();
    __test.resetVolumeWritable();
    Object.defineProperty(HTMLMediaElement.prototype, "volume", {
      configurable: true,
      get() {
        return 1;
      },
      set() {
        return undefined;
      },
    });
    __test.attachSpeakerAnalyser(23, fakeStream("audio"));
    __test.applySpeakerVolume(0.3);
    await __test.replaceAudioTrack({ kind: "audio", enabled: true, stop: vi.fn() } as unknown as MediaStreamTrack);
    __test.setLocalStreamForTest(fakeStream("audio"));
    await __test.applyMicModeForSpeaker(true);
    await __test.replaceAudioTrack({ kind: "audio", enabled: true, stop: vi.fn() } as unknown as MediaStreamTrack);
    useCallStore.setState({ iceServers: [{ urls: "stun:x" }], callId: 1 });
    __test.createPeerConnection(30);
    Object.defineProperty(__test.getPeerConnections()[30]!, "iceConnectionState", {
      configurable: true,
      value: "completed",
    });
    await __test.onIceConnectionState(30);
    useCallStore.setState({
      callId: 70,
      callType: "audio",
      participants: [{ id: 1, account_id: 1, status: "joined" }, { id: 2, account_id: 2, status: "joined" }],
      status: "ringing-incoming",
    });
    mockAccept.mockResolvedValueOnce({
      ice_servers: [],
      call: {
        participants: [
          { id: 1, account_id: 1, status: "joined" },
          { id: 2, account_id: 2, status: "joined" },
        ],
      },
    });
    (navigator.mediaDevices.getUserMedia as ReturnType<typeof vi.fn>).mockResolvedValueOnce(fakeStream("audio"));
    await acceptCall();
    useCallStore.getState().setStuckCall({ id: 12, conversationId: 1, callType: "audio", status: "ringing" });
    mockCancel.mockRejectedValueOnce(new Error("gone"));
    await endStuckCall();
    Object.defineProperty(HTMLMediaElement.prototype, "volume", {
      configurable: true,
      writable: true,
      value: 1,
    });
    mockDecline.mockReset();
    mockHangup.mockReset();
    mockCancel.mockReset();
    mockAccept.mockReset();
    __test.clearAudioOutput();
    await applyAudioOutputToElement(document.createElement("audio"));
    mockCreate.mockResolvedValueOnce({
      call: {
        id: 81,
        conversation_id: 1,
        initiator_account_id: 1,
        kind: "audio",
        status: "ringing",
        participants: [
          { id: 1, account_id: 1, status: "joined" },
          { id: 2, account_id: 2, status: "ringing" },
        ],
      },
      ice_servers: { urls: "stun:x" },
    });
    useCallStore.setState({ status: "idle", callId: null });
    await startCall(1, "audio", 1);
    setLocalAccountId(1);
    useCallStore.setState({ callId: 1, iceServers: [{ urls: "stun:x" }] });
    __test.createPeerConnection(9);
    __test.setMakingOffer(9, true);
    await handleSignalingMessage({
      type: "offer",
      call_id: 1,
      from_account_id: 9,
      payload: { type: "offer", sdp: "v=0" },
    });
    __test.getRemoteDescSet()[9] = true;
    (__test.getPeerConnections()[9] as unknown as FakePC).addIceCandidate.mockRejectedValueOnce(new Error("late"));
    await handleSignalingMessage({
      type: "ice_candidate",
      call_id: 1,
      from_account_id: 9,
      payload: { candidate: "z" },
    });
    useCallStore.setState({ callId: 5, status: "active" });
    await handleSignalingMessage({ type: "call_declined", call_id: 99, account_id: 2 });
    await handleSignalingMessage({ type: "answer", call_id: 99, from_account_id: 9, payload: { type: "answer", sdp: "v=0" } });
    useCallStore.getState().setStuckCall({ id: 3, conversationId: 1, callType: "audio", status: "active" });
    mockHangup.mockResolvedValueOnce({});
    await endStuckCall();
    useCallStore.getState().setStuckCall({ id: 4, conversationId: 1, callType: "audio", status: "ringing" });
    mockCancel.mockResolvedValueOnce({});
    await endStuckCall();
    __test.resetVolumeWritable();
    __test.attachSpeakerAnalyser(40, fakeStream("audio"));
    __test.applySpeakerVolume(0.8);
    __test.setLocalStreamForTest(fakeStream("audio"));
    (navigator.mediaDevices.getUserMedia as ReturnType<typeof vi.fn>).mockResolvedValueOnce({
      getAudioTracks: () => [],
      getTracks: () => [],
      getVideoTracks: () => [],
    });
    await __test.applyMicModeForSpeaker(false);
    useCallStore.setState({ callId: 90, callType: "audio", participants: [], status: "ringing-incoming" });
    (navigator.mediaDevices.getUserMedia as ReturnType<typeof vi.fn>).mockRejectedValueOnce(
      new DOMException("denied", "NotAllowedError"),
    );
    mockDecline.mockRejectedValueOnce(new Error("x"));
    await acceptCall();
  });

  it("skips mic replace when getUserMedia yields no audio track or fails", async () => {
    const { __test } = await import("./engine");
    __test.setLocalStreamForTest(fakeStream("audio"));
    const gum = vi
      .fn()
      .mockResolvedValueOnce({
        getAudioTracks: () => [],
        getTracks: () => [],
        getVideoTracks: () => [],
      })
      .mockRejectedValueOnce(new Error("mic"));
    Object.defineProperty(navigator, "mediaDevices", {
      configurable: true,
      value: { enumerateDevices: vi.fn(async () => []), getUserMedia: gum },
    });
    await __test.applyMicModeForSpeaker(true);
    await __test.applyMicModeForSpeaker(false);
    expect(gum).toHaveBeenCalledTimes(2);
  });

  it("covers remaining ?? and ternary branches", async () => {
    const { __test, checkForStuckCall, setLocalAccountId, handleSignalingMessage, acceptCall, flipCamera, toggleSpeaker } =
      await import("./engine");
    expect(__test.callErrorMessage({ error: {} })).toBe(i18n.t("calls.errors.start_failed"));
    mockGetActive.mockResolvedValueOnce({
      call: { id: 2, conversation_id: 1, kind: "video", status: "ringing", participants: [] },
    });
    useCallStore.setState({ status: "idle", callId: null });
    await checkForStuckCall();
    expect(useCallStore.getState().stuckCall?.callType).toBe("video");
    setLocalAccountId(null);
    useCallStore.setState({ callId: 1, iceServers: [{ urls: "stun:x" }] });
    __test.createPeerConnection(5);
    __test.setMakingOffer(5, true);
    await handleSignalingMessage({
      type: "offer",
      call_id: 1,
      from_account_id: 5,
      payload: { type: "offer", sdp: "v=0" },
    });
    Object.defineProperty(navigator, "mediaDevices", {
      configurable: true,
      value: { getUserMedia: vi.fn(async () => fakeStream("both")) },
    });
    await toggleSpeaker();
    Object.defineProperty(navigator, "mediaDevices", {
      configurable: true,
      value: {
        enumerateDevices: vi.fn(async () => [{ deviceId: "d", kind: "audiooutput", label: "Built-in" }]),
        getUserMedia: vi.fn(async () => fakeStream("both")),
      },
    });
    useCallStore.setState({ speakerOn: true });
    await toggleSpeaker();
    useCallStore.setState({
      callId: 8,
      callType: "audio",
      participants: [{ id: 1, account_id: 2, status: "joined" }],
      status: "ringing-incoming",
    });
    mockAccept.mockResolvedValueOnce({ call: {}, ice_servers: [] });
    setLocalAccountId(1);
    await acceptCall();
    useCallStore.setState({ callType: "video", facingMode: "environment", camOn: true });
    __test.setLocalStreamForTest(fakeStream("both"));
    Object.defineProperty(navigator, "mediaDevices", {
      configurable: true,
      value: {
        enumerateDevices: vi.fn(async () => []),
        getUserMedia: vi.fn(async () => fakeStream("video")),
      },
    });
    await flipCamera();
    const probe = document.createElement("audio");
    Object.defineProperty(probe, "volume", { configurable: true, get: () => VOLUME_PROBE_DEFAULT, set: () => undefined });
    const orig = document.createElement.bind(document);
    document.createElement = ((tag: string) => (tag === "audio" ? probe : orig(tag))) as typeof document.createElement;
    __test.resetVolumeWritable();
    __test.detectVolumeWritable();
    document.createElement = orig;
    useCallStore.setState({ callId: 91, callType: "audio", participants: [], status: "ringing-incoming" });
    Object.defineProperty(navigator, "mediaDevices", {
      configurable: true,
      value: {
        enumerateDevices: vi.fn(async () => []),
        getUserMedia: vi.fn(async () => {
          throw new DOMException("denied", "NotAllowedError");
        }),
      },
    });
    mockDecline.mockResolvedValueOnce({});
    await acceptCall();
  });

  it("shares a screen in 1:1, refuses groups, and leaves the call healthy when stopped", async () => {
    const {
      __test,
      handleSignalingMessage,
      setLocalAccountId,
      startScreenShare,
      stopScreenShare,
    } = await import("./engine");
    setLocalAccountId(1);
    mockScreenShare.mockResolvedValue({});
    useCallStore.setState({
      callId: 3,
      iceServers: [{ urls: "stun:x" }],
      isScreenSharing: false,
      participants: [
        { id: 1, account_id: 1, status: "joined", is_screen_sharing: false },
        { id: 2, account_id: 2, status: "joined", is_screen_sharing: false },
      ],
      status: "active",
    });
    __test.createPeerConnection(2);
    const display = fakeStream("video");
    Object.defineProperty(navigator, "mediaDevices", {
      configurable: true,
      value: {
        enumerateDevices: vi.fn(async () => []),
        getDisplayMedia: vi.fn(async () => display),
        getUserMedia: vi.fn(async () => fakeStream("both")),
      },
    });
    await startScreenShare();
    expect(useCallStore.getState().isScreenSharing).toBe(true);
    expect(mockScreenShare).toHaveBeenCalledWith(3, true);
    const pc = __test.getPeerConnections()[2] as unknown as FakePC;
    expect(pc.addTrack).toHaveBeenCalled();
    await stopScreenShare();
    expect(useCallStore.getState().isScreenSharing).toBe(false);
    expect(useCallStore.getState().status).toBe("active");
    expect(mockScreenShare).toHaveBeenCalledWith(3, false);

    useCallStore.setState({ isScreenSharing: false });
    await startScreenShare();
    const video = display.getVideoTracks()[0] as MediaStreamTrack & { onended: (() => void) | null };
    video.onended?.();
    await Promise.resolve();
    expect(useCallStore.getState().isScreenSharing).toBe(false);

    await startScreenShare();
    await startScreenShare();
    await stopScreenShare();

    useCallStore.setState({
      callId: 3,
      isScreenSharing: false,
      participants: [
        { id: 1, account_id: 1, status: "joined", is_screen_sharing: false },
        { id: 2, account_id: 2, status: "joined", is_screen_sharing: false },
        { id: 3, account_id: 3, status: "joined", is_screen_sharing: false },
      ],
      status: "active",
    });
    await startScreenShare();
    expect(useCallStore.getState().error).toBe(i18n.t("calls.errors.screen_share_group"));
    expect(useCallStore.getState().status).toBe("active");

    useCallStore.setState({
      callId: 3,
      error: null,
      isScreenSharing: false,
      participants: [
        { id: 1, account_id: 1, status: "joined", is_screen_sharing: false },
        { id: 2, account_id: 2, status: "joined", is_screen_sharing: false },
      ],
      status: "active",
    });
    Object.defineProperty(navigator, "mediaDevices", {
      configurable: true,
      value: {
        getDisplayMedia: vi.fn(async () => {
          throw new DOMException("denied", "NotAllowedError");
        }),
      },
    });
    await startScreenShare();
    expect(useCallStore.getState().error).toBe(i18n.t("calls.errors.permission"));

    useCallStore.setState({ error: null, isScreenSharing: false, status: "active" });
    Object.defineProperty(navigator, "mediaDevices", {
      configurable: true,
      value: {
        getDisplayMedia: vi.fn(async () => {
          throw new Error("fail");
        }),
      },
    });
    await startScreenShare();
    expect(useCallStore.getState().error).toBe(i18n.t("calls.errors.screen_share"));

    useCallStore.setState({ error: null, isScreenSharing: false, status: "active" });
    Object.defineProperty(navigator, "mediaDevices", {
      configurable: true,
      value: {
        getDisplayMedia: vi.fn(async () => ({
          getTracks: () => [],
          getVideoTracks: () => [],
        })),
      },
    });
    await startScreenShare();
    expect(useCallStore.getState().isScreenSharing).toBe(false);

    useCallStore.setState({ callId: null, status: "idle" });
    await startScreenShare();
    await stopScreenShare();

    mockScreenShare.mockRejectedValueOnce(new Error("offline"));
    useCallStore.setState({
      callId: 3,
      isScreenSharing: false,
      participants: [
        { id: 1, account_id: 1, status: "joined", is_screen_sharing: false },
        { id: 2, account_id: 2, status: "joined", is_screen_sharing: false },
      ],
      status: "active",
    });
    Object.defineProperty(navigator, "mediaDevices", {
      configurable: true,
      value: {
        getDisplayMedia: vi.fn(async () => fakeStream("video")),
      },
    });
    __test.createPeerConnection(2);
    await startScreenShare();
    mockScreenShare.mockRejectedValueOnce(new Error("offline"));
    await stopScreenShare();
    expect(useCallStore.getState().status).toBe("active");

    useCallStore.setState({ callId: 9, status: "ringing-outgoing" });
    await handleSignalingMessage({
      type: "incoming_call",
      call_id: 9,
      conversation_id: 1,
      kind: "audio",
      initiator_account_id: 1,
    });
    expect(useCallStore.getState().status).toBe("ringing-outgoing");

    const extra = fakeStream("video");
    __test.setScreenStreamForTest(extra);
    useCallStore.setState({ callId: 4, iceServers: [{ urls: "stun:x" }] });
    const withScreen = __test.createPeerConnection(8) as unknown as FakePC;
    expect(withScreen.addTrack).toHaveBeenCalled();
    const first = fakeStream("video");
    const second = fakeStream("video");
    withScreen.ontrack?.({ streams: [first] } as RTCTrackEvent);
    expect(useCallStore.getState().remoteStreams[8]).toBe(first);
    withScreen.ontrack?.({ streams: [second] } as RTCTrackEvent);
    expect(useCallStore.getState().remoteScreenStreams[8]).toBe(second);
    withScreen.ontrack?.({ streams: [] } as RTCTrackEvent);
    __test.setScreenStreamForTest(null);
    __test.cleanupAllPeers();

    setLocalAccountId(1);
    useCallStore.setState({
      callId: 3,
      participants: [
        { id: 1, account_id: 1, status: "joined", is_screen_sharing: false },
        { id: 2, account_id: 2, status: "joined", is_screen_sharing: false },
      ],
      status: "active",
    });
    await handleSignalingMessage({ type: "screen_share", call_id: 3, account_id: 2, sharing: true });
    expect(useCallStore.getState().participants[1]?.is_screen_sharing).toBe(true);
    await handleSignalingMessage({ type: "screen_share", call_id: 3, account_id: 2, sharing: false });
    expect(useCallStore.getState().remoteScreenStreams[2]).toBeUndefined();
    await handleSignalingMessage({ type: "screen_share", call_id: 99, account_id: 2, sharing: true });
    await handleSignalingMessage({ type: "screen_share", call_id: 3, sharing: true });
    await handleSignalingMessage({ type: "screen_share", call_id: 3, account_id: 1, sharing: true });
    __test.cleanupAllPeers();
  });
});
