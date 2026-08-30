import { useEffect, useState } from "react";
import { ChevronLeft, ChevronRight } from "lucide-react";
import { useTranslation } from "react-i18next";
import { useMediaUrl } from "@/features/media/api/queries";
import { nextLightboxZoom, wrapLightboxIndex } from "@/features/media/model/lightbox";
import { LIGHTBOX_KINDS, type Attachment } from "@/features/media/model/constants";
import { Dialog, DialogContent, DialogTitle, IconButton } from "@/shared/ui";
import { ICON_CLASS } from "@/shared/ui/metrics";

function LightboxSlide({
  attachment,
  zoom,
}: {
  attachment: Attachment;
  zoom: number;
}) {
  const { t } = useTranslation();
  const original = useMediaUrl(attachment.id, "original");
  const thumb = useMediaUrl(attachment.id, "thumb");
  const src = original.data?.url ?? thumb.data?.url;
  if (!src) {
    return null;
  }
  if (attachment.kind === "video") {
    return (
      <video
        className="max-h-full max-w-full"
        controls
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
}: {
  attachments: Attachment[];
  initialIndex?: number;
  onClose: () => void;
  open: boolean;
}) {
  const { t } = useTranslation();
  const slides = attachments.filter((item) => LIGHTBOX_KINDS.has(item.kind));
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
        <p className="absolute bottom-[var(--space-4)] text-[length:var(--text-sm)] text-[var(--text-inverse)]">
          {t("media.counter", { current: wrapLightboxIndex(index, slides.length) + 1, total: slides.length })}
        </p>
      </DialogContent>
    </Dialog>
  );
}
