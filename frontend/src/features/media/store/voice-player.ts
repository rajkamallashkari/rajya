import { create } from "zustand";
import { nextPlaybackRate } from "@/features/media/model/voice";

interface VoicePlayerState {
  activeId: string | null;
  currentTime: number;
  cycleSpeed: () => void;
  duration: number;
  isPlaying: boolean;
  pause: () => void;
  play: (id: string, url: string) => void;
  playbackRate: number;
  seek: (seconds: number) => void;
}

let audio: HTMLAudioElement | null = null;

export function finiteMediaTime(value: number): number {
  return Number.isFinite(value) && value >= 0 ? value : 0;
}

function bindAudio(set: (partial: Partial<VoicePlayerState>) => void): HTMLAudioElement {
  if (audio) {
    return audio;
  }
  const element = new Audio();
  audio = element;
  element.addEventListener("timeupdate", () => {
    set({
      currentTime: finiteMediaTime(element.currentTime),
      duration: finiteMediaTime(element.duration),
    });
  });
  element.addEventListener("loadedmetadata", () => {
    set({ duration: finiteMediaTime(element.duration) });
  });
  element.addEventListener("ended", () => {
    set({ currentTime: 0, isPlaying: false });
  });
  return element;
}

export const useVoicePlayerStore = create<VoicePlayerState>((set, get) => ({
  activeId: null,
  currentTime: 0,
  duration: 0,
  isPlaying: false,
  playbackRate: 1,
  play: (id, url) => {
    const element = bindAudio(set);
    if (get().activeId !== id) {
      element.src = url;
      set({ activeId: id, currentTime: 0 });
    }
    element.playbackRate = get().playbackRate;
    void element.play().then(
      () => set({ isPlaying: true }),
      () => set({ isPlaying: false }),
    );
  },
  pause: () => {
    audio?.pause();
    set({ isPlaying: false });
  },
  seek: (seconds) => {
    if (!audio) {
      return;
    }
    audio.currentTime = finiteMediaTime(seconds);
    set({ currentTime: finiteMediaTime(audio.currentTime) });
  },
  cycleSpeed: () => {
    const playbackRate = nextPlaybackRate(get().playbackRate);
    if (audio) {
      audio.playbackRate = playbackRate;
    }
    set({ playbackRate });
  },
}));

export function resetVoicePlayer(): void {
  audio?.pause();
  audio = null;
  useVoicePlayerStore.setState({
    activeId: null,
    currentTime: 0,
    duration: 0,
    isPlaying: false,
    playbackRate: 1,
  });
}
