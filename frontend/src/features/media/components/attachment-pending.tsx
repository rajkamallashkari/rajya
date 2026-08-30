import { useTranslation } from "react-i18next";
import { Spinner } from "@/shared/ui";
import { aspectStyle } from "@/features/media/model/constants";
import type { Attachment } from "@/features/media/model/constants";

export function AttachmentPending({ attachment }: { attachment: Attachment }) {
  const { t } = useTranslation();
  return (
    <div
      className="flex items-center justify-center bg-[var(--surface-input)]"
      data-attachment-pending=""
      style={aspectStyle(attachment.width, attachment.height)}
    >
      <Spinner label={t("media.processing")} />
    </div>
  );
}
