import { useEffect, useRef, useState } from "react";
import { useTranslation } from "react-i18next";
import { fetchMe } from "@/features/auth/api/identity";
import { fetchPhoneVerification, issuePhoneVerification } from "@/features/auth/api/phone";
import { PHONE_STATUS, PHONE_VERIFICATION_POLL_MS } from "@/features/auth/model/phone-config";
import { Button } from "@/shared/ui/button";
import { showToast } from "@/shared/ui/toast";

export function PhoneVerifyPanel() {
  const { t } = useTranslation();
  const [waiting, setWaiting] = useState(false);
  const [status, setStatus] = useState<string>(PHONE_STATUS.none);
  const [error, setError] = useState(false);
  const previousPhone = useRef<string | null>(null);

  useEffect(() => {
    if (!waiting) {
      return;
    }
    const timer = window.setInterval(() => {
      void fetchPhoneVerification()
        .then((current) => {
          if (current.status !== PHONE_STATUS.confirmed) {
            return;
          }
          setWaiting(false);
          setStatus(current.status);
          const phone = current.confirmed_phone;
          if (phone && phone !== previousPhone.current) {
            showToast({ title: t("auth.phone.changed", { phone }) });
          }
        })
        .catch(() => undefined);
    }, PHONE_VERIFICATION_POLL_MS);
    return () => window.clearInterval(timer);
  }, [t, waiting]);

  const onVerify = async () => {
    setError(false);
    try {
      const me = await fetchMe();
      previousPhone.current = me.user.phone ?? null;
      const issued = await issuePhoneVerification();
      setStatus(issued.status);
      setWaiting(true);
      if (issued.wa_url) {
        window.open(issued.wa_url, "_blank", "noopener,noreferrer");
      }
    } catch {
      setError(true);
    }
  };

  const confirmed = status === PHONE_STATUS.confirmed;

  return (
    <div className="flex flex-col items-start gap-[var(--space-3)]" data-phone-verify="">
      <h2 className="text-[length:var(--text-lg)] font-semibold">{t("auth.phone.title")}</h2>
      {confirmed ? (
        <p className="text-[length:var(--text-sm)] text-[var(--text-secondary)]">
          {t("auth.phone.confirmed")}
        </p>
      ) : (
        <Button disabled={waiting} onClick={() => void onVerify()}>
          {waiting ? t("auth.phone.waiting") : t("auth.phone.verify")}
        </Button>
      )}
      {!confirmed ? (
        <p className="text-[length:var(--text-sm)] text-[var(--text-tertiary)]">
          {t("auth.phone.admin")}
        </p>
      ) : null}
      {error ? (
        <p className="text-[length:var(--text-xs)] text-[var(--status-danger)]">
          {t("auth.phone.failed")}
        </p>
      ) : null}
    </div>
  );
}
