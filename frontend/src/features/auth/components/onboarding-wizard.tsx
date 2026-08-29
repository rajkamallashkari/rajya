import { type FormEvent, useState } from "react";
import { useTranslation } from "react-i18next";
import {
  completeOnboarding,
  checkUsername,
  setPassword,
  updateProfile,
} from "@/features/auth/api/identity";
import { fetchRegistrationOptions, registerPasskey } from "@/features/auth/api/passkeys";
import { serializeAttestationCredential, toCreationPublicKey } from "@/features/auth/lib/webauthn";
import { getAccessSession } from "@/features/auth/model/access-session";
import { PASSWORD_MIN_LENGTH, USERNAME_MIN_LENGTH } from "@/features/auth/model/limits";
import { nextOnboardingStep, type OnboardingStep } from "@/features/auth/model/onboarding";
import { useAccountsStore, type StoredAccount } from "@/features/auth/store/accounts-store";
import { cn } from "@/shared/lib/cn";
import { Button } from "@/shared/ui/button";
import { Input } from "@/shared/ui/input";
import { OVERLAY_SCRIM } from "@/shared/ui/metrics";

function persistMe(me: {
  account: { display_name: string; id: number; username: string };
  user: { has_passkey: boolean; has_password: boolean; onboarded: boolean };
  token?: string;
}): void {
  const token = me.token ?? getAccessSession()?.token;
  if (!token) {
    return;
  }
  const account: StoredAccount = {
    displayName: me.account.display_name,
    hasPasskey: me.user.has_passkey,
    hasPassword: me.user.has_password,
    id: me.account.id,
    onboarded: me.user.onboarded,
    token,
    username: me.account.username,
  };
  useAccountsStore.getState().upsertAccount(account, true);
}

export function OnboardingWizard({ initialStep = "profile" }: { initialStep?: OnboardingStep }) {
  const { t } = useTranslation();
  const session = getAccessSession();
  const [step, setStep] = useState<OnboardingStep>(initialStep);
  const [displayName, setDisplayName] = useState(session?.displayName ?? "");
  const [username, setUsername] = useState(session?.username ?? "");
  const [password, setPasswordValue] = useState("");
  const [passwordConfirm, setPasswordConfirm] = useState("");
  const [errorKey, setErrorKey] = useState<string | null>(null);
  const [busy, setBusy] = useState(false);

  const advance = () => {
    const next = nextOnboardingStep(step);
    setErrorKey(null);
    if (next) {
      setStep(next);
      return;
    }
    void finish();
  };

  const finish = async () => {
    setBusy(true);
    try {
      persistMe(await completeOnboarding());
    } catch {
      setErrorKey("auth.onboarding.profile_failed");
    } finally {
      setBusy(false);
    }
  };

  const onProfile = async (event: FormEvent) => {
    event.preventDefault();
    setBusy(true);
    setErrorKey(null);
    try {
      const availability = await checkUsername(username);
      if (!availability.available && username !== session?.username) {
        setErrorKey("auth.onboarding.username_taken");
        return;
      }
      persistMe(await updateProfile({ display_name: displayName, username }));
      advance();
    } catch {
      setErrorKey("auth.onboarding.profile_failed");
    } finally {
      setBusy(false);
    }
  };

  const onPassword = async (event: FormEvent) => {
    event.preventDefault();
    if (password !== passwordConfirm) {
      setErrorKey("auth.onboarding.password_mismatch");
      return;
    }
    setBusy(true);
    setErrorKey(null);
    try {
      const sessionBody = await setPassword(password, passwordConfirm);
      persistMe(sessionBody);
      advance();
    } catch {
      setErrorKey("auth.onboarding.password_failed");
    } finally {
      setBusy(false);
    }
  };

  const onPasskey = async () => {
    setBusy(true);
    setErrorKey(null);
    try {
      const options = await fetchRegistrationOptions();
      const credential = (await navigator.credentials.create({
        publicKey: toCreationPublicKey(options),
      })) as PublicKeyCredential | null;
      if (!credential) {
        setBusy(false);
        return;
      }
      await registerPasskey(
        t("auth.onboarding.passkey_nickname"),
        serializeAttestationCredential(credential),
      );
      const current = getAccessSession();
      if (current) {
        useAccountsStore
          .getState()
          .upsertAccount({ ...current, id: current.accountId, hasPasskey: true }, true);
      }
      advance();
    } catch {
      setErrorKey("auth.onboarding.passkey_failed");
    } finally {
      setBusy(false);
    }
  };

  return (
    <div
      role="dialog"
      aria-modal="true"
      aria-label={t("auth.onboarding.aria")}
      className={cn(OVERLAY_SCRIM, "z-[var(--z-modal)] flex items-center justify-center")}
    >
      <div className="w-full max-w-sm rounded-[var(--radius-xl)] border border-[var(--border-subtle)] bg-[var(--surface-raised)] p-[var(--space-6)] shadow-[var(--elevation-3)]">
        {step === "profile" ? (
          <form
            className="flex flex-col gap-[var(--space-3)]"
            onSubmit={(event) => void onProfile(event)}
          >
            <h2 className="text-[length:var(--text-lg)] font-semibold">
              {t("auth.onboarding.title")}
            </h2>
            <Input
              required
              value={displayName}
              onChange={(event) => setDisplayName(event.target.value)}
              placeholder={t("auth.onboarding.display_name")}
              aria-label={t("auth.onboarding.display_name")}
            />
            <Input
              required
              minLength={USERNAME_MIN_LENGTH}
              value={username}
              onChange={(event) => setUsername(event.target.value)}
              placeholder={t("auth.onboarding.username")}
              aria-label={t("auth.onboarding.username")}
            />
            <Button
              type="submit"
              disabled={busy || displayName.length === 0 || username.length === 0}
            >
              {t("auth.onboarding.continue")}
            </Button>
          </form>
        ) : null}

        {step === "password" ? (
          <form
            className="flex flex-col gap-[var(--space-3)]"
            onSubmit={(event) => void onPassword(event)}
          >
            <h2 className="text-[length:var(--text-lg)] font-semibold">
              {t("auth.onboarding.password_title")}
            </h2>
            <Input
              required
              type="password"
              minLength={PASSWORD_MIN_LENGTH}
              value={password}
              onChange={(event) => setPasswordValue(event.target.value)}
              placeholder={t("auth.onboarding.password")}
              aria-label={t("auth.onboarding.password")}
            />
            <Input
              required
              type="password"
              value={passwordConfirm}
              onChange={(event) => setPasswordConfirm(event.target.value)}
              placeholder={t("auth.onboarding.password_confirm")}
              aria-label={t("auth.onboarding.password_confirm")}
            />
            <Button type="submit" disabled={busy || password.length < PASSWORD_MIN_LENGTH}>
              {t("auth.onboarding.save_password")}
            </Button>
            <Button type="button" variant="ghost" disabled={busy} onClick={advance}>
              {t("auth.onboarding.skip")}
            </Button>
          </form>
        ) : null}

        {step === "passkey" ? (
          <div className="flex flex-col gap-[var(--space-3)]">
            <h2 className="text-[length:var(--text-lg)] font-semibold">
              {t("auth.onboarding.passkey_title")}
            </h2>
            <p className="text-[length:var(--text-sm)] text-[var(--text-secondary)]">
              {t("auth.onboarding.passkey_body")}
            </p>
            <Button disabled={busy} onClick={() => void onPasskey()}>
              {t("auth.onboarding.add_passkey")}
            </Button>
            <Button type="button" variant="ghost" disabled={busy} onClick={() => void finish()}>
              {t("auth.onboarding.skip")}
            </Button>
          </div>
        ) : null}

        {errorKey ? (
          <p className="mt-[var(--space-3)] text-[length:var(--text-xs)] text-[var(--status-danger)]">
            {t(errorKey)}
          </p>
        ) : null}
      </div>
    </div>
  );
}
