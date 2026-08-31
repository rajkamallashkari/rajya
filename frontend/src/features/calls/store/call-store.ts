import { create } from "zustand";
import type { CallKind, CallParticipant } from "@/features/calls/api/http";
import { SPEAKER_EARPIECE_VOLUME } from "@/features/calls/model/constants";
import type { RealtimeEvent } from "@/shared/lib/realtime/events";

export type CallUiStatus =
  | "idle"
  | "ringing-incoming"
  | "ringing-outgoing"
  | "connecting"
  | "active"
  | "ended";

export type FacingMode = "user" | "environment";

export interface RemoteMediaState {
  camOn: boolean;
  micOn: boolean;
}

export interface StuckCallInfo {
  callType: CallKind;
  conversationId: number;
  id: number;
  status: string;
}

export interface IceServerConfig {
  urls: string | string[];
  credential?: string;
  username?: string;
}

export interface CallData {
  activeSpeakerId: number | null;
  callId: number | null;
  callType: CallKind | null;
  camOn: boolean;
  conversationId: number | null;
  error: string | null;
  facingMode: FacingMode;
  iceServers: IceServerConfig[];
  incomingPreview: boolean;
  incomingSilenced: boolean;
  initiatorId: number | null;
  initiatorName: string | null;
  initiatorUsername: string | null;
  localStream: MediaStream | null;
  micOn: boolean;
  minimized: boolean;
  participants: CallParticipant[];
  pipSwapped: boolean;
  remoteMedia: Record<number, RemoteMediaState>;
  remoteStreams: Record<number, MediaStream>;
  speakerOn: boolean;
  speakerVolume: number;
  speakingIds: number[];
  startedAt: number | null;
  status: CallUiStatus;
  stuckCall: StuckCallInfo | null;
}

interface CallActions {
  clearRemoteMedia: (accountId: number) => void;
  reset: () => void;
  setActive: () => void;
  setActiveSpeaker: (accountId: number | null) => void;
  setCamOn: (on: boolean) => void;
  setConnecting: () => void;
  setError: (error: string | null) => void;
  setFacingMode: (mode: FacingMode) => void;
  setIceServers: (servers: IceServerConfig[]) => void;
  setIncoming: (payload: Extract<RealtimeEvent, { type: "incoming_call" }>) => void;
  setIncomingPreview: (preview: boolean) => void;
  setIncomingSilenced: (silenced: boolean) => void;
  setLocalStream: (stream: MediaStream | null) => void;
  setMicOn: (on: boolean) => void;
  setMinimized: (minimized: boolean) => void;
  setOutgoing: (opts: {
    callId: number;
    callType: CallKind;
    conversationId: number;
    iceServers: IceServerConfig[];
    initiatorId: number;
    participants: CallParticipant[];
  }) => void;
  setPipSwapped: (swapped: boolean) => void;
  setRemoteMedia: (accountId: number, media: RemoteMediaState) => void;
  setRemoteStream: (accountId: number, stream: MediaStream | null) => void;
  setSpeakerOn: (on: boolean) => void;
  setSpeakerVolume: (volume: number) => void;
  setSpeakingIds: (ids: number[]) => void;
  setStuckCall: (call: StuckCallInfo | null) => void;
  updateParticipantStatus: (accountId: number, status: string) => void;
}

export type CallState = CallData & CallActions;

const INITIAL_DATA: CallData = {
  activeSpeakerId: null,
  callId: null,
  callType: null,
  camOn: true,
  conversationId: null,
  error: null,
  facingMode: "user",
  iceServers: [],
  incomingPreview: false,
  incomingSilenced: false,
  initiatorId: null,
  initiatorName: null,
  initiatorUsername: null,
  localStream: null,
  micOn: true,
  minimized: false,
  participants: [],
  pipSwapped: false,
  remoteMedia: {},
  remoteStreams: {},
  speakerOn: true,
  speakerVolume: 1,
  speakingIds: [],
  startedAt: null,
  status: "idle",
  stuckCall: null,
};

export const useCallStore = create<CallState>((set) => ({
  ...INITIAL_DATA,
  clearRemoteMedia: (accountId) =>
    set((state) => {
      const next = { ...state.remoteMedia };
      delete next[accountId];
      return { remoteMedia: next };
    }),
  reset: () =>
    set((state) => ({
      ...INITIAL_DATA,
      error: state.error,
      remoteMedia: {},
      remoteStreams: {},
      speakerOn: state.speakerOn,
      speakerVolume: state.speakerOn ? 1 : SPEAKER_EARPIECE_VOLUME,
      speakingIds: [],
      stuckCall: state.stuckCall,
    })),
  setActive: () =>
    set((state) => ({
      startedAt: state.startedAt ?? Date.now(),
      status: "active",
    })),
  setActiveSpeaker: (accountId) => set({ activeSpeakerId: accountId }),
  setCamOn: (on) => set({ camOn: on }),
  setConnecting: () => set({ status: "connecting" }),
  setError: (error) => set({ error }),
  setFacingMode: (mode) => set({ facingMode: mode }),
  setIceServers: (servers) => set({ iceServers: servers }),
  setIncoming: (payload) =>
    set({
      callId: payload.call_id,
      callType: payload.kind === "video" ? "video" : "audio",
      conversationId: payload.conversation_id,
      error: null,
      incomingPreview: false,
      incomingSilenced: false,
      initiatorId: payload.initiator_account_id,
      initiatorName: payload.initiator_display_name ?? null,
      initiatorUsername: payload.initiator_username ?? null,
      minimized: false,
      status: "ringing-incoming",
      stuckCall: null,
    }),
  setIncomingPreview: (preview) =>
    set((state) => ({
      incomingPreview: preview,
      incomingSilenced: preview ? false : state.incomingSilenced,
    })),
  setIncomingSilenced: (silenced) =>
    set((state) => ({
      incomingPreview: silenced ? false : state.incomingPreview,
      incomingSilenced: silenced,
    })),
  setLocalStream: (stream) => set({ localStream: stream }),
  setMicOn: (on) => set({ micOn: on }),
  setMinimized: (minimized) => set({ minimized }),
  setOutgoing: ({ callId, callType, conversationId, iceServers, initiatorId, participants }) =>
    set({
      callId,
      callType,
      camOn: callType === "video",
      conversationId,
      error: null,
      facingMode: "user",
      iceServers,
      incomingPreview: false,
      incomingSilenced: false,
      initiatorId,
      minimized: false,
      participants,
      status: "ringing-outgoing",
      stuckCall: null,
    }),
  setPipSwapped: (swapped) => set({ pipSwapped: swapped }),
  setRemoteMedia: (accountId, media) =>
    set((state) => ({
      remoteMedia: { ...state.remoteMedia, [accountId]: media },
    })),
  setRemoteStream: (accountId, stream) =>
    set((state) => {
      const next = { ...state.remoteStreams };
      if (stream) {
        next[accountId] = stream;
      } else {
        delete next[accountId];
      }
      return { remoteStreams: next };
    }),
  setSpeakerOn: (on) => set({ speakerOn: on, speakerVolume: on ? 1 : SPEAKER_EARPIECE_VOLUME }),
  setSpeakerVolume: (volume) => set({ speakerVolume: Math.min(1, Math.max(0, volume)) }),
  setSpeakingIds: (ids) => set({ speakingIds: ids }),
  setStuckCall: (call) => set({ stuckCall: call }),
  updateParticipantStatus: (accountId, status) =>
    set((state) => ({
      participants: state.participants.map((row) =>
        row.account_id === accountId ? { ...row, status } : row,
      ),
    })),
}));

export function resetCallStore(): void {
  useCallStore.setState({ ...useCallStore.getState(), ...INITIAL_DATA, remoteMedia: {}, remoteStreams: {} });
}
