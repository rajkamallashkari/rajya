import { useTranslation } from "react-i18next";
import { LayerHeader } from "@/app/navigation/layer-header";
import { useScheduledMessages } from "@/features/settings/api/queries";
import { ScheduledMessageList } from "@/features/settings/components/scheduled-message-list";
import { queryListStatus } from "@/features/settings/model/map-sessions";
import { ConversationIdentityRow } from "@/shared/ui/conversation-identity-row";

export function ScheduledPanel({ conversationId }: { conversationId?: number } = {}) {
  const scheduled = useScheduledMessages();
  const allRows = scheduled.data?.scheduled_messages ?? [];
  const rows =
    conversationId == null
      ? allRows
      : allRows.filter((row) => row.conversation_id === conversationId);

  return (
    <div className="flex flex-col gap-[var(--control-gap)]" data-scheduled-panel="">
      {conversationId != null && rows[0]?.conversation ? (
        <ConversationIdentityRow
          className="px-[var(--space-2)]"
          conversation={rows[0].conversation}
          openConversation
        />
      ) : null}
      <ScheduledMessageList
        onRetry={() => {
          void scheduled.refetch();
        }}
        rows={rows}
        showConversationIdentity={conversationId == null}
        status={queryListStatus(scheduled.isPending, scheduled.isError, rows.length === 0)}
      />
    </div>
  );
}

export function ScheduledMessagesLayer({ conversationId }: { conversationId: number }) {
  const { t } = useTranslation();

  return (
    <div
      className="flex h-full min-h-0 flex-col bg-[var(--surface-panel)]"
      data-scheduled-conversation-id={conversationId}
      data-scheduled-messages-layer=""
    >
      <LayerHeader title={t("settings.scheduled")} />
      <div className="flex min-h-0 flex-1 flex-col overflow-y-auto px-[var(--space-list-x)] py-[var(--space-4)]">
        <ScheduledPanel conversationId={conversationId} />
      </div>
    </div>
  );
}
