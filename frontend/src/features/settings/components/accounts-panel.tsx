import { Check, LogOut } from "lucide-react";
import { useQueryClient } from "@tanstack/react-query";
import { type ReactNode } from "react";
import { useTranslation } from "react-i18next";
import { useAccountsStore } from "@/features/auth/store/accounts-store";
import { Avatar } from "@/shared/ui/avatar";
import { Button } from "@/shared/ui/button";
import { ICON_CLASS, WEIGHT_EMPHASIS } from "@/shared/ui/metrics";

export function AccountsPanel(): ReactNode {
  const { t } = useTranslation();
  const queryClient = useQueryClient();
  const accounts = useAccountsStore((state) => state.accounts);
  const activeAccountId = useAccountsStore((state) => state.activeAccountId);
  const setActive = useAccountsStore((state) => state.setActive);
  const removeAll = useAccountsStore((state) => state.removeAll);

  return (
    <div className="flex flex-col gap-[var(--control-gap)]" data-accounts-panel="">
      <ul className="flex flex-col gap-[var(--space-1)]">
        {accounts.map((account) => {
          const active = account.id === activeAccountId;
          return (
            <li key={account.id}>
              <Button
                aria-current={active ? "true" : undefined}
                className="h-auto w-full justify-start gap-[var(--control-gap)] px-[var(--space-list-x)] py-[var(--space-list-y)]"
                disabled={active}
                onClick={() => {
                  setActive(account.id);
                  void queryClient.resetQueries();
                }}
                type="button"
                variant="ghost"
              >
                <Avatar name={account.displayName} />
                <span className="min-w-0 flex-1 text-left">
                  <span className={`block truncate ${WEIGHT_EMPHASIS}`}>{account.displayName}</span>
                  <span className="block truncate text-[length:var(--text-sm)] text-[var(--text-secondary)]">
                    {t("auth.profile.handle", { username: account.username })}
                  </span>
                </span>
                {active ? <Check aria-hidden="true" className={ICON_CLASS} /> : null}
              </Button>
            </li>
          );
        })}
      </ul>
      <Button
        onClick={() => removeAll()}
        type="button"
        variant="danger"
      >
        <LogOut aria-hidden="true" className={ICON_CLASS} />
        {t("auth.accounts.logout_all")}
      </Button>
    </div>
  );
}
