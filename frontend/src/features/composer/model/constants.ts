export const VOICE_MAX_DURATION_MS = 300_000;
export const VOICE_SAMPLE_INTERVAL_MS = 60;
export const VOICE_DURATION_TICK_MS = 100;
export const VOICE_RECORDER_TIMESLICE_MS = 250;
export const VOICE_ANALYSER_FFT_SIZE = 256;
export const VOICE_PEAK_GAIN = 2;
export const VOICE_PEAK_MAX = 1;
export const WAVEFORM_BAR_COUNT = 32;
export const WAVEFORM_FALLBACK_BAR_WIDTH = 2;
export const WAVEFORM_FALLBACK_FILL = "currentColor";
export const WAVEFORM_MIN_AMPLITUDE = 0.08;
export const PREVIEW_PROGRESS_MIN = 0;
export const PREVIEW_PROGRESS_MAX = 1;
export const MS_PER_SECOND = 1000;
export const SECONDS_PER_MINUTE = 60;
export const BYTE_MAX = 255;
export const DURATION_PAD = 2;

export const MIME_CANDIDATES = [
  "audio/webm;codecs=opus",
  "audio/webm",
  "audio/mp4;codecs=aac",
  "audio/mp4",
  "audio/ogg;codecs=opus",
] as const;

export const FALLBACK_VOICE_MIME = "audio/webm";

export type VoiceRecorderState = "idle" | "recording" | "paused";
