import { useState } from "react";
import { AlbumGrid } from "@/features/media/components/album-grid";
import { AttachmentFailed } from "@/features/media/components/attachment-failed";
import { AttachmentPending } from "@/features/media/components/attachment-pending";
import { DocumentBubble } from "@/features/media/components/document-bubble";
import { MediaLightbox } from "@/features/media/components/media-lightbox";
import { VideoBubble } from "@/features/media/components/video-bubble";
import { VoiceNote } from "@/features/media/components/voice-note";
import { useRetryAttachment } from "@/features/media/api/queries";
import { isImageAttachment, type Attachment } from "@/features/media/model/constants";

export function AttachmentBody({
  attachments,
  messageId,
}: {
  attachments: Attachment[];
  messageId: string;
}) {
  const [lightbox, setLightbox] = useState<number | null>(null);
  const retry = useRetryAttachment();
  if (attachments.length === 0) {
    return null;
  }
  const readyImages = attachments.filter(
    (item) => isImageAttachment(item) && item.processing_status === "ready",
  );
  const rest = attachments.filter((item) => !readyImages.some((image) => image.id === item.id));
  const visuals = attachments.filter(
    (item) =>
      (item.kind === "image" || item.kind === "video") && item.processing_status === "ready",
  );

  return (
    <div className="flex flex-col gap-[var(--space-2)]" data-attachment-body="">
      {readyImages.length > 0 ? (
        <AlbumGrid
          attachments={readyImages}
          onPhotoClick={(index) => {
            const target = readyImages[index];
            if (target) {
              setLightbox(visuals.findIndex((item) => item.id === target.id));
            }
          }}
        />
      ) : null}
      {rest.map((attachment) => {
        if (attachment.processing_status === "failed") {
          return (
            <AttachmentFailed
              attachment={attachment}
              key={attachment.id}
              onRetry={() => retry.mutate(attachment.id)}
            />
          );
        }
        if (attachment.processing_status === "pending") {
          return <AttachmentPending attachment={attachment} key={attachment.id} />;
        }
        if (attachment.kind === "video") {
          return <VideoBubble attachment={attachment} key={attachment.id} />;
        }
        if (attachment.kind === "voice") {
          return <VoiceNote attachment={attachment} key={attachment.id} messageId={messageId} />;
        }
        return <DocumentBubble attachment={attachment} key={attachment.id} />;
      })}
      <MediaLightbox
        attachments={visuals}
        initialIndex={lightbox ?? 0}
        onClose={() => setLightbox(null)}
        open={lightbox != null}
      />
    </div>
  );
}
