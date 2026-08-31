import { useEffect, useState } from "react";
import { useTranslation } from "react-i18next";
import { createBlock, destroyBlock } from "@/features/auth/api/blocks";
import { fetchAccount } from "@/features/auth/api/identity";
import { disclosesSharedMemory, MemoryDisclosure } from "@/features/bots";
import { Button } from "@/shared/ui/button";
import { EmptyState } from "@/shared/ui/empty-state";

export function AccountProfile({
  accountId,
  initiallyBlocked = false,
}: {
  accountId: number;
  initiallyBlocked?: boolean;
}) {
  const { t } = useTranslation();
  const [missing, setMissing] = useState(false);
  const [blocked, setBlocked] = useState(initiallyBlocked);
  const [name, setName] = useState<string | null>(null);
  const [sharedMemory, setSharedMemory] = useState(false);

  useEffect(() => {
    void fetchAccount(accountId).then((result) => {
      if (result.missing) {
        setMissing(true);
        return;
      }
      setMissing(false);
      setName(result.account.display_name);
      setSharedMemory(disclosesSharedMemory(result.account));
    });
  }, [accountId]);

  const onToggle = async () => {
    try {
      if (blocked) {
        await destroyBlock(accountId);
        setBlocked(false);
        return;
      }
      await createBlock(accountId);
      setBlocked(true);
    } catch {
      return;
    }
  };

  if (missing) {
    return (
      <EmptyState
        title={t("auth.profile.missing")}
        description={t("auth.profile.missing_description")}
      />
    );
  }

  return (
    <div className="flex flex-col items-start gap-[var(--space-3)]" data-account-profile="">
      <p className="[font-weight:var(--font-weight-emphasis)]">{name ?? t("app.loading")}</p>
      {sharedMemory ? <MemoryDisclosure /> : null}
      <Button
        type="button"
        variant={blocked ? "secondary" : "danger"}
        onClick={() => void onToggle()}
      >
        {blocked ? t("auth.profile.unblock") : t("auth.profile.block")}
      </Button>
      {blocked ? (
        <p className="text-[length:var(--text-sm)] text-[var(--text-secondary)]">
          {t("auth.profile.blocked")}
        </p>
      ) : null}
    </div>
  );
}
