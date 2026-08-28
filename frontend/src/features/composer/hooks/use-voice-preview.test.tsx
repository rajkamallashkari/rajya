import { act, renderHook } from "@testing-library/react";
import { afterEach, beforeEach, describe, expect, it, vi } from "vitest";
import { useVoicePreview } from "./use-voice-preview";
import type { VoiceRecorderState } from "@/features/composer/model/constants";
import { FakeAudio } from "@/test/fake-audio";

describe("useVoicePreview", () => {
  beforeEach(() => {
    FakeAudio.reset();
    vi.spyOn(URL, "createObjectURL").mockReturnValue("blob:voice-preview");
    vi.spyOn(URL, "revokeObjectURL").mockImplementation(() => undefined);
  });

  afterEach(() => {
    vi.restoreAllMocks();
  });

  it("no-ops without a blob and ignores seek while recording", async () => {
    const blob = new Blob(["x"]);
    const { rerender, result } = renderHook(
      (props: { durationMs: number; previewBlob: Blob | null; state: VoiceRecorderState }) =>
        useVoicePreview(props),
      { initialProps: { durationMs: 8_000, previewBlob: null, state: "paused" } },
    );
    act(() => {
      result.current.toggle();
      result.current.seek(0.5);
    });
    expect(result.current.playing).toBe(false);

    rerender({ durationMs: 8_000, previewBlob: blob, state: "recording" });
    act(() => {
      result.current.seek(0.4);
    });
    expect(FakeAudio.latest().currentTime).toBe(0);
  });

  it("plays, seeks, and falls back when metadata duration is unusable", async () => {
    const { rerender, result, unmount } = renderHook(
      (props: { durationMs: number; previewBlob: Blob | null; state: VoiceRecorderState }) =>
        useVoicePreview(props),
      {
        initialProps: {
          durationMs: 8_000,
          previewBlob: new Blob(["x"]),
          state: "paused",
        },
      },
    );

    FakeAudio.broadcast("loadedmetadata", (audio) => {
      audio.duration = Number.POSITIVE_INFINITY;
    });
    expect(result.current.durationMs).toBe(8_000);
    act(() => {
      result.current.seek(0.5);
    });
    act(() => {
      FakeAudio.broadcast("loadedmetadata", (audio) => {
        audio.duration = 10;
      });
    });
    expect(result.current.durationMs).toBe(10_000);

    await act(async () => {
      result.current.toggle();
    });
    expect(result.current.playing).toBe(true);
    expect(result.current.showElapsed).toBe(true);

    act(() => {
      FakeAudio.broadcast("timeupdate", (audio) => {
        audio.currentTime = 2;
      });
    });
    expect(result.current.previewTime).toBe(2);
    expect(result.current.progress).toBe(0.2);

    act(() => {
      result.current.seek(1.5);
      result.current.seek(-1);
      result.current.seek(0.5);
    });
    expect(FakeAudio.latest().currentTime).toBe(5);

    act(() => {
      result.current.toggle();
    });
    expect(result.current.playing).toBe(false);

    await act(async () => {
      result.current.toggle();
    });
    act(() => {
      FakeAudio.broadcast("ended");
    });
    expect(result.current.playing).toBe(false);
    expect(result.current.previewTime).toBe(0);

    FakeAudio.instances.forEach((audio) => {
      audio.playResult = Promise.reject(new Error("blocked"));
    });
    await act(async () => {
      result.current.toggle();
      await Promise.resolve();
    });
    expect(result.current.playing).toBe(false);

    rerender({ durationMs: 8_000, previewBlob: new Blob(["y"]), state: "paused" });
    expect(URL.revokeObjectURL).toHaveBeenCalled();
    unmount();
  });
});
