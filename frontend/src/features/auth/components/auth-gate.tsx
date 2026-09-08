import { type FormEvent, useState } from "react";
import { useTranslation } from "react-i18next";
import { useResolvedTheme } from "@/app/theme-provider";
import { loginWithPassword, registerWithPassword } from "@/features/auth/api/identity";
import { PASSWORD_MIN_LENGTH } from "@/features/auth/model/limits";
import { persistSession } from "@/features/auth/model/persist-session";
import { cn } from "@/shared/lib/cn";
import { Button } from "@/shared/ui/button";
import { Input } from "@/shared/ui/input";
import { Logo } from "@/shared/ui/logo";
import { OVERLAY_SCRIM } from "@/shared/ui/metrics";

type GateMode = "login" | "register";

export function AuthGate({ initialMode = "register" }: { initialMode?: GateMode }) {
  const { t } = useTranslation();
  const resolvedTheme = useResolvedTheme();
  const [mode, setMode] = useState<GateMode>(initialMode);
  const [email, setEmail] = useState("");
  const [name, setName] = useState("");
  const [password, setPassword] = useState("");
  const [passwordConfirm, setPasswordConfirm] = useState("");
  const [errorKey, setErrorKey] = useState<string | null>(null);
  const [busy, setBusy] = useState(false);

  const onSubmit = async (event: FormEvent) => {
    event.preventDefault();
    if (mode === "register" && password !== passwordConfirm) {
      setErrorKey("auth.gate.password_mismatch");
      return;
    }
    setBusy(true);
    setErrorKey(null);
    try {
      persistSession(
        mode === "login"
          ? await loginWithPassword(email, password)
          : await registerWithPassword({
              email,
              name,
              password,
              password_confirmation: passwordConfirm,
            }),
      );
    } catch {
      setErrorKey(mode === "login" ? "auth.gate.failed" : "auth.gate.register_failed");
    } finally {
      setBusy(false);
    }
  };

  return (
    <div
      role="dialog"
      aria-modal="true"
      aria-label={t("auth.gate.aria")}
      className={cn(OVERLAY_SCRIM, "z-[var(--z-modal)] flex items-center justify-center")}
    >
      <form
        className="flex w-full max-w-sm flex-col gap-[var(--space-3)] rounded-[var(--radius-xl)] border border-[var(--border-subtle)] bg-[var(--surface-raised)] p-[var(--space-6)] shadow-[var(--elevation-3)]"
        onSubmit={(event) => void onSubmit(event)}
      >
        <Logo resolvedTheme={resolvedTheme} />
        <h1 className="text-[length:var(--text-lg)] font-semibold">
          {t(mode === "login" ? "auth.gate.title_login" : "auth.gate.title_register")}
        </h1>
        {mode === "register" ? (
          <Input
            required
            value={name}
            onChange={(event) => setName(event.target.value)}
            placeholder={t("auth.gate.name")}
            aria-label={t("auth.gate.name")}
          />
        ) : null}
        <Input
          required
          type="email"
          value={email}
          onChange={(event) => setEmail(event.target.value)}
          placeholder={t("auth.gate.email")}
          aria-label={t("auth.gate.email")}
        />
        <Input
          required
          type="password"
          minLength={PASSWORD_MIN_LENGTH}
          value={password}
          onChange={(event) => setPassword(event.target.value)}
          placeholder={t("auth.gate.password")}
          aria-label={t("auth.gate.password")}
        />
        {mode === "register" ? (
          <Input
            required
            type="password"
            value={passwordConfirm}
            onChange={(event) => setPasswordConfirm(event.target.value)}
            placeholder={t("auth.gate.password_confirm")}
            aria-label={t("auth.gate.password_confirm")}
          />
        ) : null}
        <Button type="submit" disabled={busy || password.length < PASSWORD_MIN_LENGTH}>
          {busy
            ? t("auth.gate.busy")
            : t(mode === "login" ? "auth.gate.submit_login" : "auth.gate.submit_register")}
        </Button>
        <Button
          type="button"
          variant="ghost"
          disabled={busy}
          onClick={() => {
            setErrorKey(null);
            setMode(mode === "login" ? "register" : "login");
          }}
        >
          {t(mode === "login" ? "auth.gate.switch_register" : "auth.gate.switch_login")}
        </Button>
        {errorKey ? (
          <p
            role="alert"
            className="text-[length:var(--text-sm)] text-[var(--status-danger)]"
          >
            {t(errorKey)}
          </p>
        ) : null}
      </form>
    </div>
  );
}
