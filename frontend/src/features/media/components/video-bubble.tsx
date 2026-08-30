import { useState } from "react";
import { Play } from "lucide-react";
import { useTranslation } from "react-i18next";
import { formatVoiceDuration } from "@/features/composer/model/waveform";
import { MediaLightbox } from "@/features/media/components/media-lightbox";
import { RemoteProgressiveImage } from "@/features/media/components/remote-progressive-image";
import { VIDEO_DEFAULT_ASPECT, VIDEO_MAX_WIDTH_PX, type Attachment } from "@/features/media/model/constants";
import { Button } from "@/shared/ui";
import { ICON_CLASS } from "@/shared/ui/metrics";

export function VideoBubble({ attachment }: { attachment: Attachment }) {
  const { t } = useTranslation();
  const [open, setOpen] = useState(false);
  const ratio =
    attachment.width && attachment.height
      ? attachment.width / attachment.height
      : VIDEO_DEFAULT_ASPECT;
  return (
    <>
      <Button
        aria-label={t("media.play_video")}
        className="relative overflow-hidden rounded-[var(--radius-lg)] p-0"
        data-video-bubble=""
        onClick={() => setOpen(true)}
        style={{ aspectRatio: String(ratio), maxWidth: VIDEO_MAX_WIDTH_PX, width: "100%" }}
        type="button"
        variant="ghost"
      >
        {attachment.processing_status === "ready" ? (
          <RemoteProgressiveImage
            alt={t("media.video_thumb")}
            attachment={attachment}
            wantFull={false}
          />
        ) : (
          <span className="absolute inset-0 bg-[var(--surface-input)]" />
        )}
        <span className="absolute inset-0 flex items-center justify-center">
          <span className="flex size-[var(--space-12)] items-center justify-center rounded-[var(--radius-full)] bg-[var(--overlay-scrim)] text-[var(--text-inverse)]">
            <Play className={ICON_CLASS} />
          </span>
        </span>
        {attachment.duration_ms != null ? (
          <span className="absolute right-[var(--space-2)] bottom-[var(--space-2)] rounded-[var(--radius-sm)] bg-[var(--overlay-scrim)] px-[var(--space-1_5)] py-[var(--space-0_5)] text-[length:var(--text-xs)] text-[var(--text-inverse)]">
            {formatVoiceDuration(attachment.duration_ms)}
          </span>
        ) : null}
      </Button>
      <MediaLightbox
        attachments={[attachment]}
        onClose={() => setOpen(false)}
        open={open}
      />
    </>
  );
}
