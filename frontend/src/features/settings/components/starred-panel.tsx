import { useTranslation } from "react-i18next";
import { useSavedMessages, useUnsaveMessage } from "@/features/settings/api/queries";
import { queryListStatus } from "@/features/settings/model/map-sessions";
import { useShellStore } from "@/features/settings/store/shell-store";
import { conversationLayer, useLayerStore } from "@/shared/lib/navigation/layer-store";
import { Button, ListView } from "@/shared/ui";
import { WEIGHT_EMPHASIS } from "@/shared/ui/metrics";

export function StarredPanel() {
  const { t } = useTranslation();
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
            const title = row.message.body?.trim() || t("settings.starred");
            return (
              <li className="flex flex-col gap-[var(--space-2)] py-[var(--space-list-y)]" key={row.id}>
                <Button
                  className="h-auto w-full justify-start whitespace-normal"
                  onClick={() => {
                    setDestination("chats");
                    setProfileSettingsOpen(false);
                    openConversation(
                      conversationLayer(
                        String(row.message.conversation_id),
                        title,
                        String(row.message.id),
                      ),
                    );
                  }}
                  type="button"
                  variant="ghost"
                >
                  <span className={WEIGHT_EMPHASIS}>{title}</span>
                </Button>
                <Button
                  onClick={() => unsave.mutate(row.message_id)}
                  type="button"
                  variant="danger"
                >
                  {t("settings.starred_unsave")}
                </Button>
              </li>
            );
          })}
        </ul>
      </ListView>
    </div>
  );
}
