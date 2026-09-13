import { useState } from "react";
import { useTranslation } from "react-i18next";
import {
  useCancelScheduledMessage,
  useSendScheduledMessageNow,
  useUpdateScheduledMessage,
} from "@/features/settings/api/queries";
import {
  ScheduledMessageEditor,
  type ScheduledEditorMode,
} from "@/features/settings/components/scheduled-message-editor";
import { useDateTimeFormatter } from "@/shared/hooks/use-date-time-formatter";
import type { components } from "@/shared/lib/api/schema";
import {
  ContextMenu,
  ContextMenuContent,
  ContextMenuItem,
  ContextMenuTrigger,
  ConversationIdentityRow,
  ListView,
  type ListViewStatus,
} from "@/shared/ui";
import { FOCUS_RING, WEIGHT_EMPHASIS } from "@/shared/ui/metrics";

type ScheduledMessage = components["schemas"]["ScheduledMessage"];

export function ScheduledMessageList({
  onRetry,
  rows,
  showConversationIdentity = true,
  status = "ready",
}: {
  onRetry?: () => void;
  rows: ScheduledMessage[];
  showConversationIdentity?: boolean;
  status?: ListViewStatus;
}) {
  const { t } = useTranslation();
  const formatDateTime = useDateTimeFormatter();
  const cancel = useCancelScheduledMessage();
  const sendNow = useSendScheduledMessageNow();
  const update = useUpdateScheduledMessage();
  const [editor, setEditor] = useState<{
    message: ScheduledMessage;
    mode: ScheduledEditorMode;
  } | null>(null);
  return (
    <>
      <ListView onRetry={onRetry} status={status}>
        <ul className="flex flex-col">
          {rows.map((row) => {
            const conversation = row.conversation ?? {
              id: row.conversation_id,
              kind: "group" as const,
              member_count: 0,
              title: t("settings.scheduled_unknown_chat"),
            };
            return (
              <ContextMenu key={row.id}>
                <ContextMenuTrigger asChild>
                  <li
                    aria-label={t("settings.scheduled_actions", { message: row.body })}
                    className={`flex gap-[var(--space-2)] border-b border-[var(--border-subtle)] py-[var(--space-list-y)] last:border-b-0 ${FOCUS_RING}`}
                    tabIndex={0}
                  >
                    {showConversationIdentity ? (
                      <div className="min-w-0 flex-1">
                        <ConversationIdentityRow
                          conversation={conversation}
                          openConversation
                          trailing={
                            <time
                              className="shrink-0 text-[length:var(--text-sm)] text-[var(--text-tertiary)]"
                              dateTime={row.scheduled_at}
                            >
                              {formatDateTime.dateTime(row.scheduled_at)}
                            </time>
                          }
                        />
                        <p className="line-clamp-2 whitespace-pre-wrap px-[var(--space-2)] text-[length:var(--text-sm)] text-[var(--text-secondary)]">
                          {row.body}
                        </p>
                      </div>
                    ) : (
                      <div className="min-w-0 flex-1">
                        <div className="flex items-baseline justify-between gap-[var(--space-3)]">
                          <p className={`truncate ${WEIGHT_EMPHASIS}`}>{row.body}</p>
                          <time
                            className="shrink-0 text-[length:var(--text-sm)] text-[var(--text-tertiary)]"
                            dateTime={row.scheduled_at}
                          >
                            {formatDateTime.dateTime(row.scheduled_at)}
                          </time>
                        </div>
                      </div>
                    )}
                  </li>
                </ContextMenuTrigger>
                <ContextMenuContent>
                  <ContextMenuItem onSelect={() => sendNow.mutate(row.id)}>
                    {t("settings.scheduled_send_now")}
                  </ContextMenuItem>
                  <ContextMenuItem onSelect={() => setEditor({ message: row, mode: "reschedule" })}>
                    {t("settings.scheduled_reschedule")}
                  </ContextMenuItem>
                  <ContextMenuItem onSelect={() => setEditor({ message: row, mode: "edit" })}>
                    {t("settings.scheduled_edit")}
                  </ContextMenuItem>
                  <ContextMenuItem
                    className="text-[var(--danger)]"
                    onSelect={() => cancel.mutate(row.id)}
                  >
                    {t("settings.scheduled_cancel")}
                  </ContextMenuItem>
                </ContextMenuContent>
              </ContextMenu>
            );
          })}
        </ul>
      </ListView>
      <ScheduledMessageEditor
        message={editor?.message ?? null}
        mode={editor?.mode ?? "edit"}
        onOpenChange={(open) => {
          if (!open) {
            setEditor(null);
          }
        }}
        onSave={(id, changes) => {
          update.mutate({ id, changes });
          setEditor(null);
        }}
      />
    </>
  );
}
