import {
  acceptCallRequest,
  cancelCallRequest,
  createCall,
  declineCallRequest,
  endCallOnUnload,
  getActiveCall,
  hangupCallRequest,
  setScreenSharingRequest,
  type CallKind,
} from "@/features/calls/api/http";
import {
  CALL_HEARTBEAT_INTERVAL_MS,
  DIRECT_PARTICIPANT_MAX,
  GROUP_VIDEO_CONSTRAINTS,
  ICE_RESTART_MAX_ATTEMPTS,
  SPEAKER_EARPIECE_VOLUME,
  SPEAKER_FFT_BINS,
  SPEAKER_FFT_SIZE,
  SPEAKER_LEVEL_THRESHOLD,
  SPEAKER_POLL_MS,
  STUN_URLS,
  VOLUME_PROBE_ALT,
  VOLUME_PROBE_DEFAULT,
  VOLUME_PROBE_EPSILON,
} from "@/features/calls/model/constants";
import { useCallStore, type IceServerConfig } from "@/features/calls/store/call-store";
import { i18n } from "@/shared/lib/i18n";
import { parseRealtimeEvent, type RealtimeEvent } from "@/shared/lib/realtime/events";

type SignalSender = (action: string, data: Record<string, unknown>) => void;

const ERROR_REASONS = [
  "already_in_call",
  "insufficient_participants",
  "too_many_participants",
  "invalid_call_type",
  "feature_disabled",
] as const;

let sendSignal: SignalSender | null = null;
let localAccountId: number | null = null;
const peerConnections: Record<number, RTCPeerConnection> = {};
const iceQueues: Record<number, RTCIceCandidateInit[]> = {};
const remoteDescSet: Record<number, boolean> = {};
const makingOffer: Record<number, boolean> = {};
const iceRestartAttempts: Record<number, number> = {};
let localStream: MediaStream | null = null;
let screenStream: MediaStream | null = null;
let speakerTimer: ReturnType<typeof setInterval> | null = null;
let heartbeatTimer: ReturnType<typeof setInterval> | null = null;
let heartbeatCallId: number | null = null;
let audioCtx: AudioContext | null = null;
let analyserNodes: Record<number, AnalyserNode> = {};
let gainNodes: Record<number, GainNode> = {};
let volumeWritable: boolean | null = null;
let audioOutputDeviceId: string | null = null;
let iceRestarting = false;

export function setSignalingSender(fn: SignalSender | null): void {
  sendSignal = fn;
}

export function setLocalAccountId(id: number | null): void {
  localAccountId = id;
}

function signal(action: string, data: Record<string, unknown>): void {
  try {
    sendSignal?.(action, data);
  } catch {
    return;
  }
}

function startHeartbeat(callId: number): void {
  if (heartbeatTimer && heartbeatCallId === callId) {
    return;
  }
  stopHeartbeat();
  heartbeatCallId = callId;
  heartbeatTimer = setInterval(() => {
    signal("heartbeat", { call_id: callId });
  }, CALL_HEARTBEAT_INTERVAL_MS);
}

function stopHeartbeat(): void {
  if (heartbeatTimer) {
    clearInterval(heartbeatTimer);
  }
  heartbeatTimer = null;
  heartbeatCallId = null;
}

function callErrorMessage(err: unknown): string {
  const reason = errorReason(err);
  if (reason && (ERROR_REASONS as readonly string[]).includes(reason)) {
    return i18n.t(`calls.errors.${reason}`);
  }
  return i18n.t("calls.errors.start_failed");
}

function errorReason(err: unknown): string | null {
  if (!err || typeof err !== "object") {
    return null;
  }
  const root = err as { error?: { code?: string; details?: { reason?: string } }; details?: { reason?: string } };
  return root.error?.details?.reason ?? root.details?.reason ?? root.error?.code ?? null;
}

function iceServersFromStore(): RTCIceServer[] {
  const servers = useCallStore.getState().iceServers;
  if (!servers.length) {
    return STUN_URLS.map((urls) => ({ urls }));
  }
  return servers as RTCIceServer[];
}

async function acquireLocalMedia(callType: CallKind, isGroup: boolean): Promise<MediaStream> {
  const wantVideo = callType === "video";
  const constraints: MediaStreamConstraints = {
    audio: true,
    video: wantVideo ? (isGroup ? GROUP_VIDEO_CONSTRAINTS : true) : false,
  };
  try {
    const stream = await navigator.mediaDevices.getUserMedia(constraints);
    localStream = stream;
    useCallStore.getState().setLocalStream(stream);
    useCallStore.getState().setCamOn(wantVideo);
    useCallStore.getState().setMicOn(true);
    return stream;
  } catch (err) {
    const denied = err instanceof DOMException && err.name === "NotAllowedError";
    useCallStore.getState().setError(i18n.t(denied ? "calls.errors.permission" : "calls.errors.media"));
    throw err;
  }
}

function stopLocalMedia(): void {
  localStream?.getTracks().forEach((track) => track.stop());
  localStream = null;
  stopScreenTracks();
  useCallStore.getState().setLocalStream(null);
}

function stopScreenTracks(): void {
  const share = screenStream;
  screenStream = null;
  share?.getTracks().forEach((track) => {
    track.onended = null;
    track.stop();
  });
  Object.values(peerConnections).forEach((pc) => {
    pc.getSenders().forEach((sender) => {
      if (sender.track && share?.getTracks().includes(sender.track)) {
        pc.removeTrack(sender);
      }
    });
  });
  useCallStore.getState().setScreenSharing(false);
}

function createPeerConnection(peerId: number): RTCPeerConnection {
  const callId = useCallStore.getState().callId;
  const pc = new RTCPeerConnection({ iceServers: iceServersFromStore() });
  peerConnections[peerId] = pc;
  iceQueues[peerId] = iceQueues[peerId] ?? [];
  remoteDescSet[peerId] = false;
  makingOffer[peerId] = false;
  if (localStream) {
    localStream.getTracks().forEach((track) => {
      pc.addTrack(track, localStream!);
    });
  }
  if (screenStream) {
    screenStream.getTracks().forEach((track) => {
      pc.addTrack(track, screenStream!);
    });
  }
  pc.onicecandidate = (ev) => {
    if (!ev.candidate || !callId) {
      return;
    }
    signal("signal", {
      call_id: callId,
      payload: ev.candidate.toJSON(),
      to_account_id: peerId,
      type: "ice_candidate",
    });
  };
  pc.ontrack = (ev) => {
    const [stream] = ev.streams;
    if (!stream) {
      return;
    }
    const existing = useCallStore.getState().remoteStreams[peerId];
    if (existing && existing.id !== stream.id) {
      useCallStore.getState().setRemoteScreenStream(peerId, stream);
      return;
    }
    useCallStore.getState().setRemoteStream(peerId, stream);
    attachSpeakerAnalyser(peerId, stream);
  };
  pc.onnegotiationneeded = () => {
    void negotiateOffer(peerId, false);
  };
  pc.oniceconnectionstatechange = () => {
    void onIceConnectionState(peerId);
  };
  pc.onconnectionstatechange = () => {
    if (pc.connectionState === "closed") {
      cleanupPeer(peerId);
    }
  };
  return pc;
}

async function negotiateOffer(peerId: number, iceRestart: boolean): Promise<void> {
  const pc = peerConnections[peerId];
  const callId = useCallStore.getState().callId;
  if (!pc || !callId) {
    return;
  }
  try {
    makingOffer[peerId] = true;
    const offer = await pc.createOffer(iceRestart ? { iceRestart: true } : undefined);
    await pc.setLocalDescription(offer);
    signal("signal", {
      call_id: callId,
      payload: pc.localDescription,
      to_account_id: peerId,
      type: "offer",
    });
  } catch {
    return;
  } finally {
    makingOffer[peerId] = false;
  }
}

async function onIceConnectionState(peerId: number): Promise<void> {
  const pc = peerConnections[peerId];
  if (!pc) {
    return;
  }
  if (pc.iceConnectionState === "connected" || pc.iceConnectionState === "completed") {
    iceRestartAttempts[peerId] = 0;
    iceRestarting = false;
    return;
  }
  if (pc.iceConnectionState !== "failed") {
    return;
  }
  await restartIce(peerId);
}

async function restartIce(peerId: number): Promise<void> {
  const pc = peerConnections[peerId];
  if (!pc || iceRestarting) {
    return;
  }
  const used = iceRestartAttempts[peerId] ?? 0;
  if (used >= ICE_RESTART_MAX_ATTEMPTS) {
    useCallStore.getState().setError(i18n.t("calls.errors.dropped"));
    await endCall();
    return;
  }
  iceRestartAttempts[peerId] = used + 1;
  iceRestarting = true;
  await negotiateOffer(peerId, true);
  iceRestarting = false;
}

async function flushIceQueue(peerId: number): Promise<void> {
  const pc = peerConnections[peerId];
  const queue = iceQueues[peerId] ?? [];
  if (!pc || !remoteDescSet[peerId]) {
    return;
  }
  for (const candidate of queue) {
    try {
      await pc.addIceCandidate(candidate);
    } catch {
      continue;
    }
  }
  iceQueues[peerId] = [];
}

function cleanupPeer(peerId: number): void {
  const pc = peerConnections[peerId];
  if (pc) {
    try {
      pc.close();
    } catch {
      /* ignore */
    }
    delete peerConnections[peerId];
  }
  delete iceQueues[peerId];
  delete remoteDescSet[peerId];
  delete makingOffer[peerId];
  delete iceRestartAttempts[peerId];
  detachSpeakerAnalyser(peerId);
  useCallStore.getState().setRemoteStream(peerId, null);
  useCallStore.getState().clearRemoteMedia(peerId);
}

function cleanupAllPeers(): void {
  Object.keys(peerConnections).forEach((id) => cleanupPeer(Number(id)));
  stopSpeakerPolling();
}

function ensureAudioContext(): AudioContext {
  if (!audioCtx) {
    audioCtx = new AudioContext();
  }
  return audioCtx;
}

function attachSpeakerAnalyser(peerId: number, stream: MediaStream): void {
  try {
    const ctx = ensureAudioContext();
    const source = ctx.createMediaStreamSource(stream);
    const analyser = ctx.createAnalyser();
    analyser.fftSize = SPEAKER_FFT_SIZE;
    source.connect(analyser);
    const gain = ctx.createGain();
    gain.gain.value = useCallStore.getState().speakerVolume;
    source.connect(gain);
    analyserNodes[peerId] = analyser;
    gainNodes[peerId] = gain;
    startSpeakerPolling();
    applySpeakerVolume(useCallStore.getState().speakerVolume);
  } catch {
    return;
  }
}

function detachSpeakerAnalyser(peerId: number): void {
  delete analyserNodes[peerId];
  const gain = gainNodes[peerId];
  if (gain) {
    try {
      gain.disconnect();
    } catch {
      /* ignore */
    }
    delete gainNodes[peerId];
  }
  if (!Object.keys(analyserNodes).length) {
    stopSpeakerPolling();
  }
}

function startSpeakerPolling(): void {
  if (speakerTimer) {
    return;
  }
  speakerTimer = setInterval(() => {
    let loudestId: number | null = null;
    let loudest = 0;
    const speaking: number[] = [];
    const data = new Uint8Array(SPEAKER_FFT_BINS);
    Object.entries(analyserNodes).forEach(([id, analyser]) => {
      analyser.getByteFrequencyData(data);
      const sum = data.reduce((total, value) => total + value, 0);
      const avg = sum / data.length;
      const accountId = Number(id);
      if (avg > SPEAKER_LEVEL_THRESHOLD) {
        speaking.push(accountId);
        if (avg > loudest) {
          loudest = avg;
          loudestId = accountId;
        }
      }
    });
    const store = useCallStore.getState();
    store.setSpeakingIds(speaking);
    store.setActiveSpeaker(loudestId);
  }, SPEAKER_POLL_MS);
}

function stopSpeakerPolling(): void {
  if (speakerTimer) {
    clearInterval(speakerTimer);
    speakerTimer = null;
  }
  analyserNodes = {};
  Object.values(gainNodes).forEach((gain) => {
    try {
      gain.disconnect();
    } catch {
      /* ignore */
    }
  });
  gainNodes = {};
  void audioCtx?.close();
  audioCtx = null;
  useCallStore.getState().setActiveSpeaker(null);
  useCallStore.getState().setSpeakingIds([]);
}

function detectVolumeWritable(): boolean {
  if (volumeWritable !== null) {
    return volumeWritable;
  }
  try {
    const probe = document.createElement("audio");
    const original = probe.volume;
    const next = original === VOLUME_PROBE_DEFAULT ? VOLUME_PROBE_ALT : VOLUME_PROBE_DEFAULT;
    probe.volume = next;
    volumeWritable = Math.abs(probe.volume - next) < VOLUME_PROBE_EPSILON;
  } catch {
    volumeWritable = false;
  }
  return volumeWritable;
}

function applySpeakerVolume(volume: number): void {
  const clamped = Math.min(1, Math.max(0, volume));
  const writable = detectVolumeWritable();
  if (writable) {
    document.querySelectorAll<HTMLMediaElement>("[data-call-audio]").forEach((el) => {
      el.volume = clamped;
      el.muted = false;
    });
    Object.values(gainNodes).forEach((gain) => {
      try {
        gain.disconnect();
      } catch {
        /* ignore */
      }
      gain.gain.value = clamped;
    });
    return;
  }
  document.querySelectorAll<HTMLMediaElement>("[data-call-audio]").forEach((el) => {
    el.muted = true;
  });
  const ctx = ensureAudioContext();
  Object.values(gainNodes).forEach((gain) => {
    gain.gain.value = clamped;
    try {
      gain.disconnect();
      gain.connect(ctx.destination);
    } catch {
      /* ignore */
    }
  });
}

export function setSpeakerVolume(volume: number): void {
  useCallStore.getState().setSpeakerVolume(volume);
  applySpeakerVolume(volume);
}

export async function toggleSpeaker(): Promise<void> {
  const store = useCallStore.getState();
  const next = !store.speakerOn;
  store.setSpeakerOn(next);
  applySpeakerVolume(next ? 1 : SPEAKER_EARPIECE_VOLUME);
  try {
    const devices = (await navigator.mediaDevices?.enumerateDevices?.()) ?? [];
    const outputs = devices.filter((device) => device.kind === "audiooutput");
    const speakerLike = outputs.find((device) => /speaker|loudspeaker|loud|hdmi|usb audio/i.test(device.label));
    const earpieceLike = outputs.find((device) =>
      /earpiece|receiver|phone|communications|headset|headphone|bluetooth/i.test(device.label),
    );
    const defaultOut = outputs.find((device) => /default/i.test(device.label)) ?? outputs[0];
    const target = next ? (speakerLike ?? defaultOut) : (earpieceLike ?? defaultOut);
    if (target) {
      await switchAudioOutput(target.deviceId);
    }
  } catch {
    /* sink routing is best-effort */
  }
  await applyMicModeForSpeaker(next);
}

async function applyMicModeForSpeaker(speakerOn: boolean): Promise<void> {
  if (!localStream?.getAudioTracks().length) {
    return;
  }
  try {
    const next = await navigator.mediaDevices.getUserMedia({
      audio: {
        autoGainControl: speakerOn,
        echoCancellation: true,
        noiseSuppression: true,
      },
      video: false,
    });
    const newTrack = next.getAudioTracks()[0];
    if (!newTrack) {
      return;
    }
    await replaceAudioTrack(newTrack);
  } catch {
    return;
  }
}

async function replaceAudioTrack(newTrack: MediaStreamTrack): Promise<void> {
  if (!localStream) {
    return;
  }
  const oldTrack = localStream.getAudioTracks()[0];
  if (oldTrack) {
    localStream.removeTrack(oldTrack);
    oldTrack.stop();
  }
  localStream.addTrack(newTrack);
  newTrack.enabled = useCallStore.getState().micOn;
  await Promise.all(
    Object.values(peerConnections).map(async (pc) => {
      const sender = pc.getSenders().find((row) => row.track?.kind === "audio");
      if (sender) {
        await sender.replaceTrack(newTrack);
      }
    }),
  );
  useCallStore.getState().setLocalStream(localStream);
}

function broadcastMuteState(): void {
  const store = useCallStore.getState();
  if (!store.callId) {
    return;
  }
  signal("mute_state", { call_id: store.callId, cam_on: store.camOn, mic_on: store.micOn });
}

function asSdp(payload: unknown): RTCSessionDescriptionInit | null {
  if (!payload || typeof payload !== "object") {
    return null;
  }
  const type = (payload as { type?: unknown }).type;
  if (type !== "offer" && type !== "answer" && type !== "pranswer" && type !== "rollback") {
    return null;
  }
  return payload as RTCSessionDescriptionInit;
}

function asCandidate(payload: unknown): RTCIceCandidateInit | null {
  if (!payload || typeof payload !== "object") {
    return null;
  }
  return payload as RTCIceCandidateInit;
}

async function handleOffer(fromAccountId: number, sdp: RTCSessionDescriptionInit): Promise<void> {
  let pc = peerConnections[fromAccountId];
  if (!pc) {
    pc = createPeerConnection(fromAccountId);
  }
  const offerCollision = makingOffer[fromAccountId] || pc.signalingState !== "stable";
  const polite = (localAccountId ?? 0) > fromAccountId;
  if (offerCollision && !polite) {
    return;
  }
  await pc.setRemoteDescription(sdp);
  remoteDescSet[fromAccountId] = true;
  await flushIceQueue(fromAccountId);
  const answer = await pc.createAnswer();
  await pc.setLocalDescription(answer);
  const callId = useCallStore.getState().callId;
  if (!callId) {
    return;
  }
  signal("signal", {
    call_id: callId,
    payload: pc.localDescription,
    to_account_id: fromAccountId,
    type: "answer",
  });
}

async function handleAnswer(fromAccountId: number, sdp: RTCSessionDescriptionInit): Promise<void> {
  const pc = peerConnections[fromAccountId];
  if (!pc) {
    return;
  }
  await pc.setRemoteDescription(sdp);
  remoteDescSet[fromAccountId] = true;
  await flushIceQueue(fromAccountId);
}

async function handleIceCandidate(fromAccountId: number, candidate: RTCIceCandidateInit): Promise<void> {
  const pc = peerConnections[fromAccountId];
  if (!pc || !remoteDescSet[fromAccountId]) {
    iceQueues[fromAccountId] = iceQueues[fromAccountId] ?? [];
    iceQueues[fromAccountId].push(candidate);
    return;
  }
  try {
    await pc.addIceCandidate(candidate);
  } catch {
    return;
  }
}

export async function handleSignalingMessage(data: RealtimeEvent | unknown): Promise<void> {
  let event: RealtimeEvent;
    try {
      event = parseRealtimeEvent(data);
    } catch {
      return;
    }
  await dispatchSignaling(event);
}

async function dispatchSignaling(event: RealtimeEvent): Promise<void> {
  const store = useCallStore.getState();
  switch (event.type) {
    case "incoming_call":
      if (event.initiator_account_id === localAccountId) {
        return;
      }
      if (store.callId === event.call_id) {
        return;
      }
      if (store.status !== "idle") {
        signal("busy", { call_id: event.call_id });
        return;
      }
      store.setIncoming(event);
      return;
    case "call_accepted":
      if (store.callId !== event.call_id) {
        return;
      }
      if (event.account_id != null) {
        store.updateParticipantStatus(event.account_id, "joined");
      }
      store.setConnecting();
      if (event.account_id != null) {
        await ensurePeerAndOffer(event.account_id);
      }
      store.setActive();
      startHeartbeat(event.call_id);
      signal("join", { call_id: event.call_id });
      broadcastMuteState();
      return;
    case "call_declined":
    case "busy":
      if (store.callId != null && store.callId !== event.call_id) {
        return;
      }
      if (event.account_id != null) {
        store.updateParticipantStatus(event.account_id, event.type === "busy" ? "busy" : "rejected");
      }
      if (store.participants.length <= DIRECT_PARTICIPANT_MAX) {
        await teardownLocal();
      }
      return;
    case "call_cancelled":
    case "call_ended":
    case "call_missed":
      if (store.callId === event.call_id) {
        await teardownLocal();
      }
      return;
    case "call_dismissed":
      if (store.status === "ringing-incoming" && store.callId === event.call_id) {
        store.reset();
      }
      return;
    case "user_joined":
      if (store.callId !== event.call_id) {
        return;
      }
      if (event.account_id != null) {
        store.updateParticipantStatus(event.account_id, "joined");
      }
      if ((store.status === "active" || store.status === "connecting") && event.account_id != null) {
        await ensurePeerAndOffer(event.account_id);
        broadcastMuteState();
      }
      return;
    case "user_left":
      if (store.callId !== event.call_id) {
        return;
      }
      if (event.account_id != null) {
        store.updateParticipantStatus(event.account_id, "left");
        cleanupPeer(event.account_id);
      }
      return;
    case "mute_state":
      if (store.callId === event.call_id && event.account_id != null) {
        store.setRemoteMedia(event.account_id, { camOn: event.cam_on, micOn: event.mic_on });
      }
      return;
    case "screen_share":
      if (store.callId !== event.call_id || event.account_id == null || event.account_id === localAccountId) {
        return;
      }
      store.updateScreenSharing(event.account_id, event.sharing);
      if (!event.sharing) {
        store.setRemoteScreenStream(event.account_id, null);
      }
      return;
    case "offer": {
      if (store.callId != null && store.callId !== event.call_id) {
        return;
      }
      const sdp = asSdp(event.payload);
      if (sdp && event.from_account_id != null) {
        await handleOffer(event.from_account_id, sdp);
      }
      useCallStore.getState().setActive();
      startHeartbeat(event.call_id);
      return;
    }
    case "answer": {
      if (store.callId != null && store.callId !== event.call_id) {
        return;
      }
      const sdp = asSdp(event.payload);
      if (sdp && event.from_account_id != null) {
        await handleAnswer(event.from_account_id, sdp);
      }
      useCallStore.getState().setActive();
      startHeartbeat(event.call_id);
      return;
    }
    case "ice_candidate": {
      const candidate = asCandidate(event.payload);
      if (candidate && event.from_account_id != null) {
        await handleIceCandidate(event.from_account_id, candidate);
      }
      return;
    }
    default:
      return;
  }
}

export async function checkForStuckCall(): Promise<void> {
  const store = useCallStore.getState();
  if (store.status !== "idle" || store.callId) {
    return;
  }
  try {
    const res = await getActiveCall();
    if (!res.call) {
      store.setStuckCall(null);
      return;
    }
    store.setStuckCall({
      callType: res.call.kind === "video" ? "video" : "audio",
      conversationId: res.call.conversation_id,
      id: res.call.id,
      status: res.call.status,
    });
  } catch {
    return;
  }
}

export async function endStuckCall(): Promise<void> {
  const stuck = useCallStore.getState().stuckCall;
  if (!stuck) {
    return;
  }
  try {
    if (stuck.status === "ringing") {
      await cancelCallRequest(stuck.id);
    } else {
      await hangupCallRequest(stuck.id);
    }
  } catch {
    /* expiry sweep cleans up */
  }
  useCallStore.getState().setStuckCall(null);
}

if (typeof window !== "undefined") {
  window.addEventListener("pagehide", () => {
    const store = useCallStore.getState();
    if (!store.callId) {
      return;
    }
    if (store.status === "ringing-outgoing") {
      endCallOnUnload(store.callId, "cancel");
    } else if (store.status === "ringing-incoming") {
      endCallOnUnload(store.callId, "decline");
    } else if (store.status === "connecting" || store.status === "active") {
      endCallOnUnload(store.callId, "hangup");
    }
  });
}

async function ensurePeerAndOffer(peerId: number): Promise<void> {
  if (peerId === localAccountId || peerConnections[peerId]) {
    return;
  }
  createPeerConnection(peerId);
}

export async function startCall(conversationId: number, callType: CallKind, myAccountId: number): Promise<void> {
  if (localAccountId == null) {
    setLocalAccountId(myAccountId);
  }
  const store = useCallStore.getState();
  if (store.status !== "idle") {
    store.setError(i18n.t("calls.errors.in_progress"));
    return;
  }
  try {
    const res = await createCall(conversationId, callType);
    const call = res.call;
    if (!call) {
      useCallStore.getState().setError(i18n.t("calls.errors.start_failed"));
      useCallStore.getState().reset();
      return;
    }
    const isGroup = call.participants.length > DIRECT_PARTICIPANT_MAX;
    try {
      await acquireLocalMedia(callType, isGroup);
    } catch {
      try {
        await cancelCallRequest(call.id);
      } catch {
        /* ignore */
      }
      useCallStore.getState().reset();
      return;
    }
    store.setOutgoing({
      callId: call.id,
      callType: call.kind === "video" ? "video" : "audio",
      conversationId: call.conversation_id,
      iceServers: asIceServers(res.ice_servers),
      initiatorId: call.initiator_account_id,
      participants: call.participants,
    });
    if (call.status === "missed") {
      store.setError(i18n.t("calls.errors.already_in_call"));
      await teardownLocal();
    }
  } catch (err) {
    stopLocalMedia();
    useCallStore.getState().setError(callErrorMessage(err));
    useCallStore.getState().reset();
    if (errorReason(err) === "already_in_call") {
      void checkForStuckCall();
    }
  }
}

function asIceServers(raw: unknown): IceServerConfig[] {
  if (!Array.isArray(raw)) {
    return [];
  }
  return raw as IceServerConfig[];
}

export async function acceptCall(): Promise<void> {
  const store = useCallStore.getState();
  const callId = store.callId;
  const callType = store.callType;
  if (!callId || !callType) {
    return;
  }
  try {
    const isGroup = store.participants.length > DIRECT_PARTICIPANT_MAX;
    await acquireLocalMedia(callType, isGroup);
    const res = await acceptCallRequest(callId);
    store.setIceServers(asIceServers(res.ice_servers));
    store.setConnecting();
    store.setActive();
    startHeartbeat(callId);
    const joined = (res.call?.participants ?? store.participants).filter(
      (row) => row.status === "joined" && row.account_id !== localAccountId,
    );
    for (const row of joined) {
      await ensurePeerAndOffer(row.account_id);
    }
    signal("join", { call_id: callId });
    signal("dismiss", { call_id: callId, reason: "answered_here" });
    broadcastMuteState();
  } catch (err) {
    stopLocalMedia();
    const denied = err instanceof DOMException && err.name === "NotAllowedError";
    store.setError(i18n.t(denied ? "calls.errors.permission" : "calls.errors.accept_failed"));
    try {
      await declineCallRequest(callId);
    } catch {
      /* ignore */
    }
    store.reset();
  }
}

export async function rejectCall(): Promise<void> {
  const store = useCallStore.getState();
  if (!store.callId) {
    store.reset();
    return;
  }
  try {
    await declineCallRequest(store.callId);
  } catch {
    /* ignore */
  }
  signal("dismiss", { call_id: store.callId, reason: "rejected_here" });
  await teardownLocal();
}

export async function cancelCall(): Promise<void> {
  const store = useCallStore.getState();
  if (!store.callId) {
    store.reset();
    return;
  }
  try {
    await cancelCallRequest(store.callId);
  } catch {
    /* ignore */
  }
  await teardownLocal();
}

export async function endCall(): Promise<void> {
  const store = useCallStore.getState();
  if (!store.callId) {
    await teardownLocal();
    return;
  }
  signal("leave", { call_id: store.callId });
  try {
    await hangupCallRequest(store.callId);
  } catch {
    /* ignore */
  }
  await teardownLocal();
}

async function teardownLocal(): Promise<void> {
  stopHeartbeat();
  cleanupAllPeers();
  stopLocalMedia();
  iceRestarting = false;
  useCallStore.getState().reset();
}

export function toggleMic(): void {
  const store = useCallStore.getState();
  const next = !store.micOn;
  localStream?.getAudioTracks().forEach((track) => {
    track.enabled = next;
  });
  store.setMicOn(next);
  broadcastMuteState();
}

export function toggleCamera(): void {
  const store = useCallStore.getState();
  const next = !store.camOn;
  localStream?.getVideoTracks().forEach((track) => {
    track.enabled = next;
  });
  store.setCamOn(next);
  broadcastMuteState();
}

export async function switchAudioOutput(deviceId: string): Promise<void> {
  audioOutputDeviceId = deviceId;
  const elements = document.querySelectorAll<HTMLMediaElement>("[data-call-audio]");
  for (const el of elements) {
    const maybe = el as HTMLMediaElement & { setSinkId?: (id: string) => Promise<void> };
    if (typeof maybe.setSinkId === "function") {
      try {
        await maybe.setSinkId(deviceId);
      } catch {
        continue;
      }
    }
  }
}

export async function applyAudioOutputToElement(el: HTMLMediaElement): Promise<void> {
  if (!audioOutputDeviceId) {
    return;
  }
  const maybe = el as HTMLMediaElement & { setSinkId?: (id: string) => Promise<void> };
  if (typeof maybe.setSinkId === "function") {
    try {
      await maybe.setSinkId(audioOutputDeviceId);
    } catch {
      return;
    }
  }
}

export async function switchAudioInput(deviceId: string): Promise<void> {
  if (!localStream) {
    return;
  }
  try {
    const next = await navigator.mediaDevices.getUserMedia({
      audio: { deviceId: { exact: deviceId } },
      video: false,
    });
    const newTrack = next.getAudioTracks()[0];
    if (!newTrack) {
      return;
    }
    await replaceAudioTrack(newTrack);
  } catch {
    useCallStore.getState().setError(i18n.t("calls.errors.switch_mic"));
  }
}

export async function startScreenShare(): Promise<void> {
  const store = useCallStore.getState();
  if (!store.callId || store.status !== "active" || store.isScreenSharing) {
    return;
  }
  if (store.participants.length > DIRECT_PARTICIPANT_MAX) {
    store.setError(i18n.t("calls.errors.screen_share_group"));
    return;
  }
  try {
    const share = await navigator.mediaDevices.getDisplayMedia({ video: true, audio: false });
    const track = share.getVideoTracks()[0];
    if (!track) {
      share.getTracks().forEach((row) => row.stop());
      return;
    }
    screenStream = share;
    Object.values(peerConnections).forEach((pc) => {
      pc.addTrack(track, share);
    });
    store.setScreenSharing(true);
    track.onended = () => {
      void stopScreenShare();
    };
    try {
      await setScreenSharingRequest(store.callId, true);
    } catch {
      /* local share still runs; remote UI follows the extra track */
    }
  } catch (err) {
    const denied = err instanceof DOMException && err.name === "NotAllowedError";
    useCallStore.getState().setError(i18n.t(denied ? "calls.errors.permission" : "calls.errors.screen_share"));
  }
}

export async function stopScreenShare(): Promise<void> {
  const store = useCallStore.getState();
  const callId = store.callId;
  const wasSharing = store.isScreenSharing || screenStream != null;
  stopScreenTracks();
  if (!wasSharing || !callId) {
    return;
  }
  try {
    await setScreenSharingRequest(callId, false);
  } catch {
    /* ignore */
  }
}

export async function flipCamera(): Promise<void> {
  const store = useCallStore.getState();
  if (store.callType !== "video" || !localStream) {
    return;
  }
  const nextFacing = store.facingMode === "user" ? "environment" : "user";
  const isGroup = store.participants.length > DIRECT_PARTICIPANT_MAX;
  try {
    const next = await navigator.mediaDevices.getUserMedia({
      audio: false,
      video: {
        facingMode: { ideal: nextFacing },
        ...(isGroup ? GROUP_VIDEO_CONSTRAINTS : {}),
      },
    });
    const newTrack = next.getVideoTracks()[0];
    if (!newTrack) {
      return;
    }
    const oldTrack = localStream.getVideoTracks()[0];
    if (oldTrack) {
      localStream.removeTrack(oldTrack);
      oldTrack.stop();
    }
    localStream.addTrack(newTrack);
    newTrack.enabled = store.camOn;
    await Promise.all(
      Object.values(peerConnections).map(async (pc) => {
        const sender = pc.getSenders().find((row) => row.track?.kind === "video");
        if (sender) {
          await sender.replaceTrack(newTrack);
        }
      }),
    );
    store.setFacingMode(nextFacing);
    store.setLocalStream(localStream);
    broadcastMuteState();
  } catch {
    store.setError(i18n.t("calls.errors.flip_camera"));
  }
}

export const __test = {
  GROUP_VIDEO_CONSTRAINTS,
  applyMicModeForSpeaker,
  applySpeakerVolume,
  asCandidate,
  asSdp,
  attachSpeakerAnalyser,
  broadcastMuteState,
  callErrorMessage,
  cleanupAllPeers,
  createPeerConnection,
  detachSpeakerAnalyser,
  detectVolumeWritable: () => detectVolumeWritable(),
  flushIceQueue,
  getIceQueues: () => iceQueues,
  getIceRestartAttempts: () => iceRestartAttempts,
  getPeerConnections: () => peerConnections,
  getRemoteDescSet: () => remoteDescSet,
  onIceConnectionState,
  replaceAudioTrack,
  resetVolumeWritable: () => {
    volumeWritable = null;
  },
  restartIce,
  setIceRestartAttempts: (peerId: number, count: number) => {
    iceRestartAttempts[peerId] = count;
  },
  setIceRestarting: (value: boolean) => {
    iceRestarting = value;
  },
  clearAudioOutput: () => {
    audioOutputDeviceId = null;
  },
  setMakingOffer: (peerId: number, value: boolean) => {
    makingOffer[peerId] = value;
  },
  setLocalStreamForTest: (stream: MediaStream | null) => {
    localStream = stream;
  },
  setScreenStreamForTest: (stream: MediaStream | null) => {
    screenStream = stream;
  },
  simulateIceState: async (peerId: number, state: RTCIceConnectionState) => {
    const pc = peerConnections[peerId];
    if (!pc) {
      return;
    }
    Object.defineProperty(pc, "iceConnectionState", { configurable: true, value: state });
    await onIceConnectionState(peerId);
  },
  startSpeakerPolling,
  stopSpeakerPolling,
  stopLocalMedia,
};
