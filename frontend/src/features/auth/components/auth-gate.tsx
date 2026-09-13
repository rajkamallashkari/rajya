import { type FormEvent, useCallback, useEffect, useState } from "react";
import { useLocation } from "react-router";
import { useTranslation } from "react-i18next";
import { useResolvedTheme } from "@/app/theme-provider";
import {
  loginWithGoogle,
  loginWithPassword,
  registerWithPassword,
  requestMagicLink,
  requestOtp,
  verifyMagicLink,
  verifyOtp,
} from "@/features/auth/api/identity";
import { authenticatePasskey, fetchAuthenticationOptions } from "@/features/auth/api/passkeys";
import { requestGoogleAuthCode } from "@/features/auth/lib/gis";
import {
  passkeyNonce,
  serializeAssertionCredential,
  toRequestPublicKey,
} from "@/features/auth/lib/webauthn";
import { googleSignInEnabled, magicLinkToken } from "@/features/auth/model/gate-config";
import { OTP_LENGTH, PASSWORD_MIN_LENGTH } from "@/features/auth/model/limits";
import { persistSession } from "@/features/auth/model/persist-session";
import { cn } from "@/shared/lib/cn";
import { Button } from "@/shared/ui/button";
import { Input } from "@/shared/ui/input";
import { Logo } from "@/shared/ui/logo";
import { OVERLAY_SCRIM } from "@/shared/ui/metrics";

type GateMode = "login" | "register";
type GatePanel = "password" | "otp" | "magic";

const consumedMagicTokens = new Set<string>();

export function resetConsumedMagicTokens(): void {
  consumedMagicTokens.clear();
}

export function AuthGate({
  activateSession = true,
  initialMode = "register",
  onCancel,
  onAuthenticated,
}: {
  activateSession?: boolean;
  initialMode?: GateMode;
  onAuthenticated?: () => void;
  onCancel?: () => void;
}) {
  const { t } = useTranslation();
  const location = useLocation();
  const resolvedTheme = useResolvedTheme();
  const showGoogle = googleSignInEnabled();
  const [panel, setPanel] = useState<GatePanel>("password");
  const [mode, setMode] = useState<GateMode>(initialMode);
  const [email, setEmail] = useState("");
  const [name, setName] = useState("");
  const [password, setPassword] = useState("");
  const [passwordConfirm, setPasswordConfirm] = useState("");
  const [otpCode, setOtpCode] = useState("");
  const [otpSent, setOtpSent] = useState(false);
  const [magicSent, setMagicSent] = useState(false);
  const [errorKey, setErrorKey] = useState<string | null>(null);
  const [busy, setBusy] = useState(false);

  const completeSession = useCallback(
    (session: Parameters<typeof persistSession>[0]): void => {
      persistSession(session, activateSession);
      onAuthenticated?.();
    },
    [activateSession, onAuthenticated],
  );

  const applySession = async (work: () => Promise<Parameters<typeof persistSession>[0]>) => {
    setBusy(true);
    setErrorKey(null);
    try {
      completeSession(await work());
    } catch {
      throw new Error("auth_failed");
    } finally {
      setBusy(false);
    }
  };

  useEffect(() => {
    const token = magicLinkToken(location.pathname, location.search);
    if (!token || consumedMagicTokens.has(token)) {
      return;
    }
    consumedMagicTokens.add(token);
    setBusy(true);
    setErrorKey(null);
    void verifyMagicLink(token)
      .then(completeSession)
      .catch(() => {
        setErrorKey("auth.gate.magic_failed");
      })
      .finally(() => {
        setBusy(false);
      });
  }, [completeSession, location.pathname, location.search]);

  const onPasswordSubmit = async (event: FormEvent) => {
    event.preventDefault();
    if (mode === "register" && password !== passwordConfirm) {
      setErrorKey("auth.gate.password_mismatch");
      return;
    }
    try {
      await applySession(() =>
        mode === "login"
          ? loginWithPassword(email, password)
          : registerWithPassword({
              email,
              name,
              password,
              password_confirmation: passwordConfirm,
            }),
      );
    } catch {
      setErrorKey(mode === "login" ? "auth.gate.failed" : "auth.gate.register_failed");
    }
  };

  const onGoogle = async () => {
    try {
      const code = await requestGoogleAuthCode();
      await applySession(() => loginWithGoogle(code));
    } catch {
      setErrorKey("auth.gate.google_failed");
      setBusy(false);
    }
  };

  const onPasskey = async () => {
    setBusy(true);
    setErrorKey(null);
    try {
      const options = await fetchAuthenticationOptions();
      const credential = (await navigator.credentials.get({
        publicKey: toRequestPublicKey(options),
      })) as PublicKeyCredential | null;
      if (!credential) {
        return;
      }
      completeSession(
        await authenticatePasskey(passkeyNonce(options), serializeAssertionCredential(credential)),
      );
    } catch (error) {
      if ((error as { name?: string }).name === "NotAllowedError") {
        return;
      }
      setErrorKey("auth.gate.passkey_failed");
    } finally {
      setBusy(false);
    }
  };

  const onOtpRequest = async (event: FormEvent) => {
    event.preventDefault();
    setBusy(true);
    setErrorKey(null);
    try {
      await requestOtp(email);
      setOtpSent(true);
    } catch {
      setErrorKey("auth.gate.otp_failed");
    } finally {
      setBusy(false);
    }
  };

  const onOtpVerify = async (event: FormEvent) => {
    event.preventDefault();
    try {
      await applySession(() => verifyOtp(email, otpCode));
    } catch {
      setErrorKey("auth.gate.otp_failed");
    }
  };

  const onMagicRequest = async (event: FormEvent) => {
    event.preventDefault();
    setBusy(true);
    setErrorKey(null);
    try {
      await requestMagicLink(email);
      setMagicSent(true);
    } catch {
      setErrorKey("auth.gate.magic_failed");
    } finally {
      setBusy(false);
    }
  };

  const switchPanel = (next: GatePanel) => {
    setErrorKey(null);
    setPanel(next);
  };

  return (
    <div
      role="dialog"
      aria-modal="true"
      aria-label={t("auth.gate.aria")}
      className={cn(OVERLAY_SCRIM, "z-[var(--z-modal)] flex items-center justify-center")}
    >
      <div className="flex w-full max-w-sm flex-col gap-[var(--space-3)] rounded-[var(--radius-xl)] border border-[var(--border-subtle)] bg-[var(--surface-raised)] p-[var(--space-6)] shadow-[var(--elevation-3)]">
        <Logo resolvedTheme={resolvedTheme} />
        <h1 className="text-[length:var(--text-lg)] font-semibold">
          {t(mode === "login" ? "auth.gate.title_login" : "auth.gate.title_register")}
        </h1>
        {onCancel ? (
          <Button type="button" variant="ghost" disabled={busy} onClick={onCancel}>
            {t("auth.accounts.add_cancel")}
          </Button>
        ) : null}
        {showGoogle ? (
          <Button type="button" variant="secondary" disabled={busy} onClick={() => void onGoogle()}>
            {t("auth.gate.google")}
          </Button>
        ) : null}
        <Button type="button" variant="secondary" disabled={busy} onClick={() => void onPasskey()}>
          {t("auth.gate.passkey")}
        </Button>
        <div className="flex gap-[var(--space-1)]">
          <Button
            type="button"
            size="sm"
            variant={panel === "password" ? "secondary" : "ghost"}
            disabled={busy}
            onClick={() => switchPanel("password")}
          >
            {t("auth.gate.password_method")}
          </Button>
          <Button
            type="button"
            size="sm"
            variant={panel === "otp" ? "secondary" : "ghost"}
            disabled={busy}
            onClick={() => switchPanel("otp")}
          >
            {t("auth.gate.otp")}
          </Button>
          <Button
            type="button"
            size="sm"
            variant={panel === "magic" ? "secondary" : "ghost"}
            disabled={busy}
            onClick={() => switchPanel("magic")}
          >
            {t("auth.gate.magic")}
          </Button>
        </div>
        {panel === "password" ? (
          <form
            className="flex flex-col gap-[var(--space-3)]"
            onSubmit={(event) => void onPasswordSubmit(event)}
          >
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
          </form>
        ) : null}
        {panel === "otp" ? (
          otpSent ? (
            <form
              className="flex flex-col gap-[var(--space-3)]"
              onSubmit={(event) => void onOtpVerify(event)}
            >
              <p className="text-[length:var(--text-sm)] text-[var(--text-secondary)]">
                {t("auth.gate.otp_sent")}
              </p>
              <Input
                required
                inputMode="numeric"
                maxLength={OTP_LENGTH}
                value={otpCode}
                onChange={(event) => setOtpCode(event.target.value.replace(/\D/g, ""))}
                placeholder={t("auth.gate.otp_code")}
                aria-label={t("auth.gate.otp_code")}
              />
              <Button type="submit" disabled={busy || otpCode.length !== OTP_LENGTH}>
                {busy ? t("auth.gate.busy") : t("auth.gate.otp_verify")}
              </Button>
              <Button
                type="button"
                variant="ghost"
                disabled={busy}
                onClick={() => setOtpSent(false)}
              >
                {t("auth.gate.otp_resend")}
              </Button>
            </form>
          ) : (
            <form
              className="flex flex-col gap-[var(--space-3)]"
              onSubmit={(event) => void onOtpRequest(event)}
            >
              <p className="text-[length:var(--text-sm)] text-[var(--text-secondary)]">
                {t("auth.gate.otp_hint")}
              </p>
              <Input
                required
                type="email"
                value={email}
                onChange={(event) => setEmail(event.target.value)}
                placeholder={t("auth.gate.email")}
                aria-label={t("auth.gate.email")}
              />
              <Button type="submit" disabled={busy}>
                {busy ? t("auth.gate.busy") : t("auth.gate.otp_send")}
              </Button>
            </form>
          )
        ) : null}
        {panel === "magic" ? (
          magicSent ? (
            <div className="flex flex-col gap-[var(--space-3)]">
              <p className="text-[length:var(--text-sm)] text-[var(--text-secondary)]">
                {t("auth.gate.magic_sent")}
              </p>
              <Button
                type="button"
                variant="ghost"
                disabled={busy}
                onClick={() => setMagicSent(false)}
              >
                {t("auth.gate.magic_retry")}
              </Button>
            </div>
          ) : (
            <form
              className="flex flex-col gap-[var(--space-3)]"
              onSubmit={(event) => void onMagicRequest(event)}
            >
              <p className="text-[length:var(--text-sm)] text-[var(--text-secondary)]">
                {t("auth.gate.magic_hint")}
              </p>
              <Input
                required
                type="email"
                value={email}
                onChange={(event) => setEmail(event.target.value)}
                placeholder={t("auth.gate.email")}
                aria-label={t("auth.gate.email")}
              />
              <Button type="submit" disabled={busy}>
                {busy ? t("auth.gate.busy") : t("auth.gate.magic_send")}
              </Button>
            </form>
          )
        ) : null}
        {errorKey ? (
          <p role="alert" className="text-[length:var(--text-sm)] text-[var(--status-danger)]">
            {t(errorKey)}
          </p>
        ) : null}
      </div>
    </div>
  );
}
