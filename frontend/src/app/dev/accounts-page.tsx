import { useEffect, useState } from "react";
import { useTranslation } from "react-i18next";
import {
  DEV_ACCOUNT_A_ID,
  DEV_ACCOUNT_A_USERNAME,
  DEV_ACCOUNT_B_ID,
  DEV_ACCOUNT_B_USERNAME,
} from "@/features/auth/model/dev-accounts";
import { useAccountsStore, type StoredAccount } from "@/features/auth/store/accounts-store";
import { listOutbox, queueOutbox, type OutboxRecord } from "@/shared/lib/db";
import { Button } from "@/shared/ui/button";

function seedAccount(id: number, username: string, displayName: string): StoredAccount {
  return {
    displayName,
    hasPasskey: false,
    hasPassword: false,
    id,
    onboarded: true,
    token: `dev-${id}`,
    username,
  };
}

export function AccountsDevPage() {
  const { t } = useTranslation();
  const accounts = useAccountsStore((state) => state.accounts);
  const activeAccountId = useAccountsStore((state) => state.activeAccountId);
  const upsertAccount = useAccountsStore((state) => state.upsertAccount);
  const setActive = useAccountsStore((state) => state.setActive);
  const [outbox, setOutbox] = useState<OutboxRecord[]>([]);

  useEffect(() => {
    if (activeAccountId === null) {
      setOutbox([]);
      return;
    }
    void listOutbox(activeAccountId).then(setOutbox);
  }, [activeAccountId]);

  const activate = (
    id: number,
    username: string,
    nameKey: "auth.accounts.seed_a" | "auth.accounts.seed_b",
  ) => {
    upsertAccount(seedAccount(id, username, t(nameKey)), true);
  };

  const queue = async () => {
    if (activeAccountId === null) {
      return;
    }
    await queueOutbox(activeAccountId, {
      attempts: 0,
      body: t("auth.accounts.queue"),
      conversationId: 1,
      createdAt: new Date().toISOString(),
      id: crypto.randomUUID(),
      status: "queued",
    });
    setOutbox(await listOutbox(activeAccountId));
  };

  return (
    <main className="flex min-h-[100dvh] flex-col gap-[var(--space-4)] bg-[var(--surface-app)] p-[var(--space-6)] text-[var(--text-primary)]">
      <h1 className="text-[length:var(--text-lg)] font-semibold">{t("auth.accounts.title")}</h1>
      <div className="flex flex-wrap gap-[var(--control-gap)]">
        <Button
          data-seed-account={DEV_ACCOUNT_A_ID}
          type="button"
          onClick={() => activate(DEV_ACCOUNT_A_ID, DEV_ACCOUNT_A_USERNAME, "auth.accounts.seed_a")}
        >
          {t("auth.accounts.seed_a")}
        </Button>
        <Button
          data-seed-account={DEV_ACCOUNT_B_ID}
          type="button"
          onClick={() => activate(DEV_ACCOUNT_B_ID, DEV_ACCOUNT_B_USERNAME, "auth.accounts.seed_b")}
        >
          {t("auth.accounts.seed_b")}
        </Button>
        <Button data-queue-outbox="" type="button" onClick={() => void queue()}>
          {t("auth.accounts.queue")}
        </Button>
      </div>
      <ul>
        {accounts.map((account) => (
          <li key={account.id}>
            <Button
              data-switch-account={account.id}
              type="button"
              variant={account.id === activeAccountId ? "primary" : "secondary"}
              onClick={() => setActive(account.id)}
            >
              {account.id === activeAccountId
                ? t("auth.accounts.active")
                : t("auth.accounts.switch", { name: account.displayName })}
            </Button>
          </li>
        ))}
      </ul>
      <div data-outbox-count={outbox.length} data-active-account={activeAccountId ?? ""}>
        {outbox.length === 0 ? (
          <p>{t("auth.accounts.outbox_empty")}</p>
        ) : (
          outbox.map((item) => (
            <p data-outbox-id={item.id} key={item.id}>
              {t("auth.accounts.outbox_item", { body: item.body })}
            </p>
          ))
        )}
      </div>
    </main>
  );
}
