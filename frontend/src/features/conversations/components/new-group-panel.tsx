import { useState, type ReactNode } from "react";
import { useTranslation } from "react-i18next";
import { LayerHeader } from "@/app/navigation/layer-header";
import { useCreateGroup } from "@/features/conversations/api/queries";
import { ComposeDirectory } from "@/features/conversations/components/compose-directory";
import { enoughGroupMembers } from "@/features/conversations/model/compose";
import { GROUP_MIN_MEMBERS } from "@/features/conversations/model/settings";
import { conversationLayer, useLayerStore } from "@/shared/lib/navigation/layer-store";
import type { components } from "@/shared/lib/api/schema";
import { Button } from "@/shared/ui/button";
import { Input } from "@/shared/ui/input";

type Account = components["schemas"]["Account"];

export function NewGroupPanel(): ReactNode {
  const { t } = useTranslation();
  const [query, setQuery] = useState("");
  const [title, setTitle] = useState("");
  const [selected, setSelected] = useState<Account[]>([]);
  const createGroup = useCreateGroup();
  const openConversation = useLayerStore((state) => state.openConversation);
  const selectedIds = new Set(selected.map((account) => account.id));
  const canCreate = enoughGroupMembers(selected.length, GROUP_MIN_MEMBERS);

  const toggle = (account: Account): void => {
    setSelected((current) =>
      current.some((row) => row.id === account.id)
        ? current.filter((row) => row.id !== account.id)
        : [...current, account],
    );
  };

  return (
    <div
      className="flex h-full min-h-0 flex-col bg-[var(--surface-panel)]"
      data-compose-panel="group"
    >
      <LayerHeader title={t("compose.group")} />
      <div className="px-[var(--space-list-x)] pb-[var(--space-list-y)]">
        <Input
          aria-label={t("compose.group_name")}
          onChange={(event) => setTitle(event.target.value)}
          placeholder={t("compose.group_name")}
          value={title}
        />
      </div>
      <ComposeDirectory
        onSelect={toggle}
        query={query}
        selectedIds={selectedIds}
        selection="multi"
        setQuery={setQuery}
      />
      <div className="px-[var(--space-list-x)] py-[var(--space-list-y)]">
        <Button
          className="w-full"
          disabled={!canCreate || createGroup.isPending}
          onClick={() => {
            const trimmed = title.trim();
            createGroup.mutate(
              {
                account_ids: selected.map((account) => account.id),
                title: trimmed === "" ? undefined : trimmed,
              },
              {
                onSuccess: (conversation) => {
                  openConversation(
                    conversationLayer(
                      String(conversation.id),
                      conversation.title ?? t("conversations.untitled"),
                    ),
                  );
                },
              },
            );
          }}
          type="button"
        >
          {t("compose.create_group")}
        </Button>
      </div>
    </div>
  );
}
