import { useMemo } from "react";
import { Clock } from "lucide-react";
import { useTranslation } from "react-i18next";
import { useScheduledMessages } from "@/features/settings/api/queries";
import { scheduledMessagesLayer, useLayerStore } from "@/shared/lib/navigation/layer-store";
import { Button } from "@/shared/ui";
import { ICON_CLASS } from "@/shared/ui/metrics";

export function ConversationScheduledMessages({ conversationId }: { conversationId: number }) {
  const { t } = useTranslation();
  const query = useScheduledMessages();
  const pushLayer = useLayerStore((state) => state.pushLayer);
  const rows = useMemo(
    () =>
      (query.data?.scheduled_messages ?? []).filter(
        (row) => row.conversation_id === conversationId,
      ),
    [conversationId, query.data?.scheduled_messages],
  );

  if (rows.length === 0) {
    return null;
  }

  return (
    <Button
      className="w-full justify-start gap-[var(--space-2)] rounded-none border-t border-[var(--border-subtle)] px-[var(--space-4)]"
      data-conversation-scheduled-count=""
      onClick={() =>
        pushLayer(scheduledMessagesLayer(String(conversationId), t("settings.scheduled")))
      }
      type="button"
      variant="ghost"
    >
      <Clock className={ICON_CLASS} />
      {t("composer.scheduled_count", { count: rows.length })}
    </Button>
  );
}
