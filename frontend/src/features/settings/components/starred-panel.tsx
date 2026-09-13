import { useTranslation } from "react-i18next";
import { useSavedMessages, useUnsaveMessage } from "@/features/settings/api/queries";
import { queryListStatus } from "@/features/settings/model/map-sessions";
import { useShellStore } from "@/features/settings/store/shell-store";
import { useDateTimeFormatter } from "@/shared/hooks/use-date-time-formatter";
import { conversationLayer, useLayerStore } from "@/shared/lib/navigation/layer-store";
import {
  ConversationIdentityRow,
  ContextMenu,
  ContextMenuContent,
  ContextMenuItem,
  ContextMenuTrigger,
  ListView,
} from "@/shared/ui";
import { WEIGHT_EMPHASIS } from "@/shared/ui/metrics";

export function StarredPanel() {
  const { t } = useTranslation();
  const formatDateTime = useDateTimeFormatter();
  const saved = useSavedMessages();
  const unsave = useUnsaveMessage();
  const openConversation = useLayerStore((state) => state.openConversation);
  const setDestination = useShellStore((state) => state.setDestination);
  const setProfileSettingsOpen = useShellStore((state) => state.setProfileSettingsOpen);
  const rows = saved.data?.saved_messages ?? [];

  return (
    <div className="flex flex-col gap-[var(--control-gap)]" data-starred-panel="">
      <ListView
        onRetry={() => {
          void saved.refetch();
        }}
        status={queryListStatus(saved.isPending, saved.isError, rows.length === 0)}
      >
        <ul className="flex flex-col">
          {rows.map((row) => {
            const content = row.message.body?.trim() || t("settings.starred_no_content");
            const sender = row.message.sender?.display_name ?? t("settings.starred_unknown_sender");
            const timestamp = row.message.created_at ?? row.created_at ?? "";
            const title = row.conversation_title ?? t("settings.starred_unknown_chat");
            const conversation = row.conversation ?? {
              id: row.message.conversation_id,
              kind: "group" as const,
              member_count: 0,
              title,
            };
            const openMessage = () => {
              setDestination("chats");
              setProfileSettingsOpen(false);
              openConversation(
                conversationLayer(
                  String(row.message.conversation_id),
                  title,
                  String(row.message.id),
                ),
              );
            };
            const unsaveMessage = () => unsave.mutate(row.message_id);
            return (
              <li
                className="flex items-start gap-[var(--space-2)] border-b border-[var(--border-subtle)] py-[var(--space-list-y)] last:border-b-0"
                key={row.id}
              >
                <ContextMenu>
                  <ContextMenuTrigger>
                    <ConversationIdentityRow
                      ariaLabel={t("settings.starred_open_message", { message: content })}
                      className="min-w-0 flex-1"
                      conversation={conversation}
                      meta={
                        <span className="block truncate text-[var(--text-secondary)]">
                          <span className={WEIGHT_EMPHASIS}>{sender}:</span> {content}
                        </span>
                      }
                      onSelect={openMessage}
                      trailing={
                        <time
                          className="shrink-0 text-[length:var(--text-sm)] text-[var(--text-tertiary)]"
                          dateTime={timestamp}
                        >
                          {timestamp ? formatDateTime.dateTime(timestamp) : ""}
                        </time>
                      }
                    />
                  </ContextMenuTrigger>
                  <ContextMenuContent>
                    <ContextMenuItem onSelect={unsaveMessage}>
                      {t("settings.starred_unsave")}
                    </ContextMenuItem>
                  </ContextMenuContent>
                </ContextMenu>
              </li>
            );
          })}
        </ul>
      </ListView>
    </div>
  );
}
