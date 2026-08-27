import { useTranslation } from "react-i18next";
import { ListErrorBoundary } from "@/app/error-boundaries/error-boundary";
import { useResolvedTheme } from "@/app/theme-provider";
import { useShellStore } from "@/features/settings/store/shell-store";
import { Logo } from "@/shared/ui/logo";

export function AppShell() {
  const { t } = useTranslation();
  const resolvedTheme = useResolvedTheme();
  const mobileNavOpen = useShellStore((state) => state.mobileNavOpen);

  return (
    <main className="flex min-h-screen flex-col items-center justify-center gap-[var(--space-4)] bg-[var(--surface-app)] p-[var(--space-6)] text-[var(--text-primary)]">
      <Logo resolvedTheme={resolvedTheme} />
      <p>{t("app.tagline")}</p>
      <ListErrorBoundary>
        <div data-mobile-nav={mobileNavOpen ? "open" : "closed"} />
      </ListErrorBoundary>
    </main>
  );
}
