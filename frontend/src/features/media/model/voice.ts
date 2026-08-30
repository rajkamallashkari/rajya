import { VOICE_PLAYBACK_RATES } from "@/features/media/model/constants";

export function nextPlaybackRate(current: number): number {
  const index = VOICE_PLAYBACK_RATES.findIndex((rate) => rate === current);
  const next = index < 0 ? 0 : (index + 1) % VOICE_PLAYBACK_RATES.length;
  return VOICE_PLAYBACK_RATES[next]!;
}

export function playbackRateLabel(rate: number): string {
  return `${String(rate)}×`;
}

export function voiceProgress(currentTime: number, duration: number): number {
  if (!(duration > 0)) {
    return 0;
  }
  return Math.min(1, Math.max(0, currentTime / duration));
}

export function seekFraction(clientX: number, left: number, width: number): number {
  if (!(width > 0)) {
    return 0;
  }
  return Math.min(1, Math.max(0, (clientX - left) / width));
}
