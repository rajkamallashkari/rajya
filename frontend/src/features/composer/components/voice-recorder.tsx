import { Mic, Pause, Play, Send, Trash2 } from "lucide-react";
import { useCallback, useEffect, useRef, type MouseEvent } from "react";
import { useTranslation } from "react-i18next";
import { useVoicePreview } from "@/features/composer/hooks/use-voice-preview";
import type { VoiceRecorderResult } from "@/features/composer/hooks/use-voice-recorder";
import {
  MS_PER_SECOND,
  PREVIEW_PROGRESS_MAX,
  PREVIEW_PROGRESS_MIN,
} from "@/features/composer/model/constants";
import { drawWaveform, formatVoiceDuration } from "@/features/composer/model/waveform";
import { cn } from "@/shared/lib/cn";
import { haptic } from "@/shared/lib/haptic";
import { Button, IconButton } from "@/shared/ui";
import { ICON_CLASS } from "@/shared/ui/metrics";

export function VoiceWaveform({
  className,
  onSeek,
  peaks,
  progress = 0,
}: {
  className?: string;
  onSeek?: (fraction: number) => void;
  peaks: number[];
  progress?: number;
}) {
  const { t } = useTranslation();
  const canvasRef = useRef<HTMLCanvasElement>(null);
  const seekable = Boolean(onSeek);

  useEffect(() => {
    const canvas = canvasRef.current as HTMLCanvasElement;
    const paint = () => {
      drawWaveform(canvas, peaks, { progress });
    };
    paint();
    const observer = new ResizeObserver(paint);
    observer.observe(canvas);
    return () => observer.disconnect();
  }, [peaks, progress]);

  const onClick = (event: MouseEvent<HTMLCanvasElement>) => {
    if (!onSeek) {
      return;
    }
    const rect = event.currentTarget.getBoundingClientRect();
    const fraction = rect.width === 0 ? 0 : (event.clientX - rect.left) / rect.width;
    onSeek(Math.min(1, Math.max(0, fraction)));
  };

  return (
    <canvas
      aria-hidden={seekable ? undefined : true}
      aria-label={seekable ? t("composer.seek_preview") : undefined}
      aria-valuemax={seekable ? PREVIEW_PROGRESS_MAX : undefined}
      aria-valuemin={seekable ? PREVIEW_PROGRESS_MIN : undefined}
      aria-valuenow={seekable ? progress : undefined}
      className={cn(
        "block h-[var(--waveform-height)] min-h-[var(--waveform-height)] w-full min-w-0",
        seekable ? "cursor-pointer" : null,
        className,
      )}
      data-progress={String(progress)}
      data-waveform=""
      onClick={onClick}
      ref={canvasRef}
      role={seekable ? "slider" : undefined}
    />
  );
}

export function VoiceRecorder({
  onCancel,
  onSend,
  recorder,
}: {
  onCancel?: () => void;
  onSend?: () => void;
  recorder: VoiceRecorderResult;
}) {
  const { t } = useTranslation();
  const { durationMs, pause, peaks, previewBlob, resume, state } = recorder;
  const preview = useVoicePreview({ durationMs, previewBlob, state });
  const source = recorder.finalPeaks.length > 0 ? recorder.finalPeaks : peaks;
  const clock = preview.showElapsed
    ? t("composer.preview_clock", {
        elapsed: formatVoiceDuration(preview.previewTime * MS_PER_SECOND),
        total: formatVoiceDuration(preview.durationMs),
      })
    : formatVoiceDuration(durationMs);

  const discard = useCallback(() => {
    haptic();
    onCancel?.();
    recorder.cancel();
  }, [onCancel, recorder]);

  if (state === "idle") {
    return null;
  }

  return (
    <div
      className="flex h-[var(--control-height)] min-h-0 min-w-0 flex-1 items-center gap-[var(--control-gap-tight)]"
      data-voice-preview={previewBlob ? (preview.playing ? "playing" : "paused") : undefined}
      data-voice-recorder={state}
    >
      <IconButton aria-label={t("composer.discard_voice")} onClick={discard} type="button">
        <Trash2 className={ICON_CLASS} />
      </IconButton>
      <span
        className="inline-flex size-[var(--control-height)] shrink-0 items-center justify-center"
        data-voice-slot="lead"
      >
        {state === "recording" ? (
          <span
            aria-label={t("composer.recording")}
            className="voice-pulse inline-flex size-[var(--voice-dot-size)] rounded-[var(--radius-full)] bg-[var(--status-danger)]"
            role="status"
          />
        ) : previewBlob ? (
          <IconButton
            aria-label={preview.playing ? t("composer.stop_preview") : t("composer.preview_voice")}
            onClick={preview.toggle}
            type="button"
          >
            {preview.playing ? <Pause className={ICON_CLASS} /> : <Play className={ICON_CLASS} />}
          </IconButton>
        ) : (
          <IconButton
            aria-label={t("composer.resume_voice")}
            disabled={!recorder.canResume}
            onClick={resume}
            type="button"
          >
            <Mic className={ICON_CLASS} />
          </IconButton>
        )}
      </span>
      <div className="flex h-full min-h-0 min-w-0 flex-1 flex-col justify-center">
        <VoiceWaveform
          className="min-h-0 flex-1"
          onSeek={state === "paused" && previewBlob ? preview.seek : undefined}
          peaks={source}
          progress={preview.progress}
        />
        <span className="shrink-0 text-center text-[length:var(--text-xs)] leading-none text-[var(--text-secondary)] tabular-nums">
          {clock}
        </span>
      </div>
      {state === "recording" ? (
        <IconButton aria-label={t("composer.pause_voice")} onClick={pause} type="button">
          <Pause className={ICON_CLASS} />
        </IconButton>
      ) : previewBlob && recorder.canResume ? (
        <IconButton aria-label={t("composer.resume_voice")} onClick={resume} type="button">
          <Mic className={ICON_CLASS} />
        </IconButton>
      ) : null}
      <Button
        aria-label={t("composer.send_voice")}
        data-composer-primary="send"
        onClick={onSend}
        size="icon"
        type="button"
        variant="primary"
      >
        <Send className={ICON_CLASS} />
      </Button>
    </div>
  );
}
