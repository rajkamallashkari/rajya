import { act, fireEvent, render, screen, waitFor } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import { afterEach, describe, expect, it, vi } from "vitest";
import { CallOverlays, TopCallBar } from "@/features/calls";
import { AudioDeviceMenu } from "@/features/calls/components/audio-device-menu";
import { CallControlBar } from "@/features/calls/components/call-control-bar";
import { CallParticipantRow } from "@/features/calls/components/call-participant-row";
import { FloatingVideoOverlay } from "@/features/calls/components/floating-video-overlay";
import { IncomingCallBanner } from "@/features/calls/components/incoming-call-banner";
import { MicStatusIcon } from "@/features/calls/components/mic-status-icon";
import { PipSelfView } from "@/features/calls/components/pip-self-view";
import { RemoteAudioSink } from "@/features/calls/components/remote-audio-sink";
import { VideoCallView } from "@/features/calls/components/video-call-view";
import { VoiceCallView } from "@/features/calls/components/voice-call-view";
import { CALL_CONTROLS_ARM_MS, RING_TIMEOUT_MS } from "@/features/calls/model/constants";
import { resetCallStore, useCallStore } from "@/features/calls/store/call-store";
import { useAccountsStore } from "@/features/auth/store/accounts-store";
import { en } from "@/shared/lib/i18n/catalog";
import { Button } from "@/shared/ui/button";
import { Toaster } from "@/shared/ui/toast";

const engine = vi.hoisted(() => ({
  acceptCall: vi.fn(),
  applyAudioOutputToElement: vi.fn(),
  cancelCall: vi.fn(),
  endCall: vi.fn(),
  endStuckCall: vi.fn(),
  flipCamera: vi.fn(),
  rejectCall: vi.fn(),
  startScreenShare: vi.fn(),
  stopScreenShare: vi.fn(),
  switchAudioInput: vi.fn(),
  switchAudioOutput: vi.fn(),
  toggleCamera: vi.fn(),
  toggleMic: vi.fn(),
  toggleSpeaker: vi.fn(),
}));

vi.mock("@/features/calls/lib", async () => {
  const actual = await vi.importActual<typeof import("@/features/calls/lib")>("@/features/calls/lib");
  return { ...actual, ...engine };
});

vi.mock("@/features/calls/lib/ringtone", () => ({
  startRingtone: vi.fn(),
  stopRingtone: vi.fn(),
}));

const flipCameraEnabled = vi.hoisted(() => ({ value: true }));

vi.mock("@/features/calls/hooks/use-can-flip-camera", () => ({
  useCanFlipCamera: () => flipCameraEnabled.value,
}));

function participant(accountId: number, status = "joined") {
  return { id: accountId, account_id: accountId, status, is_screen_sharing: false };
}

function liveVideo(): MediaStream {
  const track = { kind: "video", enabled: true, readyState: "live", stop: vi.fn() } as unknown as MediaStreamTrack;
  return {
    id: "live",
    getAudioTracks: () => [],
    getTracks: () => [track],
    getVideoTracks: () => [track],
  } as unknown as MediaStream;
}

function seedMe(): void {
  useAccountsStore.setState({
    accounts: [
      {
        displayName: "Ada",
        hasPasskey: true,
        hasPassword: true,
        id: 1,
        onboarded: true,
        token: "jwt",
        username: "ada",
      },
    ],
    activeAccountId: 1,
  });
}

describe("call UI", () => {
  afterEach(() => {
    resetCallStore();
    flipCameraEnabled.value = true;
    vi.clearAllMocks();
    vi.useRealTimers();
  });

  it("hides screen share in a group and exposes 1:1 controls", async () => {
    const user = userEvent.setup({ pointerEventsCheck: 0 });
    useCallStore.setState({
      callType: "video",
      camOn: true,
      isScreenSharing: false,
      micOn: true,
      participants: [participant(1), participant(2), participant(3)],
      status: "active",
    });
    const { rerender } = render(<CallControlBar showCameraFlip />);
    expect(screen.queryByRole("button", { name: en.calls.screen_share_start })).toBeNull();
    useCallStore.setState({
      participants: [participant(1), participant(2)],
      status: "active",
    });
    rerender(<CallControlBar showCameraFlip />);
    await user.click(screen.getByRole("button", { name: en.calls.screen_share_start }));
    expect(engine.startScreenShare).toHaveBeenCalled();
    useCallStore.setState({ isScreenSharing: true });
    rerender(<CallControlBar showCameraFlip />);
    await user.click(screen.getByRole("button", { name: en.calls.screen_share_stop }));
    expect(engine.stopScreenShare).toHaveBeenCalled();
    await user.click(screen.getByRole("button", { name: en.calls.video_off }));
    expect(engine.toggleCamera).toHaveBeenCalled();
    await user.click(screen.getByRole("button", { name: en.calls.flip_camera }));
    expect(engine.flipCamera).toHaveBeenCalled();
    await user.click(screen.getByRole("button", { name: en.calls.mute }));
    expect(engine.toggleMic).toHaveBeenCalled();
    await user.click(screen.getByRole("button", { name: en.calls.speaker_on }));
    expect(engine.toggleSpeaker).toHaveBeenCalled();
    fireEvent.contextMenu(screen.getByRole("button", { name: en.calls.mute }));
    useCallStore.setState({ camOn: false, micOn: false, speakerOn: false, status: "ringing-outgoing" });
    rerender(<CallControlBar showCameraFlip />);
    await user.click(screen.getByRole("button", { name: en.calls.end }));
    expect(engine.cancelCall).toHaveBeenCalled();
    useCallStore.setState({ status: "active" });
    rerender(<CallControlBar />);
    await user.click(screen.getByRole("button", { name: en.calls.end }));
    expect(engine.endCall).toHaveBeenCalled();
  });

  it("lists audio devices when the mute menu opens", async () => {
    const user = userEvent.setup({ pointerEventsCheck: 0 });
    Object.defineProperty(navigator, "mediaDevices", {
      configurable: true,
      value: {
        enumerateDevices: vi.fn(async () => [
          { deviceId: "in", kind: "audioinput", label: "Mic A" },
          { deviceId: "out", kind: "audiooutput", label: "Speaker A" },
        ]),
      },
    });
    render(
      <AudioDeviceMenu onOpenChange={() => undefined} open>
        <Button type="button">{"Open"}</Button>
      </AudioDeviceMenu>,
    );
    await user.click(await screen.findByRole("menuitem", { name: "Mic A" }));
    expect(engine.switchAudioInput).toHaveBeenCalledWith("in");
    render(
      <AudioDeviceMenu onOpenChange={() => undefined} open>
        <Button type="button">{"Open2"}</Button>
      </AudioDeviceMenu>,
    );
    await user.click(await screen.findByRole("menuitem", { name: "Speaker A" }));
    expect(engine.switchAudioOutput).toHaveBeenCalledWith("out");
    Object.defineProperty(navigator, "mediaDevices", {
      configurable: true,
      value: {
        enumerateDevices: vi.fn(async () => {
          throw new Error("denied");
        }),
      },
    });
    render(
      <AudioDeviceMenu onOpenChange={() => undefined} open>
        <Button type="button">{"Open3"}</Button>
      </AudioDeviceMenu>,
    );
    expect(await screen.findByText(en.calls.no_devices)).toBeInTheDocument();
    render(
      <AudioDeviceMenu onOpenChange={() => undefined} open={false}>
        <Button type="button">{"Closed"}</Button>
      </AudioDeviceMenu>,
    );
  });

  it("times out an unanswered incoming ring", () => {
    vi.useFakeTimers();
    useCallStore.setState({
      callType: "video",
      initiatorName: "Ada",
      initiatorUsername: "ada",
      status: "ringing-incoming",
    });
    const { unmount } = render(<IncomingCallBanner />);
    expect(screen.getByRole("dialog", { name: en.calls.incoming })).toBeInTheDocument();
    act(() => {
      vi.advanceTimersByTime(RING_TIMEOUT_MS);
    });
    expect(engine.rejectCall).toHaveBeenCalled();
    unmount();
  });

  it("previews, accepts, declines, and swipes away an incoming call", async () => {
    const user = userEvent.setup({ pointerEventsCheck: 0 });
    useCallStore.setState({
      callType: "audio",
      incomingPreview: true,
      initiatorName: null,
      initiatorUsername: null,
      status: "ringing-incoming",
    });
    const { rerender, unmount } = render(<IncomingCallBanner />);
    expect(screen.getByRole("dialog", { name: en.calls.incoming_preview })).toBeInTheDocument();
    await user.click(screen.getByRole("button", { name: en.calls.minimize_incoming }));
    expect(useCallStore.getState().incomingSilenced).toBe(true);
    useCallStore.setState({
      incomingPreview: true,
      incomingSilenced: false,
      initiatorName: "Ada",
      initiatorUsername: "ada",
      status: "ringing-incoming",
    });
    rerender(<IncomingCallBanner />);
    await user.click(screen.getByRole("button", { name: en.calls.accept }));
    expect(engine.acceptCall).toHaveBeenCalled();
    useCallStore.setState({ incomingPreview: true, status: "ringing-incoming" });
    rerender(<IncomingCallBanner />);
    await user.click(screen.getByRole("button", { name: en.calls.decline }));
    expect(engine.rejectCall).toHaveBeenCalled();
    useCallStore.setState({
      incomingPreview: false,
      incomingSilenced: false,
      initiatorUsername: "ada",
      status: "ringing-incoming",
    });
    rerender(<IncomingCallBanner />);
    const banner = screen.getByRole("dialog", { name: en.calls.incoming });
    fireEvent.pointerDown(banner, { clientX: 40, clientY: 80, pointerId: 1, button: 0 });
    fireEvent.pointerMove(banner, { clientX: 40, clientY: 10, pointerId: 1 });
    fireEvent.pointerUp(banner, { clientX: 40, clientY: 10, pointerId: 1 });
    expect(useCallStore.getState().incomingSilenced).toBe(true);
    useCallStore.setState({ incomingSilenced: true, status: "ringing-incoming" });
    rerender(<IncomingCallBanner />);
    expect(screen.queryByRole("dialog")).toBeNull();
    useCallStore.setState({ incomingPreview: false, incomingSilenced: false, status: "idle" });
    rerender(<IncomingCallBanner />);
    useCallStore.setState({
      callType: "audio",
      incomingPreview: false,
      incomingSilenced: false,
      initiatorUsername: "ada",
      status: "ringing-incoming",
    });
    rerender(<IncomingCallBanner />);
    await user.click(screen.getByRole("button", { name: en.calls.accept }));
    await user.click(screen.getByRole("button", { name: en.calls.decline }));
    unmount();
  });

  it("renders the voice surface and minimize paths", async () => {
    const user = userEvent.setup({ pointerEventsCheck: 0 });
    seedMe();
    useCallStore.setState({
      callType: "audio",
      initiatorId: 2,
      initiatorName: "Grace",
      minimized: false,
      participants: [participant(1), participant(2)],
      remoteMedia: { 2: { camOn: true, micOn: false } },
      speakingIds: [],
      status: "active",
    });
    const { rerender } = render(<VoiceCallView />);
    expect(screen.getByRole("dialog", { name: en.calls.title_audio })).toBeInTheDocument();
    fireEvent.keyDown(window, { key: "Escape" });
    expect(useCallStore.getState().minimized).toBe(true);
    useCallStore.setState({
      minimized: false,
      remoteMedia: { 2: { camOn: true, micOn: true } },
      speakingIds: [2],
      status: "connecting",
    });
    rerender(<VoiceCallView />);
    useCallStore.setState({ participants: [participant(1)], status: "ringing-outgoing" });
    rerender(<VoiceCallView />);
    expect(screen.getByText(en.calls.waiting)).toBeInTheDocument();
    await user.click(screen.getByRole("button", { name: en.calls.minimize }));
    expect(useCallStore.getState().minimized).toBe(true);
  });

  it("renders the video surface including the group grid", async () => {
    const user = userEvent.setup({ pointerEventsCheck: 0 });
    seedMe();
    const stream = liveVideo();
    HTMLMediaElement.prototype.play = vi.fn(async () => undefined);
    useCallStore.setState({
      activeSpeakerId: 2,
      callType: "video",
      camOn: true,
      initiatorId: 2,
      initiatorName: "Grace",
      isScreenSharing: false,
      localStream: stream,
      minimized: false,
      participants: [participant(1), participant(2)],
      pipSwapped: false,
      remoteMedia: { 2: { camOn: true, micOn: true } },
      remoteScreenStreams: { 2: stream },
      remoteStreams: { 2: stream },
      status: "active",
    });
    const { rerender } = render(<VideoCallView />);
    expect(screen.getByRole("dialog", { name: en.calls.title_video })).toBeInTheDocument();
    await user.click(screen.getByRole("button", { name: en.calls.pip_swap }));
    await user.click(screen.getByRole("button", { name: en.calls.show_controls }));
    await user.click(screen.getByRole("button", { name: en.calls.minimize }));
    expect(useCallStore.getState().minimized).toBe(true);
    useCallStore.setState({ minimized: false, status: "connecting" });
    rerender(<VideoCallView />);
    fireEvent.keyDown(window, { key: "Escape" });
    useCallStore.setState({
      minimized: false,
      pipSwapped: true,
      remoteStreams: { 2: stream, 3: stream },
      status: "ringing-outgoing",
    });
    rerender(<VideoCallView />);
    fireEvent.click(screen.getByRole("presentation"));
    useCallStore.setState({ callType: "audio", minimized: true, status: "active" });
    rerender(<VideoCallView />);
  });

  it("shows live, silenced, and stuck top bars", async () => {
    const user = userEvent.setup({ pointerEventsCheck: 0 });
    useCallStore.setState({
      callType: "audio",
      initiatorName: "Ada",
      micOn: true,
      minimized: true,
      status: "active",
    });
    const { rerender } = render(<TopCallBar />);
    await user.click(screen.getByRole("button", { name: /Maximize call/ }));
    expect(useCallStore.getState().minimized).toBe(false);
    useCallStore.setState({ callType: "audio", micOn: true, minimized: true, status: "ringing-outgoing" });
    rerender(<TopCallBar />);
    await user.click(screen.getByRole("button", { name: en.calls.mute }));
    await user.click(screen.getByRole("button", { name: en.calls.end }));
    expect(engine.cancelCall).toHaveBeenCalled();
    useCallStore.setState({ callType: "audio", micOn: false, minimized: true, status: "connecting" });
    rerender(<TopCallBar />);
    await user.click(screen.getByRole("button", { name: en.calls.end }));
    expect(engine.endCall).toHaveBeenCalled();
    useCallStore.setState({ callType: "video", minimized: true, status: "active" });
    rerender(<TopCallBar />);
    useCallStore.setState({
      callType: "video",
      incomingSilenced: true,
      initiatorName: null,
      status: "ringing-incoming",
    });
    rerender(<TopCallBar />);
    await user.click(screen.getByRole("button", { name: /Incoming video/ }));
    useCallStore.setState({ incomingSilenced: true, status: "ringing-incoming" });
    rerender(<TopCallBar />);
    await user.click(screen.getByRole("button", { name: en.calls.decline }));
    await user.click(screen.getByRole("button", { name: en.calls.accept }));
    useCallStore.setState({
      status: "idle",
      stuckCall: { callType: "video", conversationId: 1, id: 9, status: "active" },
    });
    rerender(<TopCallBar />);
    await user.click(screen.getByRole("button", { name: en.calls.stuck_end }));
    expect(engine.endStuckCall).toHaveBeenCalled();
    useCallStore.setState({
      stuckCall: { callType: "audio", conversationId: 1, id: 9, status: "active" },
    });
    rerender(<TopCallBar />);
    useCallStore.setState({ status: "idle", stuckCall: null });
    rerender(<TopCallBar />);
    expect(screen.queryByRole("status")).toBeNull();
  });

  it("swaps PiP, plays remote audio, and toasts call errors", async () => {
    const user = userEvent.setup({ pointerEventsCheck: 0 });
    HTMLMediaElement.prototype.play = vi.fn(async () => undefined);
    const stream = liveVideo();
    render(<MicStatusIcon status="idle" />);
    render(<MicStatusIcon status="muted" />);
    render(<MicStatusIcon status="speaking" />);
    render(
      <PipSelfView
        name="Ada"
        onSwap={() => useCallStore.getState().setPipSwapped(true)}
        stream={stream}
        videoOn
      />,
    );
    await user.click(screen.getByRole("button", { name: en.calls.pip_swap }));
    fireEvent.keyDown(screen.getByRole("button", { name: en.calls.pip_swap }), { key: "Enter" });
    fireEvent.keyDown(screen.getByRole("button", { name: en.calls.pip_swap }), { key: " " });
    fireEvent.pointerDown(screen.getByRole("button", { name: en.calls.pip_swap }), {
      clientX: 10,
      clientY: 10,
      pointerId: 1,
      button: 0,
    });
    fireEvent.pointerMove(screen.getByRole("button", { name: en.calls.pip_swap }), {
      clientX: 11,
      clientY: 80,
      pointerId: 1,
    });
    fireEvent.pointerUp(screen.getByRole("button", { name: en.calls.pip_swap }), { pointerId: 1 });
    fireEvent.pointerDown(screen.getByRole("button", { name: en.calls.pip_swap }), {
      clientX: 10,
      clientY: 10,
      pointerId: 1,
      button: 0,
    });
    fireEvent.pointerMove(screen.getByRole("button", { name: en.calls.pip_swap }), {
      clientX: 80,
      clientY: 11,
      pointerId: 1,
    });
    fireEvent.pointerUp(screen.getByRole("button", { name: en.calls.pip_swap }), { pointerId: 1 });
    fireEvent.pointerCancel(screen.getByRole("button", { name: en.calls.pip_swap }));
    render(<PipSelfView mirror={false} name="Ada" onSwap={() => undefined} stream={null} videoOn={false} />);
    useCallStore.setState({ remoteStreams: { 2: stream }, speakerVolume: 0.5 });
    render(<RemoteAudioSink />);
    expect(document.querySelector("[data-call-audio]")).not.toBeNull();
    render(
      <Toaster>
        <CallOverlays />
      </Toaster>,
    );
    act(() => {
      useCallStore.getState().setError("Boom");
    });
    await waitFor(() => {
      expect(useCallStore.getState().error).toBeNull();
    });
  });

  it("arms floating video controls then hangs up", () => {
    seedMe();
    HTMLMediaElement.prototype.play = vi.fn(async () => undefined);
    const stream = liveVideo();
    vi.useFakeTimers();
    useCallStore.setState({
      callType: "video",
      camOn: true,
      localStream: stream,
      micOn: true,
      minimized: true,
      remoteMedia: { 2: { camOn: false, micOn: true } },
      remoteScreenStreams: { 2: stream },
      remoteStreams: { 2: stream },
      status: "active",
    });
    const { rerender } = render(<FloatingVideoOverlay />);
    fireEvent.pointerDown(document.querySelector("[data-floating-drag]") as HTMLElement, {
      clientX: 5,
      clientY: 5,
      pointerId: 1,
      button: 0,
    });
    fireEvent.pointerUp(document.querySelector("[data-floating-drag]") as HTMLElement, { pointerId: 1 });
    act(() => {
      vi.advanceTimersByTime(CALL_CONTROLS_ARM_MS);
    });
    fireEvent.click(screen.getByRole("button", { name: en.calls.video_off }));
    fireEvent.click(screen.getByRole("button", { name: en.calls.mute }));
    fireEvent.click(screen.getByRole("button", { name: en.calls.flip_camera }));
    fireEvent.click(screen.getByRole("button", { name: en.calls.end }));
    expect(engine.endCall).toHaveBeenCalled();
    useCallStore.setState({ camOn: false, micOn: false, status: "ringing-outgoing" });
    rerender(<FloatingVideoOverlay />);
    fireEvent.pointerDown(document.querySelector("[data-floating-drag]") as HTMLElement, {
      clientX: 5,
      clientY: 5,
      pointerId: 1,
      button: 0,
    });
    fireEvent.pointerMove(document.querySelector("[data-floating-drag]") as HTMLElement, {
      clientX: 80,
      clientY: 80,
      pointerId: 1,
    });
    fireEvent.pointerUp(document.querySelector("[data-floating-drag]") as HTMLElement, { pointerId: 1 });
    useCallStore.setState({ minimized: true, remoteStreams: {}, status: "ringing-outgoing" });
    rerender(<FloatingVideoOverlay />);
    fireEvent.pointerDown(document.querySelector("[data-floating-drag]") as HTMLElement, {
      clientX: 5,
      clientY: 5,
      pointerId: 1,
      button: 0,
    });
    fireEvent.pointerUp(document.querySelector("[data-floating-drag]") as HTMLElement, { pointerId: 1 });
    act(() => {
      vi.advanceTimersByTime(CALL_CONTROLS_ARM_MS);
    });
    fireEvent.click(screen.getByRole("button", { name: en.calls.end }));
    expect(engine.cancelCall).toHaveBeenCalled();
    fireEvent.pointerDown(document, { clientX: 0, clientY: 0, pointerId: 1 });
    useCallStore.setState({ minimized: false });
    rerender(<FloatingVideoOverlay />);
  });

  it("covers remaining call UI branches", async () => {
    expect(typeof TopCallBar).toBe("function");
    expect(typeof CallOverlays).toBe("function");
    render(<CallParticipantRow micStatus="idle" name="Grace" username="grace" />);
    expect(screen.getByText("@grace")).toBeInTheDocument();
    Object.defineProperty(navigator, "mediaDevices", {
      configurable: true,
      value: {
        enumerateDevices: vi.fn(async () => [
          { deviceId: "in", kind: "audioinput", label: "" },
          { deviceId: "out", kind: "audiooutput", label: "" },
        ]),
      },
    });
    render(
      <AudioDeviceMenu onOpenChange={() => undefined} open>
        <Button type="button">{"Devices"}</Button>
      </AudioDeviceMenu>,
    );
    expect(await screen.findByRole("menuitem", { name: en.calls.microphone })).toBeInTheDocument();
    expect(screen.getByRole("menuitem", { name: en.calls.speaker })).toBeInTheDocument();
  });

  it("shows a video incoming preview and compact banner without a username", () => {
    useCallStore.setState({
      callType: "video",
      incomingPreview: true,
      initiatorName: "Ada",
      initiatorUsername: "ada",
      status: "ringing-incoming",
    });
    const { unmount: unmountPreview } = render(<IncomingCallBanner />);
    expect(screen.getByRole("dialog", { name: en.calls.incoming_preview })).toBeInTheDocument();
    unmountPreview();
    useCallStore.setState({
      callType: "video",
      incomingPreview: false,
      incomingSilenced: false,
      initiatorUsername: null,
      status: "ringing-incoming",
    });
    const { unmount } = render(<IncomingCallBanner />);
    expect(screen.getByRole("dialog", { name: en.calls.incoming })).toBeInTheDocument();
    expect(screen.queryByText("@ada")).toBeNull();
    const banner = screen.getByRole("dialog", { name: en.calls.incoming });
    fireEvent.pointerDown(banner, { clientX: 40, clientY: 80, pointerId: 1, button: 0 });
    fireEvent.pointerUp(banner, { clientX: 41, clientY: 81, pointerId: 1 });
    expect(useCallStore.getState().incomingPreview).toBe(true);
    unmount();
  });

  it("renders idle remote mics and video avatars when tracks are dead", async () => {
    const user = userEvent.setup({ pointerEventsCheck: 0 });
    seedMe();
    useCallStore.setState({
      callType: "audio",
      initiatorId: 2,
      initiatorName: null,
      minimized: false,
      participants: [participant(1), participant(2), participant(3)],
      remoteMedia: { 2: { camOn: true, micOn: true }, 3: { camOn: true, micOn: true } },
      speakingIds: [],
      status: "active",
    });
    const { unmount: unmountVoice } = render(<VoiceCallView />);
    expect(screen.getAllByLabelText(en.calls.mic_idle)).toHaveLength(2);
    unmountVoice();
    const dead = {
      id: "dead",
      getAudioTracks: () => [],
      getTracks: () => [],
      getVideoTracks: () => [{ kind: "video", readyState: "ended", stop: vi.fn() }],
    } as unknown as MediaStream;
    HTMLMediaElement.prototype.play = vi.fn(async () => undefined);
    useCallStore.setState({
      callType: "video",
      camOn: false,
      initiatorId: 2,
      initiatorName: "Grace",
      localStream: dead,
      minimized: false,
      participants: [participant(1), participant(2)],
      pipSwapped: false,
      remoteMedia: { 2: { camOn: false, micOn: true } },
      remoteStreams: { 2: dead },
      status: "active",
    });
    const { rerender, unmount } = render(<VideoCallView />);
    await user.click(screen.getByRole("button", { name: en.calls.show_controls }));
    await user.click(screen.getByRole("button", { name: en.calls.hide_controls }));
    useCallStore.setState({
      camOn: false,
      isScreenSharing: false,
      minimized: false,
      pipSwapped: false,
      remoteMedia: {},
      remoteStreams: {},
      status: "ringing-outgoing",
    });
    rerender(<VideoCallView />);
    useCallStore.setState({
      camOn: false,
      isScreenSharing: true,
      minimized: false,
      pipSwapped: true,
      remoteMedia: {},
      remoteStreams: {},
      status: "active",
    });
    rerender(<VideoCallView />);
    useCallStore.setState({
      initiatorName: null,
      minimized: false,
      participants: [participant(1), participant(2), participant(3), participant(4)],
      pipSwapped: false,
      remoteStreams: { 2: dead, 3: dead, 4: dead },
      status: "active",
    });
    rerender(<VideoCallView />);
    fireEvent.click(screen.getByRole("presentation"));
    unmount();
  });

  it("closes armed floating controls from the overlay grid", () => {
    seedMe();
    HTMLMediaElement.prototype.play = vi.fn(async () => undefined);
    flipCameraEnabled.value = false;
    vi.useFakeTimers();
    const stream = liveVideo();
    useCallStore.setState({
      callType: "video",
      camOn: true,
      localStream: stream,
      micOn: true,
      minimized: true,
      remoteStreams: {},
      status: "active",
    });
    const drag = () => document.querySelector("[data-floating-drag]") as HTMLElement;
    render(<FloatingVideoOverlay />);
    fireEvent.pointerDown(drag(), { clientX: 5, clientY: 5, pointerId: 1, button: 0 });
    fireEvent.pointerMove(drag(), { clientX: 80, clientY: 80, pointerId: 1 });
    fireEvent.pointerUp(drag(), { pointerId: 1 });
    fireEvent.pointerDown(drag(), { clientX: 5, clientY: 5, pointerId: 1, button: 0 });
    fireEvent.pointerUp(drag(), { pointerId: 1 });
    fireEvent.pointerDown(document, { clientX: 0, clientY: 0, pointerId: 2, button: 0 });
    fireEvent.pointerDown(drag(), { clientX: 5, clientY: 5, pointerId: 1, button: 0 });
    fireEvent.pointerUp(drag(), { pointerId: 1 });
    fireEvent.click(screen.getByRole("button", { name: en.calls.mute }));
    fireEvent.pointerDown(document.querySelector(".grid-cols-2") as HTMLElement, {
      clientX: 12,
      clientY: 12,
      pointerId: 1,
      button: 0,
    });
    act(() => {
      vi.advanceTimersByTime(CALL_CONTROLS_ARM_MS);
    });
    fireEvent.click(screen.getByRole("button", { name: en.calls.mute }));
    fireEvent.pointerDown(screen.getByRole("button", { name: en.calls.end }), {
      clientX: 8,
      clientY: 8,
      pointerId: 1,
      button: 0,
    });
    fireEvent.pointerDown(document.querySelector(".grid-cols-2") as HTMLElement, {
      clientX: 12,
      clientY: 12,
      pointerId: 1,
      button: 0,
    });
    expect(screen.queryByRole("button", { name: en.calls.end })).toBeNull();
    useCallStore.setState({ camOn: false, localStream: null });
  });
});
