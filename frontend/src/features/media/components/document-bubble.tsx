import { Download, File as FileIcon } from "lucide-react";
import { useTranslation } from "react-i18next";
import { useMediaUrl } from "@/features/media/api/queries";
import { displayFilename, fileKindKey, formatByteSize, truncateFilename } from "@/features/media/model/files";
import type { Attachment } from "@/features/media/model/constants";
import { IconButton } from "@/shared/ui";
import { ICON_CLASS } from "@/shared/ui/metrics";

function triggerDownload(url: string, filename: string): void {
  const link = document.createElement("a");
  link.href = url;
  link.download = filename;
  link.rel = "noopener";
  document.body.append(link);
  link.click();
  link.remove();
}

export function DocumentBubble({ attachment }: { attachment: Attachment }) {
  const { t } = useTranslation();
  const download = useMediaUrl(attachment.id, "original", attachment.processing_status !== "pending");
  const filename = displayFilename(attachment.filename, attachment.content_type);
  const kind = fileKindKey(filename);
  const size = formatByteSize(attachment.byte_size);

  return (
    <div
      className="flex min-w-0 max-w-[var(--bubble-max-width)] items-center gap-[var(--space-3)] rounded-[var(--radius-lg)] border border-[var(--border-subtle)] bg-[var(--surface-hover)] px-[var(--space-3)] py-[var(--space-2)]"
      data-document-bubble=""
    >
      <span className="flex size-[var(--space-10)] shrink-0 items-center justify-center rounded-[var(--radius-md)] bg-[var(--accent-subtle)] text-[var(--accent)]">
        <FileIcon className={ICON_CLASS} />
      </span>
      <div className="min-w-0 flex-1">
        <p className="truncate text-[length:var(--text-sm)]" title={filename}>
          {truncateFilename(filename)}
        </p>
        <p className="text-[length:var(--text-xs)] text-[var(--text-secondary)]">
          {t(`media.file_kind.${kind}`)}
          {" · "}
          {t(`media.size.${size.unit}`, { value: size.value })}
        </p>
      </div>
      <IconButton
        aria-label={t("media.download")}
        disabled={!download.data?.url}
        onClick={() => {
          if (download.data?.url) {
            triggerDownload(download.data.url, filename);
          }
        }}
      >
        <Download className={ICON_CLASS} />
      </IconButton>
    </div>
  );
}
