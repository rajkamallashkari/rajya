import {
  MS_PER_SECOND,
  PREVIEW_PROGRESS_MAX,
  PREVIEW_PROGRESS_MIN,
  SECONDS_PER_MINUTE,
  VOICE_PEAK_MAX,
  WAVEFORM_BAR_COUNT,
  WAVEFORM_FALLBACK_BAR_WIDTH,
  WAVEFORM_FALLBACK_FILL,
  WAVEFORM_MIN_AMPLITUDE,
  type VoiceRecorderState,
} from "@/features/composer/model/constants";

export function downsamplePeaks(
  raw: number[],
  targetCount: number = WAVEFORM_BAR_COUNT,
): number[] {
  if (raw.length === 0) {
    return [];
  }
  if (raw.length <= targetCount) {
    return raw.map((value) => Math.min(Math.max(value, 0), VOICE_PEAK_MAX));
  }

  const chunkSize = raw.length / targetCount;
  const result: number[] = [];
  for (let i = 0; i < targetCount; i += 1) {
    const start = Math.floor(i * chunkSize);
    const end = Math.min(Math.floor((i + 1) * chunkSize), raw.length);
    let sum = 0;
    for (let j = start; j < end; j += 1) {
      sum += raw[j] ?? 0;
    }
    const span = Math.max(end - start, 1);
    result.push(Math.min(Math.max(sum / span, 0), VOICE_PEAK_MAX));
  }
  return result;
}

export function displayPeaks(raw: number[]): number[] {
  if (raw.length === 0) {
    return Array.from({ length: WAVEFORM_BAR_COUNT }, () => WAVEFORM_MIN_AMPLITUDE);
  }
  const sampled = downsamplePeaks(raw, WAVEFORM_BAR_COUNT);
  const stretched =
    sampled.length >= WAVEFORM_BAR_COUNT ? sampled : stretchPeaks(sampled, WAVEFORM_BAR_COUNT);
  return stretched.map((value) => Math.max(value, WAVEFORM_MIN_AMPLITUDE));
}

export function stretchPeaks(sampled: number[], targetCount: number): number[] {
  if (sampled.length <= 1) {
    return Array.from({ length: targetCount }, () => sampled[0] ?? WAVEFORM_MIN_AMPLITUDE);
  }
  const result: number[] = [];
  const last = sampled.length - 1;
  for (let i = 0; i < targetCount; i += 1) {
    const t = (i / (targetCount - 1)) * last;
    const index = Math.floor(t);
    const next = Math.min(index + 1, last);
    const frac = t - index;
    result.push((sampled[index] ?? 0) * (1 - frac) + (sampled[next] ?? 0) * frac);
  }
  return result;
}

export function selectVoicePeaks(finalPeaks: number[], peaks: number[]): number[] {
  if (finalPeaks.length > 0) {
    return finalPeaks;
  }
  return peaks;
}

export function formatVoiceDuration(ms: number): string {
  const totalSec = Math.max(0, ms) / MS_PER_SECOND;
  const minutes = Math.floor(totalSec / SECONDS_PER_MINUTE);
  const seconds = Math.floor(totalSec % SECONDS_PER_MINUTE);
  return `${minutes}:${String(seconds).padStart(2, "0")}`;
}

export function voicePreviewDurationSec(audioDuration: number, durationMs: number): number {
  if (Number.isFinite(audioDuration) && audioDuration > PREVIEW_PROGRESS_MIN) {
    return audioDuration;
  }
  return Math.max(PREVIEW_PROGRESS_MIN, durationMs) / MS_PER_SECOND;
}

export function voicePreviewProgress(
  state: VoiceRecorderState,
  previewTimeSec: number,
  durationSec: number,
): number {
  if (state !== "paused" || durationSec <= PREVIEW_PROGRESS_MIN) {
    return PREVIEW_PROGRESS_MIN;
  }
  return Math.min(
    PREVIEW_PROGRESS_MAX,
    Math.max(PREVIEW_PROGRESS_MIN, previewTimeSec / durationSec),
  );
}

export function shouldShowPreviewElapsed(playing: boolean, previewTimeSec: number): boolean {
  return playing || previewTimeSec > PREVIEW_PROGRESS_MIN;
}

export function cssVar(element: Element, name: string, fallback: string): string {
  const value = getComputedStyle(element).getPropertyValue(name).trim();
  if (value.length === 0) {
    return fallback;
  }
  return value;
}

export function waveformBarWidthPx(element: Element): number {
  const parsed = Number.parseFloat(cssVar(element, "--waveform-bar-width", String(WAVEFORM_FALLBACK_BAR_WIDTH)));
  if (Number.isFinite(parsed) && parsed > 0) {
    return parsed;
  }
  return WAVEFORM_FALLBACK_BAR_WIDTH;
}

export function waveformFillColors(element: Element): { idle: string; played: string } {
  return {
    idle: cssVar(element, "--waveform-idle", WAVEFORM_FALLBACK_FILL),
    played: cssVar(element, "--accent", WAVEFORM_FALLBACK_FILL),
  };
}

export function waveformBarCount(width: number, barWidth: number, barGap: number): number {
  const step = barWidth + barGap;
  if (width <= 0 || step <= 0) {
    return 0;
  }
  return Math.max(1, Math.floor(width / step));
}

export function waveformBarAmplitude(
  peaks: number[],
  index: number,
  count: number,
  minAmplitude: number,
): number {
  if (peaks.length === 0 || count <= 0) {
    return minAmplitude;
  }
  const peakIndex = Math.min(peaks.length - 1, Math.floor((index / count) * peaks.length));
  return Math.max(peaks[peakIndex] ?? 0, minAmplitude);
}

export function waveformBarPlayed(index: number, count: number, progress: number): boolean {
  if (progress <= PREVIEW_PROGRESS_MIN || count <= 0) {
    return false;
  }
  return index / count <= progress;
}

export function fillWaveformBar(
  ctx: CanvasRenderingContext2D,
  x: number,
  y: number,
  barWidth: number,
  barH: number,
): void {
  if (typeof ctx.roundRect === "function") {
    ctx.beginPath();
    ctx.roundRect(x, y, barWidth, barH, barWidth / 2);
    ctx.fill();
    return;
  }
  ctx.fillRect(x, y, barWidth, barH);
}

export function canvas2dContext(canvas: HTMLCanvasElement): CanvasRenderingContext2D | null {
  try {
    return canvas.getContext("2d");
  } catch {
    return null;
  }
}

export function drawWaveform(
  canvas: HTMLCanvasElement,
  peaks: number[],
  options: { progress?: number } = {},
): void {
  const ctx = canvas2dContext(canvas);
  if (!ctx) {
    return;
  }
  const width = canvas.clientWidth;
  const height = canvas.clientHeight;
  if (width <= 0 || height <= 0) {
    return;
  }
  const dpr = window.devicePixelRatio || 1;
  const pixelWidth = Math.round(width * dpr);
  const pixelHeight = Math.round(height * dpr);
  if (canvas.width !== pixelWidth || canvas.height !== pixelHeight) {
    canvas.width = pixelWidth;
    canvas.height = pixelHeight;
  }
  ctx.setTransform(dpr, 0, 0, dpr, 0, 0);
  ctx.clearRect(0, 0, width, height);
  const barWidth = waveformBarWidthPx(canvas);
  const count = waveformBarCount(width, barWidth, barWidth);
  const { idle, played } = waveformFillColors(canvas);
  const progress = options.progress ?? PREVIEW_PROGRESS_MIN;
  const source = peaks.length > 0 ? peaks : displayPeaks([]);
  const step = barWidth + barWidth;
  const offsetX = (width - count * step) / 2;
  for (let i = 0; i < count; i += 1) {
    const amplitude = waveformBarAmplitude(source, i, count, WAVEFORM_MIN_AMPLITUDE);
    const barH = amplitude * height;
    ctx.fillStyle = waveformBarPlayed(i, count, progress) ? played : idle;
    fillWaveformBar(ctx, offsetX + i * step, (height - barH) / 2, barWidth, barH);
  }
}
