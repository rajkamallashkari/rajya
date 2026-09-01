import { type ReactNode } from "react";
import { useParams } from "react-router";
import { useTranslation } from "react-i18next";
import { useAdminTranscript } from "@/features/admin/api/queries";
import { queryListStatus } from "@/features/admin/model/display";
import { MessageContent } from "@/features/messages/components/message-content";
import { ListView } from "@/shared/ui";
import { WEIGHT_EMPHASIS } from "@/shared/ui/metrics";

export function AdminTranscriptPanel(): ReactNode {
  const { t } = useTranslation();
  const params = useParams();
  const conversationId = Number(params.conversationId);
  const page = useAdminTranscript(conversationId);
  const messages = page.data?.messages ?? [];
  return (
    <div className="flex flex-col gap-[var(--control-gap)]" data-admin-transcript="">
      <h1 className={WEIGHT_EMPHASIS}>{t("admin.transcript")}</h1>
      <ListView
        onRetry={() => void page.refetch()}
        status={queryListStatus(page.isPending, page.isError, messages.length === 0)}
      >
        <ol className="flex flex-col gap-[var(--space-4)]">
          {messages.map((message) => (
            <li key={message.id}>
              <MessageContent body={message.body ?? ""} />
            </li>
          ))}
        </ol>
      </ListView>
    </div>
  );
}
