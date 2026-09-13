import { useState, type ReactNode } from "react";
import { useTranslation } from "react-i18next";
import { LayerHeader } from "@/app/navigation/layer-header";
import { useStartDirectChat } from "@/features/bots/api/queries";
import { ComposeDirectory } from "@/features/conversations/components/compose-directory";
import { conversationLayer, useLayerStore } from "@/shared/lib/navigation/layer-store";
import type { components } from "@/shared/lib/api/schema";

type Account = components["schemas"]["Account"];

export function NewMessagePanel(): ReactNode {
  const { t } = useTranslation();
  const [query, setQuery] = useState("");
  const start = useStartDirectChat();
  const openConversation = useLayerStore((state) => state.openConversation);

  const openAccount = (account: Account): void => {
    start.mutate(account.id, {
      onSuccess: (conversation) => {
        openConversation(conversationLayer(String(conversation.id), account.display_name));
      },
    });
  };

  return (
    <div
      className="flex h-full min-h-0 flex-col bg-[var(--surface-panel)]"
      data-compose-panel="message"
    >
      <LayerHeader title={t("compose.message")} />
      <ComposeDirectory
        busyId={start.isPending && typeof start.variables === "number" ? start.variables : null}
        collapsible
        onSelect={openAccount}
        query={query}
        selection="single"
        setQuery={setQuery}
      />
    </div>
  );
}
