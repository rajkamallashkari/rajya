import { type FormEvent, useState } from "react";
import { useTranslation } from "react-i18next";
import { fetchRegistrationOptions } from "@/features/auth/api/passkeys";
import { serializeAttestationCredential, toCreationPublicKey } from "@/features/auth/lib/webauthn";
import { useMe } from "@/features/auth/api/queries";
import {
  useDestroyPasskey,
  usePasskeys,
  useRegisterPasskey,
  useRenamePasskey,
  useSetPassword,
} from "@/features/settings/api/queries";
import { queryListStatus } from "@/features/settings/model/map-sessions";
import { Button, Input, ListView } from "@/shared/ui";
import { WEIGHT_EMPHASIS } from "@/shared/ui/metrics";

export function SecurityPanel() {
  const { t } = useTranslation();
  const me = useMe();
  const passkeys = usePasskeys();
  const rename = useRenamePasskey();
  const destroy = useDestroyPasskey();
  const register = useRegisterPasskey();
  const password = useSetPassword();
  const [currentPassword, setCurrentPassword] = useState("");
  const [nextPassword, setNextPassword] = useState("");
  const [confirmPassword, setConfirmPassword] = useState("");
  const [errorKey, setErrorKey] = useState<string | null>(null);
  const hasPassword = me.data?.user.has_password === true;
  const rows = passkeys.data?.passkeys ?? [];

  const onPassword = async (event: FormEvent): Promise<void> => {
    event.preventDefault();
    setErrorKey(null);
    try {
      await password.mutateAsync({
        currentPassword: hasPassword ? currentPassword : undefined,
        password: nextPassword,
        passwordConfirmation: confirmPassword,
      });
      setCurrentPassword("");
      setNextPassword("");
      setConfirmPassword("");
    } catch {
      setErrorKey("settings.security_password_failed");
    }
  };

  const onAddPasskey = async (): Promise<void> => {
    setErrorKey(null);
    try {
      const options = await fetchRegistrationOptions();
      const credential = (await navigator.credentials.create({
        publicKey: toCreationPublicKey(options),
      })) as PublicKeyCredential | null;
      if (!credential) {
        return;
      }
      await register.mutateAsync({
        credential: serializeAttestationCredential(credential),
        nickname: t("settings.security_passkey_default"),
      });
    } catch {
      setErrorKey("settings.security_passkey_failed");
    }
  };

  return (
    <div className="flex flex-col gap-[var(--space-6)]" data-security-panel="">
      <form className="flex flex-col gap-[var(--control-gap)]" onSubmit={(event) => void onPassword(event)}>
        <h2 className={WEIGHT_EMPHASIS}>{t("settings.security_password")}</h2>
        {hasPassword ? (
          <Input
            aria-label={t("settings.security_current_password")}
            autoComplete="current-password"
            onChange={(event) => setCurrentPassword(event.target.value)}
            type="password"
            value={currentPassword}
          />
        ) : null}
        <Input
          aria-label={t("settings.security_new_password")}
          autoComplete="new-password"
          onChange={(event) => setNextPassword(event.target.value)}
          type="password"
          value={nextPassword}
        />
        <Input
          aria-label={t("settings.security_confirm_password")}
          autoComplete="new-password"
          onChange={(event) => setConfirmPassword(event.target.value)}
          type="password"
          value={confirmPassword}
        />
        <Button disabled={password.isPending} type="submit">
          {t("settings.security_save_password")}
        </Button>
      </form>
      <section className="flex flex-col gap-[var(--control-gap)]">
        <h2 className={WEIGHT_EMPHASIS}>{t("settings.security_passkeys")}</h2>
        <Button onClick={() => void onAddPasskey()} type="button" variant="secondary">
          {t("settings.security_add_passkey")}
        </Button>
        <ListView
          onRetry={() => {
            void passkeys.refetch();
          }}
          status={queryListStatus(passkeys.isPending, passkeys.isError, rows.length === 0)}
        >
          <ul className="flex flex-col gap-[var(--control-gap)]">
            {rows.map((row) => (
              <li className="flex flex-col gap-[var(--space-2)]" key={row.id}>
                <Input
                  aria-label={t("settings.security_passkey_nickname")}
                  defaultValue={row.nickname ?? ""}
                  onBlur={(event) => {
                    const next = event.target.value.trim();
                    if (next && next !== (row.nickname ?? "")) {
                      rename.mutate({ id: row.id, nickname: next });
                    }
                  }}
                />
                <Button onClick={() => destroy.mutate(row.id)} type="button" variant="danger">
                  {t("settings.security_delete_passkey")}
                </Button>
              </li>
            ))}
          </ul>
        </ListView>
      </section>
      {errorKey ? (
        <p className="text-[length:var(--text-sm)] text-[var(--status-danger)]">{t(errorKey)}</p>
      ) : null}
    </div>
  );
}
