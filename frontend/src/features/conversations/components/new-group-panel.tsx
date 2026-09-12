import { X } from "lucide-react";
import { useState, type ReactNode } from "react";
import { useTranslation } from "react-i18next";
import { LayerHeader } from "@/app/navigation/layer-header";
import { useCreateGroup } from "@/features/conversations/api/queries";
import { ComposeDirectory } from "@/features/conversations/components/compose-directory";
import { COMPOSE_AT, enoughGroupMembers } from "@/features/conversations/model/compose";
import { GROUP_MIN_MEMBERS } from "@/features/conversations/model/settings";
import { useMobileViewport } from "@/shared/hooks/use-mobile-viewport";
import { conversationLayer, useLayerStore } from "@/shared/lib/navigation/layer-store";
import type { components } from "@/shared/lib/api/schema";
import { Avatar } from "@/shared/ui/avatar";
import { Button } from "@/shared/ui/button";
import { IconButton } from "@/shared/ui/icon-button";
import { Input } from "@/shared/ui/input";
import { ICON_CLASS } from "@/shared/ui/metrics";

type Account = components["schemas"]["Account"];

export function NewGroupPanel(): ReactNode {
  const { t } = useTranslation();
  const [query, setQuery] = useState("");
  const [title, setTitle] = useState("");
  const [selected, setSelected] = useState<Account[]>([]);
  const [expandedChipId, setExpandedChipId] = useState<number | null>(null);
  const mobile = useMobileViewport();
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
      {selected.length > 0 ? (
        <div
          className="flex shrink-0 gap-[var(--control-gap)] overflow-x-auto px-[var(--space-list-x)] pb-[var(--space-list-y)]"
          data-selected-members=""
        >
          {selected.map((account) => (
            <SelectedMemberChip
              account={account}
              expanded={mobile && expandedChipId === account.id}
              key={account.id}
              mobile={mobile}
              onActivate={() => {
                if (mobile) {
                  setExpandedChipId((current) => (current === account.id ? null : account.id));
                } else {
                  toggle(account);
                }
              }}
              onRemove={() => {
                toggle(account);
                setExpandedChipId(null);
              }}
            />
          ))}
        </div>
      ) : null}
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

function SelectedMemberChip({
  account,
  expanded,
  mobile,
  onActivate,
  onRemove,
}: {
  account: Account;
  expanded: boolean;
  mobile: boolean;
  onActivate: () => void;
  onRemove: () => void;
}): ReactNode {
  const { t } = useTranslation();
  const details = (
    <span className="min-w-0 text-left text-[length:var(--text-xs)]">
      <span className="block truncate [font-weight:var(--font-weight-emphasis)]">
        {account.display_name}
      </span>
      {account.username ? (
        <span className="block truncate text-[var(--text-secondary)]">
          {`${COMPOSE_AT}${account.username}`}
        </span>
      ) : null}
    </span>
  );

  return (
    <div className="group flex shrink-0 items-center rounded-[var(--radius-full)] border border-[var(--border-default)] bg-[var(--surface-elevated)]">
      <Button
        aria-expanded={mobile ? expanded : undefined}
        aria-label={
          mobile
            ? t(expanded ? "compose.hide_member" : "compose.show_member", {
                name: account.display_name,
              })
            : t("compose.remove_member", { name: account.display_name })
        }
        className="h-auto gap-[var(--control-gap)] rounded-[var(--radius-full)] p-[var(--space-1)]"
        onClick={onActivate}
        type="button"
        variant="ghost"
      >
        <Avatar className="size-[var(--control-height)]" name={account.display_name} />
        {mobile ? (
          expanded ? (
            details
          ) : null
        ) : (
          <span className="max-w-0 overflow-hidden opacity-0 transition-[max-width,opacity] group-hover:max-w-[var(--panel-width)] group-hover:opacity-100 group-focus-within:max-w-[var(--panel-width)] group-focus-within:opacity-100">
            {details}
          </span>
        )}
      </Button>
      {mobile && expanded ? (
        <IconButton
          aria-label={t("compose.remove_member", { name: account.display_name })}
          className="mr-[var(--space-1)]"
          onClick={onRemove}
          type="button"
        >
          <X className={ICON_CLASS} />
        </IconButton>
      ) : null}
    </div>
  );
}
