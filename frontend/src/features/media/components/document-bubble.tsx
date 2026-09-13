import { Download } from "lucide-react";
import { useTranslation } from "react-i18next";
import { useMediaUrl } from "@/features/media/api/queries";
import {
  displayFilename,
  fileExtension,
  fileKindKey,
  formatByteSize,
  truncateFilename,
} from "@/features/media/model/files";
import type { Attachment } from "@/features/media/model/constants";
import { Button, IconButton } from "@/shared/ui";
import { ICON_CLASS } from "@/shared/ui/metrics";
import { showToast } from "@/shared/ui/toast";

function safeOpen(url: string): void {
  window.open(url, "_blank", "noopener,noreferrer");
}

async function fetchBlobUrl(url: string): Promise<string> {
  const response = await fetch(url);
  if (!response.ok) {
    throw new Error("file fetch failed");
  }
  return URL.createObjectURL(await response.blob());
}

function clickBlobUrl(blobUrl: string, filename?: string): void {
  const link = document.createElement("a");
  link.href = blobUrl;
  if (filename) {
    link.download = filename;
  } else {
    link.target = "_blank";
    link.rel = "noopener noreferrer";
  }
  document.body.append(link);
  link.click();
  link.remove();
  window.setTimeout(() => URL.revokeObjectURL(blobUrl), 0);
}

async function openFile(url: string): Promise<boolean> {
  try {
    clickBlobUrl(await fetchBlobUrl(url));
    return true;
  } catch {
    safeOpen(url);
    return false;
  }
}

async function triggerDownload(url: string, filename: string): Promise<boolean> {
  try {
    clickBlobUrl(await fetchBlobUrl(url), filename);
    return true;
  } catch {
    safeOpen(url);
    return false;
  }
}

export function DocumentBubble({ attachment }: { attachment: Attachment }) {
  const { t } = useTranslation();
  const download = useMediaUrl(attachment.id, "original");
  const filename = displayFilename(attachment.filename, attachment.content_type);
  const kind = fileKindKey(filename);
  const ext = fileExtension(filename);
  const size = formatByteSize(attachment.byte_size);
  // For generic files show the extension in uppercase; for known kinds use the i18n label.
  const typeLabel =
    kind !== "file" ? t(`media.file_kind.${kind}`) : ext ? ext.toUpperCase() : t("media.file_kind.file");

  const handleOpen = (): void => {
    if (download.data?.url) {
      void openFile(download.data.url).then((opened) => {
        if (!opened) {
          showToast({ title: t("media.file_fallback"), variant: "danger" });
        }
      });
    }
  };

  return (
    <div
      className="flex w-full items-center gap-[var(--space-3)] rounded-[var(--radius-lg)] border border-[var(--border-subtle)] bg-[var(--surface-hover)] px-[var(--space-3)] py-[var(--space-2)]"
      data-document-bubble=""
    >
      <Button
        aria-label={t("media.open_file")}
        className="h-auto min-w-0 flex-1 justify-start p-0 text-left"
        disabled={!download.data?.url}
        onClick={handleOpen}
        type="button"
        variant="ghost"
      >
        <span className="flex min-w-0 flex-col">
          <span className="truncate text-[length:var(--text-sm)]" title={filename}>
            {truncateFilename(filename)}
          </span>
          <span className="whitespace-nowrap text-[length:var(--text-xs)] text-[var(--text-secondary)]">
            {typeLabel}
            {" · "}
            {t(`media.size.${size.unit}`, { value: size.value })}
          </span>
        </span>
      </Button>
      <IconButton
        aria-label={t("media.download")}
        disabled={!download.data?.url}
        onClick={() => {
          if (download.data?.url) {
            void triggerDownload(download.data.url, filename).then((saved) => {
              if (!saved) {
                showToast({ title: t("media.file_fallback"), variant: "danger" });
              }
            });
          }
        }}
      >
        <Download className={ICON_CLASS} />
      </IconButton>
    </div>
  );
}

export { openFile, safeOpen, triggerDownload };
