import { type FormEvent, useEffect, useRef, useState } from "react";
import { useTranslation } from "react-i18next";
import { getAccessSession } from "@/features/auth/model/access-session";
import { useLockStore } from "@/features/auth/store/lock-store";
import { cn } from "@/shared/lib/cn";
import { Button } from "@/shared/ui/button";
import { Input } from "@/shared/ui/input";
import { OVERLAY_SCRIM } from "@/shared/ui/metrics";

export function AppLockOverlay() {
  const { t } = useTranslation();
  const locked = useLockStore((state) => state.locked);
  const unlocking = useLockStore((state) => state.unlocking);
  const unlockErrorKey = useLockStore((state) => state.unlockErrorKey);
  const onVisibilityHidden = useLockStore((state) => state.onVisibilityHidden);
  const onVisibilityVisible = useLockStore((state) => state.onVisibilityVisible);
  const unlockWithPasskey = useLockStore((state) => state.unlockWithPasskey);
  const unlockWithPassword = useLockStore((state) => state.unlockWithPassword);
  const session = getAccessSession();
  const hasPasskey = session?.hasPasskey ?? false;
  const hasPassword = session?.hasPassword ?? false;
  const profileLoaded = session !== null;
  const noUnlockMethod = profileLoaded && !hasPasskey && !hasPassword;
  const online = navigator.onLine;
  const [showPasswordFallback, setShowPasswordFallback] = useState(false);
  const [password, setPassword] = useState("");
  const overlayRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    const onVisibility = () => {
      if (document.visibilityState === "hidden") {
        onVisibilityHidden();
        return;
      }
      onVisibilityVisible();
    };
    document.addEventListener("visibilitychange", onVisibility);
    return () => document.removeEventListener("visibilitychange", onVisibility);
  }, [onVisibilityHidden, onVisibilityVisible]);

  useEffect(() => {
    if (locked) {
      overlayRef.current?.focus();
    }
  }, [locked]);

  if (!locked) {
    return null;
  }

  const promptKey = !profileLoaded
    ? "auth.lock.loading"
    : noUnlockMethod
      ? "auth.lock.subtitle_no_method"
      : hasPasskey
        ? "auth.lock.passkey_prompt"
        : "auth.lock.password_prompt";

  const onPasswordSubmit = (event: FormEvent) => {
    event.preventDefault();
    void unlockWithPassword(password).then((err) => {
      if (!err) {
        setPassword("");
      }
    });
  };

  return (
    <div
      ref={overlayRef}
      tabIndex={-1}
      role="dialog"
      aria-modal="true"
      aria-label={t("auth.lock.aria")}
      className={cn(
        OVERLAY_SCRIM,
        "z-[var(--z-critical)] flex flex-col items-center justify-center outline-none backdrop-blur-[var(--space-6)]",
      )}
      onKeyDown={(event) => event.stopPropagation()}
    >
      <div className="w-full max-w-xs rounded-[var(--radius-xl)] border border-[var(--border-subtle)] bg-[var(--surface-raised)] p-[var(--space-6)] text-center shadow-[var(--elevation-3)]">
        <h2 className="mb-[var(--space-1)] text-[length:var(--text-lg)] font-semibold text-[var(--text-primary)]">
          {t("auth.lock.title")}
        </h2>
        {session?.username ? (
          <p className="mb-[var(--space-2)] text-[length:var(--text-sm)] font-medium text-[var(--text-primary)]">
            @{session.username}
          </p>
        ) : null}
        <p className="mb-[var(--space-5)] text-[length:var(--text-sm)] text-[var(--text-secondary)]">
          {t(promptKey)}
        </p>

        {!noUnlockMethod && !online ? (
          <p className="text-[length:var(--text-xs)] text-[var(--status-warning)]">
            {t("auth.lock.offline")}
          </p>
        ) : null}

        {!noUnlockMethod && online && !showPasswordFallback && hasPasskey ? (
          <Button
            className="mb-[var(--space-3)] w-full"
            disabled={unlocking}
            onClick={() => {
              void unlockWithPasskey();
            }}
          >
            {unlocking ? t("auth.lock.unlocking") : t("auth.lock.unlock_passkey")}
          </Button>
        ) : null}

        {!noUnlockMethod && online && hasPassword && (!hasPasskey || showPasswordFallback) ? (
          <form className="flex flex-col gap-[var(--space-2)]" onSubmit={onPasswordSubmit}>
            <Input
              required
              autoFocus
              type="password"
              placeholder={t("auth.lock.password_placeholder")}
              value={password}
              onChange={(event) => setPassword(event.target.value)}
            />
            <Button type="submit" disabled={unlocking || password.length === 0} className="w-full">
              {unlocking ? t("auth.lock.unlocking") : t("auth.lock.unlock_password")}
            </Button>
          </form>
        ) : null}

        {!noUnlockMethod && online && hasPasskey && hasPassword ? (
          <Button
            type="button"
            variant="ghost"
            size="sm"
            className="mt-[var(--space-3)]"
            onClick={() => setShowPasswordFallback((value) => !value)}
          >
            {showPasswordFallback ? t("auth.lock.use_passkey") : t("auth.lock.use_password")}
          </Button>
        ) : null}

        {unlockErrorKey ? (
          <p className="mt-[var(--space-3)] text-[length:var(--text-xs)] text-[var(--status-danger)]">
            {t(unlockErrorKey)}
          </p>
        ) : null}
      </div>
    </div>
  );
}
