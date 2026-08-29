import { useCallback, useEffect, useRef, useState } from "react";
import {
  BYTE_MAX,
  FALLBACK_VOICE_MIME,
  MIME_CANDIDATES,
  VOICE_ANALYSER_FFT_SIZE,
  VOICE_DURATION_TICK_MS,
  VOICE_MAX_DURATION_MS,
  VOICE_PEAK_GAIN,
  VOICE_PEAK_MAX,
  VOICE_RECORDER_TIMESLICE_MS,
  VOICE_SAMPLE_INTERVAL_MS,
  type VoiceRecorderState,
} from "@/features/composer/model/constants";
import { downsamplePeaks } from "@/features/composer/model/waveform";

export interface MediaRecorderLike {
  ondataavailable: ((event: { data: Blob }) => void) | null;
  onstop: (() => void) | null;
  pause(): void;
  resume(): void;
  start(timeslice?: number): void;
  state: "inactive" | "recording" | "paused";
  stop(): void;
}

export interface AnalyserLike {
  fftSize: number;
  frequencyBinCount: number;
  getByteFrequencyData(data: Uint8Array): void;
}

export interface AudioContextLike {
  close(): Promise<void>;
  createAnalyser(): AnalyserLike;
  createMediaStreamSource(stream: MediaStream): { connect(node: AnalyserLike): void };
}

export interface VoiceRecorderMedia {
  audioContextFor(): AudioContextLike;
  getUserMedia(constraints: MediaStreamConstraints): Promise<MediaStream>;
  mediaRecorderFor(stream: MediaStream, mimeType: string): MediaRecorderLike;
  now(): number;
}

export interface VoiceRecorderResult {
  canResume: boolean;
  cancel: () => void;
  durationMs: number;
  finalPeaks: number[];
  mimeType: string;
  pause: () => void;
  peaks: number[];
  previewBlob: Blob | null;
  resume: () => void;
  start: () => Promise<void>;
  state: VoiceRecorderState;
  stop: () => void;
}

function isTypeSupported(mime: string): boolean {
  return (
    typeof MediaRecorder !== "undefined" &&
    typeof MediaRecorder.isTypeSupported === "function" &&
    MediaRecorder.isTypeSupported(mime)
  );
}

export function getSupportedMimeType(
  supported: (mime: string) => boolean = isTypeSupported,
): string {
  for (const mime of MIME_CANDIDATES) {
    if (supported(mime)) {
      return mime;
    }
  }
  return "";
}

export function readAnalyserPeak(analyser: AnalyserLike | null): number | null {
  if (!analyser) {
    return null;
  }
  const count = analyser.frequencyBinCount;
  if (count === 0) {
    return null;
  }
  const data = new Uint8Array(count);
  analyser.getByteFrequencyData(data);
  let sumSq = 0;
  for (const value of data) {
    const unit = value / BYTE_MAX;
    sumSq += unit * unit;
  }
  return Math.min(Math.sqrt(sumSq / count) * VOICE_PEAK_GAIN, VOICE_PEAK_MAX);
}

export const defaultVoiceMedia: VoiceRecorderMedia = {
  audioContextFor: () => new AudioContext() as unknown as AudioContextLike,
  getUserMedia: (constraints) => navigator.mediaDevices.getUserMedia(constraints),
  mediaRecorderFor: (stream, mimeType) =>
    (mimeType
      ? new MediaRecorder(stream, { mimeType })
      : new MediaRecorder(stream)) as unknown as MediaRecorderLike,
  now: () => Date.now(),
};

export function useVoiceRecorder(
  media: VoiceRecorderMedia = defaultVoiceMedia,
): VoiceRecorderResult {
  const mimeType = useRef(getSupportedMimeType()).current;
  const [state, setState] = useState<VoiceRecorderState>("idle");
  const [durationMs, setDurationMs] = useState(0);
  const [peaks, setPeaks] = useState<number[]>([]);
  const [previewBlob, setPreviewBlob] = useState<Blob | null>(null);
  const [finalPeaks, setFinalPeaks] = useState<number[]>([]);
  const [canResume, setCanResume] = useState(false);

  const streamRef = useRef<MediaStream | null>(null);
  const recorderRef = useRef<MediaRecorderLike | null>(null);
  const audioCtxRef = useRef<AudioContextLike | null>(null);
  const analyserRef = useRef<AnalyserLike | null>(null);
  const chunksRef = useRef<Blob[]>([]);
  const peaksRef = useRef<number[]>([]);
  const startTimeRef = useRef(0);
  const pausedAtRef = useRef(0);
  const pauseStartRef = useRef(0);
  const sampleTimerRef = useRef<ReturnType<typeof setInterval> | null>(null);
  const durationTimerRef = useRef<ReturnType<typeof setInterval> | null>(null);
  const autoStopTimerRef = useRef<ReturnType<typeof setTimeout> | null>(null);
  const stateRef = useRef<VoiceRecorderState>("idle");
  const stopRef = useRef<() => void>(() => undefined);

  stateRef.current = state;

  const stopTimers = useCallback(() => {
    if (sampleTimerRef.current) {
      clearInterval(sampleTimerRef.current);
    }
    if (durationTimerRef.current) {
      clearInterval(durationTimerRef.current);
    }
    if (autoStopTimerRef.current) {
      clearTimeout(autoStopTimerRef.current);
    }
    sampleTimerRef.current = null;
    durationTimerRef.current = null;
    autoStopTimerRef.current = null;
  }, []);

  const cleanup = useCallback(() => {
    stopTimers();
    streamRef.current?.getTracks().forEach((track) => track.stop());
    streamRef.current = null;
    void audioCtxRef.current?.close();
    audioCtxRef.current = null;
    analyserRef.current = null;
    recorderRef.current = null;
    chunksRef.current = [];
  }, [stopTimers]);

  const getElapsed = useCallback(() => {
    const pausedTime =
      pausedAtRef.current + (pauseStartRef.current > 0 ? media.now() - pauseStartRef.current : 0);
    return media.now() - startTimeRef.current - pausedTime;
  }, [media]);

  const sampleAmplitude = useCallback(() => {
    const peak = readAnalyserPeak(analyserRef.current);
    if (peak === null) {
      return;
    }
    peaksRef.current.push(peak);
    setPeaks([...peaksRef.current]);
  }, []);

  const resetToIdle = useCallback(() => {
    cleanup();
    peaksRef.current = [];
    pausedAtRef.current = 0;
    pauseStartRef.current = 0;
    setPeaks([]);
    setDurationMs(0);
    setPreviewBlob(null);
    setFinalPeaks([]);
    setCanResume(false);
    setState("idle");
  }, [cleanup]);

  const blobType = mimeType || FALLBACK_VOICE_MIME;

  const stop = useCallback(() => {
    const recorder = recorderRef.current;
    if (!recorder) {
      return;
    }
    stopTimers();
    streamRef.current?.getTracks().forEach((track) => track.stop());
    recorder.onstop = () => {
      const blob = new Blob(chunksRef.current, { type: blobType });
      setPreviewBlob(blob);
      setFinalPeaks(downsamplePeaks(peaksRef.current));
      setDurationMs(getElapsed());
      setCanResume(false);
      setState("paused");
    };
    if (recorder.state !== "inactive") {
      recorder.stop();
    }
  }, [blobType, getElapsed, stopTimers]);

  stopRef.current = stop;

  const pause = useCallback(() => {
    const recorder = recorderRef.current;
    if (!recorder || recorder.state !== "recording") {
      return;
    }
    recorder.pause();
    pauseStartRef.current = media.now();
    if (sampleTimerRef.current) {
      clearInterval(sampleTimerRef.current);
    }
    if (durationTimerRef.current) {
      clearInterval(durationTimerRef.current);
    }
    sampleTimerRef.current = null;
    durationTimerRef.current = null;
    setPreviewBlob(new Blob(chunksRef.current, { type: blobType }));
    setCanResume(true);
    setState("paused");
  }, [blobType, media]);

  const resume = useCallback(() => {
    const recorder = recorderRef.current;
    if (!recorder || recorder.state !== "paused") {
      return;
    }
    if (pauseStartRef.current > 0) {
      pausedAtRef.current += media.now() - pauseStartRef.current;
      pauseStartRef.current = 0;
    }
    recorder.resume();
    setPreviewBlob(null);
    setCanResume(false);
    setState("recording");
    sampleTimerRef.current = setInterval(sampleAmplitude, VOICE_SAMPLE_INTERVAL_MS);
    durationTimerRef.current = setInterval(() => {
      setDurationMs(getElapsed());
    }, VOICE_DURATION_TICK_MS);
  }, [getElapsed, media, sampleAmplitude]);

  const start = useCallback(async () => {
    if (stateRef.current !== "idle") {
      return;
    }
    let stream: MediaStream;
    try {
      stream = await media.getUserMedia({ audio: true, video: false });
    } catch {
      return;
    }
    streamRef.current = stream;
    chunksRef.current = [];
    peaksRef.current = [];
    pausedAtRef.current = 0;
    pauseStartRef.current = 0;
    startTimeRef.current = media.now();

    const audioCtx = media.audioContextFor();
    const source = audioCtx.createMediaStreamSource(stream);
    const analyser = audioCtx.createAnalyser();
    analyser.fftSize = VOICE_ANALYSER_FFT_SIZE;
    source.connect(analyser);
    audioCtxRef.current = audioCtx;
    analyserRef.current = analyser;

    const recorder = media.mediaRecorderFor(stream, mimeType);
    recorderRef.current = recorder;
    recorder.ondataavailable = (event) => {
      if (event.data.size > 0) {
        chunksRef.current.push(event.data);
      }
    };
    recorder.start(VOICE_RECORDER_TIMESLICE_MS);
    setState("recording");
    setDurationMs(0);
    setPeaks([]);
    setPreviewBlob(null);
    setFinalPeaks([]);
    setCanResume(false);
    sampleTimerRef.current = setInterval(sampleAmplitude, VOICE_SAMPLE_INTERVAL_MS);
    durationTimerRef.current = setInterval(() => {
      setDurationMs(getElapsed());
    }, VOICE_DURATION_TICK_MS);
    autoStopTimerRef.current = setTimeout(() => {
      const current = stateRef.current;
      if (current === "recording" || current === "paused") {
        stopRef.current();
      }
    }, VOICE_MAX_DURATION_MS);
  }, [getElapsed, media, mimeType, sampleAmplitude]);

  const cancel = useCallback(() => {
    resetToIdle();
  }, [resetToIdle]);

  useEffect(() => () => cleanup(), [cleanup]);

  return {
    canResume,
    cancel,
    durationMs,
    finalPeaks,
    mimeType,
    pause,
    peaks,
    previewBlob,
    resume,
    start,
    state,
    stop,
  };
}
