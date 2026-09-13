import { useEffect, useState } from "react";
import { ChevronLeft, ChevronRight, MessageSquare } from "lucide-react";
import { useTranslation } from "react-i18next";
import { useMediaUrl } from "@/features/media/api/queries";
import { nextLightboxZoom, wrapLightboxIndex } from "@/features/media/model/lightbox";
import { LIGHTBOX_KINDS, type Attachment, type GalleryAttachment } from "@/features/media/model/constants";
import { useDateTimeFormatter } from "@/shared/hooks/use-date-time-formatter";
import { Button, Dialog, DialogContent, DialogTitle, IconButton, Spinner } from "@/shared/ui";
import { ICON_CLASS } from "@/shared/ui/metrics";

type LightboxAttachment = Attachment & Partial<Pick<GalleryAttachment, "message_id" | "sender" | "sent_at">>;

function LightboxSlide({
  attachment,
  zoom,
}: {
  attachment: LightboxAttachment;
  zoom: number;
}) {
  const { t } = useTranslation();
  const original = useMediaUrl(attachment.id, "original");
  const thumb = useMediaUrl(attachment.id, "thumb");
  const src = original.data?.url ?? thumb.data?.url;
  const [failed, setFailed] = useState(false);
  useEffect(() => setFailed(false), [src]);

  if (original.isError && thumb.isError) {
    return <p className="text-[var(--text-inverse)]">{t("media.load_failed")}</p>;
  }
  if (!src) {
    return <Spinner label={t("media.loading")} />;
  }
  if (failed) {
    return <p className="text-[var(--text-inverse)]">{t("media.load_failed")}</p>;
  }
  if (attachment.kind === "video") {
    return (
      <video
        className="max-h-full max-w-full"
        controls
        onError={() => setFailed(true)}
        poster={thumb.data?.url}
        src={src}
        style={{ transform: `scale(${String(zoom)})` }}
      />
    );
  }
  return (
    <img
      alt={attachment.filename ?? t("media.photo")}
      className="max-h-full max-w-full object-contain"
      onError={() => setFailed(true)}
      src={src}
      style={{ transform: `scale(${String(zoom)})` }}
    />
  );
}

export function MediaLightbox({
  attachments,
  initialIndex = 0,
  onClose,
  open,
  onJump,
}: {
  attachments: LightboxAttachment[];
  initialIndex?: number;
  onClose: () => void;
  onJump?: (messageId: number) => void;
  open: boolean;
}) {
  const { t } = useTranslation();
  const formatDateTime = useDateTimeFormatter();
  const slides = attachments.filter(
    (item) =>
      LIGHTBOX_KINDS.has(item.kind) &&
      (item.kind === "image"
        ? item.processing_status !== "failed"
        : item.processing_status === "ready"),
  );
  const [index, setIndex] = useState(initialIndex);
  const [zoom, setZoom] = useState(1);

  useEffect(() => {
    setIndex(initialIndex);
    setZoom(1);
  }, [initialIndex, open]);

  if (slides.length === 0) {
    return null;
  }
  const current = slides[wrapLightboxIndex(index, slides.length)]!;
  const messageId = current.message_id;

  return (
    <Dialog
      onOpenChange={(next) => {
        if (!next) {
          onClose();
        }
      }}
      open={open}
    >
      <DialogContent
        className="flex h-full max-h-none w-full max-w-none translate-x-0 translate-y-0 inset-0 top-0 left-0 items-center justify-center rounded-none bg-[var(--overlay-scrim)] p-[var(--space-4)]"
        data-media-lightbox=""
        onDoubleClick={() => setZoom((value) => nextLightboxZoom(value))}
      >
        <DialogTitle className="sr-only">{t("media.lightbox")}</DialogTitle>
        <LightboxSlide attachment={current} zoom={zoom} />
        {slides.length > 1 ? (
          <>
            <IconButton
              aria-label={t("media.previous")}
              className="absolute left-[var(--space-4)] top-1/2 -translate-y-1/2"
              onClick={() => setIndex((value) => wrapLightboxIndex(value - 1, slides.length))}
            >
              <ChevronLeft className={ICON_CLASS} />
            </IconButton>
            <IconButton
              aria-label={t("media.next")}
              className="absolute right-[var(--space-4)] top-1/2 -translate-y-1/2"
              onClick={() => setIndex((value) => wrapLightboxIndex(value + 1, slides.length))}
            >
              <ChevronRight className={ICON_CLASS} />
            </IconButton>
          </>
        ) : null}
        <div className="absolute bottom-[var(--space-4)] flex flex-col items-center gap-[var(--space-1)] text-[length:var(--text-sm)] text-[var(--text-inverse)]">
          <p>{t("media.counter", { current: wrapLightboxIndex(index, slides.length) + 1, total: slides.length })}</p>
          {current.sender && current.sent_at ? (
            <p>{current.sender.display_name} · {formatDateTime.dateTime(current.sent_at)}</p>
          ) : null}
          {messageId && onJump ? (
            <Button onClick={() => onJump(messageId)} type="button" variant="secondary">
              <MessageSquare className={ICON_CLASS} />
              {t("media.jump_to_message")}
            </Button>
          ) : null}
        </div>
      </DialogContent>
    </Dialog>
  );
}
