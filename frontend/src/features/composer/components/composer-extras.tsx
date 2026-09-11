import { useEffect, useState } from "react";
import { File, X } from "lucide-react";
import { useTranslation } from "react-i18next";
import { isPreviewableName } from "@/features/media/model/upload";
import { IconButton } from "@/shared/ui";
import { ICON_CLASS } from "@/shared/ui/metrics";

export interface ComposerAttachment {
  file?: globalThis.File;
  id: string;
  name: string;
}

function ComposerAttachmentPreview({ attachment }: { attachment: ComposerAttachment }) {
  const [url, setUrl] = useState<string | null>(null);
  const previewable = isPreviewableName(attachment.name, attachment.file?.type);
  const visualKind = previewable
    ? attachment.file?.type.startsWith("video/") || /\.(mp4|webm)$/i.test(attachment.name)
      ? "video"
      : "image"
    : null;

  useEffect(() => {
    if (!attachment.file || !visualKind) {
      setUrl(null);
      return;
    }

    const nextUrl = URL.createObjectURL(attachment.file);
    setUrl(nextUrl);
    return () => URL.revokeObjectURL(nextUrl);
  }, [attachment.file, visualKind]);

  if (url && visualKind === "image") {
    return <img alt={attachment.name} className="size-full object-cover" src={url} />;
  }
  if (url && visualKind === "video") {
    return (
      <video
        aria-label={attachment.name}
        className="size-full object-cover"
        muted
        playsInline
        src={url}
      />
    );
  }
  return (
    <span className="flex size-full items-center justify-center bg-[var(--surface-input)]">
      <File className={ICON_CLASS} />
    </span>
  );
}

export function ComposerAttachmentChips({
  attachments,
  onRemove,
}: {
  attachments: ComposerAttachment[];
  onRemove?: (id: string) => void;
}) {
  const { t } = useTranslation();
  if (attachments.length === 0) {
    return null;
  }
  return (
    <div
      className="flex min-w-0 items-center gap-[var(--control-gap-tight)] overflow-x-auto border-t border-[var(--border-subtle)] px-[var(--space-4)] py-[var(--space-2)]"
      data-composer-attachments=""
    >
      {attachments.map((file) => (
        <div
          className="relative size-[var(--space-16)] shrink-0 overflow-hidden rounded-[var(--control-radius)] bg-[var(--surface-hover)]"
          key={file.id}
        >
          <ComposerAttachmentPreview attachment={file} />
          <span className="absolute inset-x-0 bottom-0 truncate bg-[var(--overlay-scrim)] px-[var(--space-1)] py-[var(--space-0_5)] text-center text-[length:var(--text-xs)] text-[var(--text-inverse)]">
            {file.name}
          </span>
          <IconButton
            aria-label={t("composer.remove_attachment", { name: file.name })}
            className="absolute top-[var(--space-0_5)] right-[var(--space-0_5)] rounded-[var(--radius-full)] bg-[var(--overlay-scrim)] text-[var(--text-inverse)]"
            onClick={() => onRemove?.(file.id)}
          >
            <X className={ICON_CLASS} />
          </IconButton>
        </div>
      ))}
    </div>
  );
}
