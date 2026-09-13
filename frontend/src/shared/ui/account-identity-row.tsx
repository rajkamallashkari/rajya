import type { ReactNode } from "react";
import type { components } from "@/shared/lib/api/schema";
import { cn } from "@/shared/lib/cn";
import { useLayerStore } from "@/shared/lib/navigation/layer-store";
import { Avatar } from "@/shared/ui/avatar";
import { Button } from "@/shared/ui/button";

type Account = components["schemas"]["Account"];

type IdentityAction =
  | { onSelect: (account: Account) => void; openProfile?: never }
  | { onSelect?: never; openProfile: true }
  | { onSelect?: never; openProfile?: false };

export type AccountIdentityRowProps = {
  account: Account;
  ariaLabel?: string;
  className?: string;
  compact?: boolean;
  disabled?: boolean;
  meta?: ReactNode;
  trailing?: ReactNode;
} & IdentityAction;

export function AccountIdentityRow({
  account,
  ariaLabel,
  className,
  compact = false,
  disabled = false,
  meta,
  onSelect,
  openProfile = false,
  trailing,
}: AccountIdentityRowProps): ReactNode {
  const pushLayer = useLayerStore((state) => state.pushLayer);
  const activate = openProfile
    ? () =>
        pushLayer({
          accountId: String(account.id),
          conversationId: "0",
          id: `account:${String(account.id)}`,
          kind: "profile",
          title: account.display_name,
        })
    : onSelect
      ? () => onSelect(account)
      : undefined;
  const content = (
    <>
      <Avatar
        className={compact ? "size-[var(--space-8)]" : undefined}
        name={account.display_name}
        src={account.avatar_url}
      />
      <span className="min-w-0 flex-1 text-left">
        <span className="block truncate">{account.display_name}</span>
        {!compact && account.username ? (
          <span className="block truncate text-[length:var(--text-sm)] text-[var(--text-secondary)]">
            @{account.username}
          </span>
        ) : null}
        {meta ? <span className="block min-w-0">{meta}</span> : null}
      </span>
    </>
  );

  return (
    <div
      className={cn("flex min-w-0 items-center gap-[var(--control-gap-tight)]", className)}
      data-account-identity-row=""
    >
      {activate ? (
        <Button
          aria-label={ariaLabel}
          className="h-auto min-w-0 flex-1 justify-start gap-[var(--control-gap-tight)] px-[var(--space-2)] py-[var(--space-2)]"
          data-account-identity-action={openProfile ? "profile" : "select"}
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
