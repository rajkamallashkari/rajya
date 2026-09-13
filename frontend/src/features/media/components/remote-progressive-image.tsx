import { ProgressiveImage } from "@/features/media/components/progressive-image";
import { useMediaUrl } from "@/features/media/api/queries";
import { isImageAttachment, type Attachment } from "@/features/media/model/constants";

export function RemoteProgressiveImage({
  alt,
  attachment,
  className,
  onClick,
  wantFull = true,
}: {
  alt: string;
  attachment: Attachment;
  className?: string;
  onClick?: () => void;
  wantFull?: boolean;
}) {
  const image = isImageAttachment(attachment);
  const thumb = useMediaUrl(attachment.id, "thumb", attachment.processing_status === "ready");
  const full = useMediaUrl(
    attachment.id,
    "original",
    image || (wantFull && attachment.processing_status === "ready"),
  );
  const fullSrc = full.data?.url;
  let thumbSrc: string | null = null;
  if (thumb.data) {
    thumbSrc = thumb.data.url;
  }
  return (
    <ProgressiveImage
      alt={alt}
      blurhash={attachment.blurhash}
      className={className}
      fullSrc={fullSrc}
      height={attachment.height}
      onClick={onClick}
      thumbSrc={thumbSrc}
      width={attachment.width}
    />
  );
}
