import { useTranslation } from "react-i18next";
import { useConversations } from "@/features/conversations/api/queries";
import { conversationTitle } from "@/features/conversations/model/title";
import {
  useCancelScheduledMessage,
  useScheduledMessages,
  useSendScheduledMessageNow,
} from "@/features/settings/api/queries";
import { queryListStatus } from "@/features/settings/model/map-sessions";
import { Button, ListView } from "@/shared/ui";
import { WEIGHT_EMPHASIS } from "@/shared/ui/metrics";

export function ScheduledPanel() {
  const { t } = useTranslation();
  const scheduled = useScheduledMessages();
  const conversations = useConversations();
  const cancel = useCancelScheduledMessage();
  const sendNow = useSendScheduledMessageNow();
  const rows = scheduled.data?.scheduled_messages ?? [];
  const chats = conversations.data?.conversations ?? [];

  return (
    <div className="flex flex-col gap-[var(--control-gap)]" data-scheduled-panel="">
      <ListView
        onRetry={() => {
          void scheduled.refetch();
        }}
        status={queryListStatus(scheduled.isPending, scheduled.isError, rows.length === 0)}
      >
        <ul className="flex flex-col gap-[var(--space-3)]">
          {rows.map((row) => {
            const conversation = chats.find((chat) => chat.id === row.conversation_id);
            return (
              <li className="flex flex-col gap-[var(--space-2)]" key={row.id}>
                <p className={WEIGHT_EMPHASIS}>
                  {conversation
                    ? conversationTitle(conversation, t("settings.scheduled"))
                    : t("settings.scheduled")}
                </p>
                <p className="text-[var(--text-secondary)]">{row.body}</p>
                <p className="text-[length:var(--text-sm)] text-[var(--text-tertiary)]">
                  {row.scheduled_at}
                </p>
                <div className="flex flex-wrap gap-[var(--control-gap)]">
                  <Button onClick={() => sendNow.mutate(row.id)} type="button">
                    {t("settings.scheduled_send_now")}
                  </Button>
                  <Button onClick={() => cancel.mutate(row.id)} type="button" variant="danger">
                    {t("settings.scheduled_cancel")}
                  </Button>
                </div>
              </li>
            );
          })}
        </ul>
      </ListView>
    </div>
  );
}
