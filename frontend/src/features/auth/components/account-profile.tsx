import { useQueryClient } from "@tanstack/react-query";
import { useEffect, useState } from "react";
import { useTranslation } from "react-i18next";
import { blockKeys, createBlock, destroyBlock } from "@/features/auth/api/blocks";
import { fetchAccount } from "@/features/auth/api/identity";
import { disclosesSharedMemory, MemoryDisclosure } from "@/features/bots";
import { BioContent } from "@/shared/ui/bio-content";
import { Button } from "@/shared/ui/button";
import { EmptyState } from "@/shared/ui/empty-state";

export interface AccountProfileState {
  bio: string | null;
  blocked: boolean;
  email: string | null;
  missing: boolean;
  name: string | null;
  onToggle: () => Promise<void>;
  phone: string | null;
  sharedMemory: boolean;
  username: string | null;
}

export function useAccountProfile(
  accountId: number | null,
  initiallyBlocked = false,
): AccountProfileState {
  const queryClient = useQueryClient();
  const [missing, setMissing] = useState(false);
  const [blocked, setBlocked] = useState(initiallyBlocked);
  const [bio, setBio] = useState<string | null>(null);
  const [email, setEmail] = useState<string | null>(null);
  const [name, setName] = useState<string | null>(null);
  const [phone, setPhone] = useState<string | null>(null);
  const [sharedMemory, setSharedMemory] = useState(false);
  const [username, setUsername] = useState<string | null>(null);

  useEffect(() => {
    let active = true;
    setBio(null);
    setBlocked(initiallyBlocked);
    setEmail(null);
    setMissing(false);
    setName(null);
    setPhone(null);
    setSharedMemory(false);
    setUsername(null);
    if (accountId == null) {
      return () => {
        active = false;
      };
    }
    void fetchAccount(accountId).then((result) => {
      if (!active) {
        return;
      }
      if (result.missing) {
        setMissing(true);
        return;
      }
      setMissing(false);
      setBlocked(result.account.blocked_by_viewer);
      setBio(result.account.bio ?? null);
      setEmail(result.account.email ?? null);
      setName(result.account.display_name);
      setPhone(result.account.phone ?? null);
      setSharedMemory(disclosesSharedMemory(result.account));
      setUsername(result.account.username);
    });
    return () => {
      active = false;
    };
  }, [accountId, initiallyBlocked]);

  const onToggle = async (): Promise<void> => {
    if (accountId == null) {
      return;
    }
    try {
      if (blocked) {
        await destroyBlock(accountId);
        setBlocked(false);
        await queryClient.invalidateQueries({ queryKey: blockKeys.list() });
        return;
      }
      await createBlock(accountId);
      setBlocked(true);
      await queryClient.invalidateQueries({ queryKey: blockKeys.list() });
    } catch {
      return;
    }
  };

  return {
    bio,
    blocked,
    email,
    missing,
    name,
    onToggle,
    phone,
    sharedMemory,
    username,
  };
}

export function AccountProfile({
  accountId,
  initiallyBlocked = false,
}: {
  accountId: number;
  initiallyBlocked?: boolean;
}) {
  const { t } = useTranslation();
  const profile = useAccountProfile(accountId, initiallyBlocked);

  if (profile.missing) {
    return (
      <EmptyState
        title={t("auth.profile.missing")}
        description={t("auth.profile.missing_description")}
      />
    );
  }

  return (
    <div className="flex flex-col items-start gap-[var(--space-3)]" data-account-profile="">
      <AccountIdentity profile={profile} />
      <AccountProfileActions profile={profile} />
    </div>
  );
}

export function AccountIdentity({
  profile,
  showName = true,
}: {
  profile: AccountProfileState;
  showName?: boolean;
}) {
  const { t } = useTranslation();
  return (
    <div
      className="flex w-full min-w-0 flex-col items-center gap-[var(--space-3)] text-center"
      data-account-identity=""
    >
      {showName ? (
        <p className="max-w-full break-words [font-weight:var(--font-weight-emphasis)]">
          {profile.name ?? t("app.loading")}
        </p>
      ) : null}
      {profile.username ? (
        <p className="max-w-full break-words text-[var(--text-secondary)]">
          {t("auth.profile.handle", { username: profile.username })}
        </p>
      ) : null}
      {profile.bio ? (
        <p className="max-w-full break-words">
          <BioContent>{profile.bio}</BioContent>
        </p>
      ) : null}
      {profile.email ? (
        <p className="max-w-full break-words" data-profile-email="">
          <span className="text-[var(--text-secondary)]">{t("auth.profile.email")} </span>
          {profile.email}
        </p>
      ) : null}
      {profile.phone ? (
        <p className="max-w-full break-words" data-profile-phone="">
          <span className="text-[var(--text-secondary)]">{t("auth.profile.phone")} </span>
          {profile.phone}
        </p>
      ) : null}
      {profile.sharedMemory ? <MemoryDisclosure /> : null}
    </div>
  );
}

export function AccountProfileActions({ profile }: { profile: AccountProfileState }) {
  const { t } = useTranslation();
  return (
    <div className="flex flex-col items-start gap-[var(--space-3)]" data-account-actions="">
      <Button
        type="button"
        variant={profile.blocked ? "secondary" : "danger"}
        onClick={() => void profile.onToggle()}
      >
        {profile.blocked ? t("auth.profile.unblock") : t("auth.profile.block")}
      </Button>
      {profile.blocked ? (
        <p className="text-[length:var(--text-sm)] text-[var(--text-secondary)]">
          {t("auth.profile.blocked")}
        </p>
      ) : null}
    </div>
  );
}
