import { act, renderHook } from "@testing-library/react";
import { afterEach, beforeEach, describe, expect, it, vi } from "vitest";
import {
  defaultVoiceMedia,
  getSupportedMimeType,
  readAnalyserPeak,
  useVoiceRecorder,
  type AnalyserLike,
  type MediaRecorderLike,
  type VoiceRecorderMedia,
} from "./use-voice-recorder";
import { MIME_CANDIDATES, VOICE_MAX_DURATION_MS } from "@/features/composer/model/constants";

class FakeRecorder implements MediaRecorderLike {
  public ondataavailable: ((event: { data: Blob }) => void) | null = null;
  public onstop: (() => void) | null = null;
  public state: MediaRecorderLike["state"] = "inactive";
  public emptyChunk: boolean;

  public constructor(emptyChunk = false) {
    this.emptyChunk = emptyChunk;
  }

  public start(): void {
    this.state = "recording";
  }

  public stop(): void {
    this.state = "inactive";
    this.ondataavailable?.({ data: new Blob(this.emptyChunk ? [] : ["x"]) });
    this.onstop?.();
  }

  public pause(): void {
    this.state = "paused";
  }

  public resume(): void {
    this.state = "recording";
  }
}

function createMedia({
  binCount = 4,
  emptyChunk = false,
  reject = false,
}: { binCount?: number; emptyChunk?: boolean; reject?: boolean } = {}): {
  media: VoiceRecorderMedia;
  recorder: FakeRecorder;
  trackStop: ReturnType<typeof vi.fn>;
} {
  const recorder = new FakeRecorder(emptyChunk);
  const trackStop = vi.fn();
  const analyser: AnalyserLike = {
    fftSize: 0,
    frequencyBinCount: binCount,
    getByteFrequencyData(data) {
      data.fill(128);
    },
  };
  const media: VoiceRecorderMedia = {
    audioContextFor: () => ({
      close: async () => undefined,
      createAnalyser: () => analyser,
      createMediaStreamSource: () => ({ connect: () => undefined }),
    }),
    getUserMedia: reject
      ? async () => {
          throw new Error("denied");
        }
      : async () => ({ getTracks: () => [{ stop: trackStop }] }) as unknown as MediaStream,
    mediaRecorderFor: () => recorder,
    now: () => Date.now(),
  };
  return { media, recorder, trackStop };
}

describe("getSupportedMimeType", () => {
  it("picks the first supported type or an empty string", () => {
    expect(getSupportedMimeType(() => false)).toBe("");
    expect(getSupportedMimeType((mime) => mime === MIME_CANDIDATES[1])).toBe(MIME_CANDIDATES[1]);
    expect(getSupportedMimeType()).toBe("");
  });
});

describe("useVoiceRecorder", () => {
  beforeEach(() => {
    vi.useFakeTimers();
  });

  afterEach(() => {
    vi.useRealTimers();
  });

  it("records, samples, pauses, resumes, stops, cancels, and auto-stops", async () => {
    const { media, trackStop } = createMedia();
    const { result, unmount } = renderHook(() => useVoiceRecorder(media));

    await act(async () => {
      await result.current.start();
    });
    expect(result.current.state).toBe("recording");

    await act(async () => {
      await result.current.start();
    });
    expect(result.current.state).toBe("recording");

    act(() => {
      vi.advanceTimersByTime(120);
    });
    expect(result.current.peaks.length).toBeGreaterThan(0);
    expect(result.current.durationMs).toBeGreaterThanOrEqual(0);

    act(() => {
      result.current.pause();
    });
    expect(result.current.state).toBe("paused");
    expect(result.current.canResume).toBe(true);
    act(() => {
      result.current.pause();
    });

    act(() => {
      result.current.resume();
    });
    expect(result.current.state).toBe("recording");
    act(() => {
      vi.advanceTimersByTime(120);
      result.current.resume();
    });

    act(() => {
      result.current.stop();
    });
    expect(result.current.state).toBe("paused");
    expect(result.current.canResume).toBe(false);
    expect(result.current.previewBlob).not.toBeNull();
    expect(trackStop).toHaveBeenCalled();

    act(() => {
      result.current.cancel();
    });
    expect(result.current.state).toBe("idle");

    const idle = createMedia();
    const idleHook = renderHook(() => useVoiceRecorder(idle.media));
    act(() => {
      idleHook.result.current.pause();
      idleHook.result.current.resume();
      idleHook.result.current.stop();
    });
    expect(idleHook.result.current.state).toBe("idle");

    const empty = createMedia({ binCount: 0, emptyChunk: true });
    const emptyHook = renderHook(() => useVoiceRecorder(empty.media));
    await act(async () => {
      await emptyHook.result.current.start();
    });
    act(() => {
      vi.advanceTimersByTime(120);
      emptyHook.result.current.stop();
    });
    expect(emptyHook.result.current.state).toBe("paused");

    const denied = createMedia({ reject: true });
    const deniedHook = renderHook(() => useVoiceRecorder(denied.media));
    await act(async () => {
      await deniedHook.result.current.start();
    });
    expect(deniedHook.result.current.state).toBe("idle");

    const auto = createMedia();
    const autoHook = renderHook(() => useVoiceRecorder(auto.media));
    await act(async () => {
      await autoHook.result.current.start();
    });
    act(() => {
      vi.advanceTimersByTime(VOICE_MAX_DURATION_MS + 1);
    });
    expect(autoHook.result.current.state).toBe("paused");

    const fallback = renderHook(() => useVoiceRecorder());
    await act(async () => {
      await fallback.result.current.start();
    });
    expect(fallback.result.current.state).toBe("idle");

    unmount();
    idleHook.unmount();
    emptyHook.unmount();
    deniedHook.unmount();
    autoHook.unmount();
    fallback.unmount();
  });

  it("reads analyser peaks and browser media factories", async () => {
    expect(readAnalyserPeak(null)).toBeNull();
    expect(
      readAnalyserPeak({
        fftSize: 0,
        frequencyBinCount: 0,
        getByteFrequencyData() {
          return undefined;
        },
      }),
    ).toBeNull();
    expect(
      readAnalyserPeak({
        fftSize: 0,
        frequencyBinCount: 2,
        getByteFrequencyData(data) {
          data.fill(128);
        },
      }),
    ).toBeGreaterThan(0);

    class BareRec {
      public constructor(public stream: MediaStream) {}
    }
    vi.stubGlobal("MediaRecorder", BareRec);
    expect(getSupportedMimeType()).toBe("");

    class Rec {
      public static isTypeSupported(mime: string): boolean {
        return mime === MIME_CANDIDATES[0];
      }

      public constructor(
        public stream: MediaStream,
        public options?: { mimeType?: string },
      ) {}
    }
    vi.stubGlobal("MediaRecorder", Rec);
    expect(getSupportedMimeType()).toBe(MIME_CANDIDATES[0]);
    Rec.isTypeSupported = () => false;
    expect(getSupportedMimeType()).toBe("");
    class Ctx {
      public close = async (): Promise<void> => undefined;
      public createAnalyser(): AnalyserLike {
        return { fftSize: 0, frequencyBinCount: 0, getByteFrequencyData() {} };
      }
      public createMediaStreamSource(): { connect: () => void } {
        return { connect: () => undefined };
      }
    }
    vi.stubGlobal("AudioContext", Ctx);
    const stream = { getTracks: () => [] } as unknown as MediaStream;
    expect(defaultVoiceMedia.mediaRecorderFor(stream, "audio/webm")).toBeInstanceOf(Rec);
    expect(defaultVoiceMedia.mediaRecorderFor(stream, "")).toBeInstanceOf(Rec);
    expect(getSupportedMimeType()).toBe("");
    expect(defaultVoiceMedia.now()).toBeTypeOf("number");
    expect(defaultVoiceMedia.audioContextFor()).toBeInstanceOf(Ctx);
    Object.defineProperty(navigator, "mediaDevices", {
      configurable: true,
      value: {
        getUserMedia: async () => stream,
      },
    });
    await expect(defaultVoiceMedia.getUserMedia({ audio: true })).resolves.toBe(stream);
    vi.unstubAllGlobals();

    const pausedStop = createMedia();
    const hook = renderHook(() => useVoiceRecorder(pausedStop.media));
    await act(async () => {
      await hook.result.current.start();
    });
    act(() => {
      hook.result.current.pause();
    });
    act(() => {
      vi.advanceTimersByTime(VOICE_MAX_DURATION_MS + 1);
    });
    expect(hook.result.current.state).toBe("paused");
    hook.unmount();
  });
});
