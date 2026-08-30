import { useTranslation } from "react-i18next";
import { X } from "lucide-react";
import { uploadProgressWidth, type PendingUpload } from "@/features/media/model/upload";
import { IconButton } from "@/shared/ui";
import { ICON_CLASS } from "@/shared/ui/metrics";

export function UploadPreview({
  onCancel,
  uploads,
}: {
  onCancel: (id: string) => void;
  uploads: PendingUpload[];
}) {
  const { t } = useTranslation();
  if (uploads.length === 0) {
    return null;
  }
  return (
    <div
      className="flex items-center gap-[var(--space-2)] overflow-x-auto border-t border-[var(--border-subtle)] px-[var(--space-4)] py-[var(--space-2)]"
      data-upload-preview=""
    >
      {uploads.map((upload) => (
        <div
          className="relative size-[var(--space-16)] shrink-0 overflow-hidden rounded-[var(--radius-lg)] bg-[var(--surface-input)]"
          data-upload-status={upload.status}
          key={upload.id}
        >
          {upload.previewUrl ? (
            <img alt={upload.name} className="h-full w-full object-cover" src={upload.previewUrl} />
          ) : (
            <span className="flex h-full items-center justify-center px-[var(--space-1)] text-center text-[length:var(--text-xs)]">
              {upload.name}
            </span>
          )}
          {upload.status === "uploading" || upload.status === "pending" ? (
            <span className="absolute inset-x-0 bottom-0 h-[var(--space-1)] bg-[var(--overlay-scrim)]">
              <span
                className="block h-full bg-[var(--accent)]"
                style={{ width: uploadProgressWidth(upload.progress) }}
              />
            </span>
          ) : null}
          {upload.status === "failed" ? (
            <span className="absolute inset-0 flex items-center justify-center bg-[var(--overlay-scrim)] text-[length:var(--text-xs)] text-[var(--status-danger)]">
              {t("media.failed")}
            </span>
          ) : null}
          <IconButton
            aria-label={t("composer.remove_attachment", { name: upload.name })}
            className="absolute top-[var(--space-0_5)] right-[var(--space-0_5)]"
            onClick={() => onCancel(upload.id)}
          >
            <X className={ICON_CLASS} />
          </IconButton>
        </div>
      ))}
    </div>
  );
}
