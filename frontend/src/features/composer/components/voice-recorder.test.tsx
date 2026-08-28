import { act, fireEvent, render, screen } from "@testing-library/react";
import { afterEach, beforeEach, describe, expect, it, vi } from "vitest";
import { VoiceRecorder, VoiceWaveform } from "./voice-recorder";
import type { VoiceRecorderResult } from "@/features/composer/hooks/use-voice-recorder";
import { en } from "@/shared/lib/i18n/catalog";
import { FakeAudio } from "@/test/fake-audio";

function stub(overrides: Partial<VoiceRecorderResult> = {}): VoiceRecorderResult {
  return {
    canResume: false,
    cancel: vi.fn(),
    durationMs: 65_000,
    finalPeaks: [],
    mimeType: "audio/webm",
    pause: vi.fn(),
    peaks: [0.2, 0.8, 0.4, 0.9],
    previewBlob: null,
    resume: vi.fn(),
    start: vi.fn(async () => undefined),
    state: "recording",
    stop: vi.fn(),
    ...overrides,
  };
}

describe("VoiceWaveform", () => {
  it("renders bars and seeks from a click", () => {
    const { rerender } = render(<VoiceWaveform peaks={[0.2, 0.9]} />);
    fireEvent.click(document.querySelector("[data-waveform]") as HTMLElement);
    rerender(<VoiceWaveform peaks={[]} progress={0.5} />);
    const onSeek = vi.fn();
    rerender(<VoiceWaveform onSeek={onSeek} peaks={[0.2, 0.9, 0.4, 0.8]} progress={0.5} />);
    expect(document.querySelector("[data-waveform]")).toHaveAttribute("data-progress", "0.5");
    expect(screen.getByRole("slider", { name: en.composer.seek_preview })).toBeInTheDocument();
    const seekable = document.querySelector("[data-waveform]") as HTMLElement;
    vi.spyOn(seekable, "getBoundingClientRect").mockReturnValue({
      height: 28,
      width: 80,
      x: 0,
      y: 0,
      bottom: 28,
      left: 10,
      right: 90,
      top: 0,
      toJSON: () => ({}),
    });
    fireEvent.click(seekable, { clientX: 50 });
    fireEvent.click(seekable, { clientX: -20 });
    fireEvent.click(seekable, { clientX: 400 });
    expect(onSeek).toHaveBeenCalled();
  });
});

describe("VoiceRecorder", () => {
  beforeEach(() => {
    FakeAudio.reset();
    vi.stubGlobal("Audio", FakeAudio);
    vi.spyOn(URL, "createObjectURL").mockReturnValue("blob:voice-preview");
    vi.spyOn(URL, "revokeObjectURL").mockImplementation(() => undefined);
  });

  afterEach(() => {
    vi.unstubAllGlobals();
    vi.restoreAllMocks();
  });

  it("records, pauses, previews with elapsed clock, and discards", async () => {
    const recording = stub();
    const { rerender } = render(<VoiceRecorder recorder={recording} />);
    expect(screen.getByRole("status", { name: en.composer.recording })).toBeInTheDocument();
    expect(screen.getByRole("button", { name: en.composer.send_voice })).toHaveAttribute(
      "data-composer-primary",
      "send",
    );
    expect(document.querySelector("[data-voice-recorder]")).toHaveClass("h-[var(--control-height)]");
    expect(document.querySelector("[data-voice-slot='lead']")).toHaveClass("size-[var(--control-height)]");
    fireEvent.click(document.querySelector("[data-waveform]") as HTMLElement);
    fireEvent.click(screen.getByRole("button", { name: en.composer.pause_voice }));
    expect(recording.pause).toHaveBeenCalled();

    const paused = stub({ canResume: true, state: "paused", finalPeaks: [0.4, 0.6] });
    rerender(<VoiceRecorder recorder={paused} />);
    fireEvent.click(screen.getByRole("button", { name: en.composer.resume_voice }));
    expect(paused.resume).toHaveBeenCalled();

    const idle = stub({ state: "idle" });
    rerender(<VoiceRecorder recorder={idle} />);
    expect(document.querySelector("[data-voice-recorder]")).toBeNull();

    const pausedPreview = stub({
      canResume: true,
      previewBlob: new Blob(["x"]),
      state: "paused",
    });
    rerender(<VoiceRecorder recorder={pausedPreview} />);
    expect(screen.getByText("1:05")).toBeInTheDocument();
    expect(document.querySelector("[data-voice-slot='lead']")).toHaveClass("size-[var(--control-height)]");
    fireEvent.click(screen.getByRole("button", { name: en.composer.preview_voice }));
    act(() => {
      FakeAudio.broadcast("loadedmetadata", (audio) => {
        audio.duration = 65;
      });
      FakeAudio.broadcast("timeupdate", (audio) => {
        audio.currentTime = 5;
      });
    });
    expect(screen.getByText("0:05 / 1:05")).toBeInTheDocument();
    expect(document.querySelector("[data-voice-preview]")).toHaveAttribute("data-voice-preview", "playing");
    const wave = document.querySelector("[data-waveform]") as HTMLElement;
    vi.spyOn(wave, "getBoundingClientRect").mockReturnValue({
      height: 28,
      width: 100,
      x: 0,
      y: 0,
      bottom: 28,
      left: 0,
      right: 100,
      top: 0,
      toJSON: () => ({}),
    });
    fireEvent.click(wave, { clientX: 50 });
    expect(FakeAudio.instances.some((audio) => audio.currentTime === 32.5)).toBe(true);
    vi.spyOn(wave, "getBoundingClientRect").mockReturnValue({
      height: 28,
      width: 0,
      x: 0,
      y: 0,
      bottom: 28,
      left: 0,
      right: 0,
      top: 0,
      toJSON: () => ({}),
    });
    fireEvent.click(wave, { clientX: 10 });
    expect(FakeAudio.instances.some((audio) => audio.currentTime === 0)).toBe(true);
    fireEvent.click(screen.getByRole("button", { name: en.composer.stop_preview }));
    fireEvent.click(screen.getByRole("button", { name: en.composer.resume_voice }));
    expect(pausedPreview.resume).toHaveBeenCalled();
    fireEvent.click(screen.getByRole("button", { name: en.composer.send_voice }));
    fireEvent.click(screen.getByRole("button", { name: en.composer.discard_voice }));

    const live = stub();
    const onCancel = vi.fn();
    rerender(<VoiceRecorder onCancel={onCancel} recorder={live} />);
    fireEvent.click(screen.getByRole("button", { name: en.composer.discard_voice }));
    expect(onCancel).toHaveBeenCalled();
    expect(live.cancel).toHaveBeenCalled();
  });
});
