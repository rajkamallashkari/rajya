import { useCallback, useEffect, useRef, type MouseEvent } from "react";
import { useTranslation } from "react-i18next";
import { Pause, Play } from "lucide-react";
import { formatVoiceDuration } from "@/features/composer/model/waveform";
import { drawWaveform } from "@/features/composer/model/waveform";
import { displayPeaks } from "@/features/composer/model/waveform";
import { useMediaUrl } from "@/features/media/api/queries";
import { VOICE_MAX_WIDTH_PX, VOICE_MIN_WIDTH_PX, type Attachment } from "@/features/media/model/constants";
import { playbackRateLabel, seekFraction, voiceProgress } from "@/features/media/model/voice";
import { useVoicePlayerStore } from "@/features/media/store/voice-player";
import { Button, IconButton } from "@/shared/ui";
import { ICON_CLASS } from "@/shared/ui/metrics";

export function VoiceNote({
  attachment,
  messageId,
}: {
  attachment: Attachment;
  messageId: string;
}) {
  const { t } = useTranslation();
  const url = useMediaUrl(attachment.id, "original", attachment.processing_status === "ready");
  const activeId = useVoicePlayerStore((state) => state.activeId);
  const cycleSpeed = useVoicePlayerStore((state) => state.cycleSpeed);
  const currentTime = useVoicePlayerStore((state) => state.currentTime);
  const duration = useVoicePlayerStore((state) => state.duration);
  const isPlaying = useVoicePlayerStore((state) => state.isPlaying);
  const pause = useVoicePlayerStore((state) => state.pause);
  const play = useVoicePlayerStore((state) => state.play);
  const playbackRate = useVoicePlayerStore((state) => state.playbackRate);
  const seek = useVoicePlayerStore((state) => state.seek);
  const active = activeId === messageId;
  const playing = active && isPlaying;
  const totalSec = active && duration > 0 ? duration : (attachment.duration_ms ?? 0) / 1000;
  const progress = active ? voiceProgress(currentTime, totalSec) : 0;
  const canvasRef = useRef<HTMLCanvasElement>(null);
  const peaks = attachment.waveform && attachment.waveform.length > 0 ? attachment.waveform : displayPeaks([]);

  useEffect(() => {
    const canvas = canvasRef.current;
    if (canvas) {
      drawWaveform(canvas, peaks, { progress });
    }
  }, [peaks, progress]);

  const toggle = useCallback(() => {
    if (playing) {
      pause();
      return;
    }
    if (url.data?.url) {
      play(messageId, url.data.url);
    }
  }, [messageId, pause, play, playing, url.data?.url]);

  const onSeek = useCallback(
    (event: MouseEvent<HTMLCanvasElement>) => {
      const rect = event.currentTarget.getBoundingClientRect();
      const fraction = seekFraction(event.clientX, rect.left, rect.width);
      if (!active && url.data?.url) {
        play(messageId, url.data.url);
      }
      seek(fraction * (active && duration > 0 ? duration : totalSec));
    },
    [active, duration, messageId, play, seek, totalSec, url.data?.url],
  );

  return (
    <div
      className="flex items-center gap-[var(--space-2)] px-[var(--space-2)] py-[var(--space-2)]"
      data-voice-note=""
      style={{ maxWidth: VOICE_MAX_WIDTH_PX, minWidth: VOICE_MIN_WIDTH_PX }}
    >
      <IconButton
        aria-label={playing ? t("media.pause") : t("media.play")}
        className="rounded-[var(--radius-full)] bg-[var(--accent)] text-[var(--accent-contrast)]"
        onClick={toggle}
      >
        {playing ? <Pause className={ICON_CLASS} /> : <Play className={ICON_CLASS} />}
      </IconButton>
      <div className="flex min-w-0 flex-1 flex-col gap-[var(--space-1)]">
        <canvas
          aria-label={t("media.seek")}
          className="h-[var(--space-8)] w-full cursor-pointer"
          onClick={onSeek}
          ref={canvasRef}
        />
        <div className="flex items-center justify-between text-[length:var(--text-xs)] text-[var(--text-secondary)]">
          <span>{formatVoiceDuration((active ? currentTime : 0) * 1000)}</span>
          <Button
            aria-label={t("media.speed", { rate: playbackRateLabel(playbackRate) })}
            className="h-auto min-h-0 min-w-0 px-[var(--space-1_5)] py-[var(--space-0_5)] text-[length:var(--text-xs)]"
            onClick={cycleSpeed}
            type="button"
            variant="ghost"
          >
            {playbackRateLabel(playbackRate)}
          </Button>
          <span>{formatVoiceDuration(totalSec * 1000)}</span>
        </div>
      </div>
    </div>
  );
}
