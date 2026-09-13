import type { ReactNode } from "react";
import { useTranslation } from "react-i18next";
import { conversationLayer, useLayerStore } from "@/shared/lib/navigation/layer-store";
import type { components } from "@/shared/lib/api/schema";
import { cn } from "@/shared/lib/cn";
import { AccountIdentityRow } from "@/shared/ui/account-identity-row";
import { Avatar } from "@/shared/ui/avatar";
import { Button } from "@/shared/ui/button";

export type ConversationIdentity = components["schemas"]["ConversationIdentity"];

type IdentityAction =
  | { onSelect: (conversation: ConversationIdentity) => void; openConversation?: never }
  | { onSelect?: never; openConversation: true }
  | { onSelect?: never; openConversation?: false };

export type ConversationIdentityRowProps = {
  ariaLabel?: string;
  className?: string;
  compact?: boolean;
  conversation: ConversationIdentity;
  disabled?: boolean;
  meta?: ReactNode;
  trailing?: ReactNode;
} & IdentityAction;

export function ConversationIdentityRow({
  ariaLabel,
  className,
  compact = false,
  conversation,
  disabled = false,
  meta,
  onSelect,
  openConversation = false,
  trailing,
}: ConversationIdentityRowProps): ReactNode {
  const { t } = useTranslation();
  const open = useLayerStore((state) => state.openConversation);
  const title =
    conversation.kind === "direct"
      ? (conversation.peer?.display_name ?? t("conversations.untitled"))
      : (conversation.title ?? t("conversations.untitled"));
  const activate = openConversation
    ? () => open(conversationLayer(String(conversation.id), title))
    : onSelect
      ? () => onSelect(conversation)
      : undefined;

  if (conversation.kind === "direct" && conversation.peer) {
    const action = activate ? { onSelect: () => activate() } : { openProfile: false as const };
    return (
      <AccountIdentityRow
        account={conversation.peer}
        ariaLabel={ariaLabel}
        className={className}
        compact={compact}
        disabled={disabled}
        meta={meta}
        trailing={trailing}
        {...action}
      />
    );
  }

  const memberCount = t("conversations.profile.members", { count: conversation.member_count });
  const content = (
    <>
      <Avatar
        className={compact ? "size-[var(--space-8)]" : undefined}
        name={title}
        src={conversation.avatar_url}
      />
      <span className="min-w-0 flex-1 text-left">
        <span className="block truncate">{title}</span>
        <span className="block truncate text-[length:var(--text-sm)] text-[var(--text-secondary)]">
          {memberCount}
        </span>
        {meta ? <span className="block min-w-0">{meta}</span> : null}
      </span>
    </>
  );

  return (
    <div
      className={cn("flex min-w-0 items-center gap-[var(--control-gap-tight)]", className)}
      data-conversation-identity-row=""
    >
      {activate ? (
        <Button
          aria-label={ariaLabel ?? `${title}, ${memberCount}`}
          className="h-auto min-w-0 flex-1 justify-start gap-[var(--control-gap-tight)] px-[var(--space-2)] py-[var(--space-2)]"
          data-conversation-identity-action={openConversation ? "open" : "select"}
          disabled={disabled}
          onClick={activate}
          type="button"
          variant="ghost"
        >
          {content}
        </Button>
      ) : (
        <div className="flex min-w-0 flex-1 items-center gap-[var(--control-gap-tight)]">
          {content}
        </div>
      )}
      {trailing}
    </div>
  );
}
