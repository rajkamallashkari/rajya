import { useCallback, useEffect, useRef, useState } from "react";
import type { VoiceRecorderState } from "@/features/composer/model/constants";
import { MS_PER_SECOND } from "@/features/composer/model/constants";
import {
  shouldShowPreviewElapsed,
  voicePreviewDurationSec,
  voicePreviewProgress,
} from "@/features/composer/model/waveform";

export function useVoicePreview({
  durationMs,
  previewBlob,
  state,
}: {
  durationMs: number;
  previewBlob: Blob | null;
  state: VoiceRecorderState;
}) {
  const [playing, setPlaying] = useState(false);
  const [previewTime, setPreviewTime] = useState(0);
  const [audioDuration, setAudioDuration] = useState(0);
  const audioRef = useRef<HTMLAudioElement | null>(null);

  useEffect(() => {
    setPlaying(false);
    setPreviewTime(0);
    setAudioDuration(0);
    if (!previewBlob) {
      audioRef.current = null;
      return;
    }
    const url = URL.createObjectURL(previewBlob);
    const audio = new Audio(url);
    audioRef.current = audio;
    const onMeta = () => {
      setAudioDuration(Number.isFinite(audio.duration) ? audio.duration : 0);
    };
    const onTime = () => {
      setPreviewTime(audio.currentTime);
    };
    const onEnded = () => {
      setPlaying(false);
      setPreviewTime(0);
    };
    audio.addEventListener("loadedmetadata", onMeta);
    audio.addEventListener("timeupdate", onTime);
    audio.addEventListener("ended", onEnded);
    return () => {
      audio.removeEventListener("loadedmetadata", onMeta);
      audio.removeEventListener("timeupdate", onTime);
      audio.removeEventListener("ended", onEnded);
      audio.pause();
      URL.revokeObjectURL(url);
      audioRef.current = null;
    };
  }, [previewBlob]);

  useEffect(() => {
    if (state !== "recording") {
      return;
    }
    audioRef.current?.pause();
    setPlaying(false);
    setPreviewTime(0);
  }, [state]);

  const toggle = useCallback(() => {
    const audio = audioRef.current;
    if (!audio) {
      return;
    }
    if (playing) {
      audio.pause();
      setPlaying(false);
      return;
    }
    setPlaying(true);
    void audio.play().then(
      () => undefined,
      () => {
        setPlaying(false);
      },
    );
  }, [playing]);

  const seek = useCallback(
    (fraction: number) => {
      const audio = audioRef.current;
      if (!audio || state !== "paused") {
        return;
      }
      const durationSec = voicePreviewDurationSec(
        Number.isFinite(audio.duration) ? audio.duration : 0,
        durationMs,
      );
      const next = Math.max(0, Math.min(1, fraction)) * durationSec;
      audio.currentTime = next;
      setPreviewTime(next);
    },
    [durationMs, state],
  );

  const durationSec = voicePreviewDurationSec(audioDuration, durationMs);
  return {
    durationMs: durationSec * MS_PER_SECOND,
    playing,
    previewTime,
    progress: voicePreviewProgress(state, previewTime, durationSec),
    seek,
    showElapsed: shouldShowPreviewElapsed(playing, previewTime),
    toggle,
  };
}
