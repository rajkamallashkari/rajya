import { ProgressiveImage } from "@/features/media/components/progressive-image";
import { useMediaUrl } from "@/features/media/api/queries";
import type { Attachment } from "@/features/media/model/constants";

export function RemoteProgressiveImage({
  alt,
  attachment,
  onClick,
  wantFull = true,
}: {
  alt: string;
  attachment: Attachment;
  onClick?: () => void;
  wantFull?: boolean;
}) {
  const thumb = useMediaUrl(attachment.id, "thumb", attachment.processing_status === "ready");
  const full = useMediaUrl(
    attachment.id,
    "original",
    wantFull && attachment.processing_status === "ready",
  );
  let fullSrc: string | undefined;
  if (wantFull) {
    if (full.data) {
      fullSrc = full.data.url;
    }
  }
  let thumbSrc: string | null = null;
  if (thumb.data) {
    thumbSrc = thumb.data.url;
  }
  return (
    <ProgressiveImage
      alt={alt}
      blurhash={attachment.blurhash}
      fullSrc={fullSrc}
      height={attachment.height}
      onClick={onClick}
      thumbSrc={thumbSrc}
      width={attachment.width}
    />
  );
}
