import { type ReactNode } from "react";
import { useTranslation } from "react-i18next";
import { Button } from "@/shared/ui/button";

export function ImpersonationBanner({
  name,
  onExit,
}: {
  name: string;
  onExit: () => void;
}): ReactNode {
  const { t } = useTranslation();
  return (
    <div
      className="z-[var(--z-critical)] flex items-center justify-center gap-[var(--control-gap)] bg-[var(--status-warning)] px-[var(--space-list-x)] py-[var(--space-2)] text-[var(--text-inverse)]"
      data-impersonation-banner=""
      role="alert"
    >
      <span>{t("impersonation.banner", { name })}</span>
      <Button onClick={onExit} size="sm" type="button" variant="secondary">
        {t("impersonation.exit")}
      </Button>
    </div>
  );
}
