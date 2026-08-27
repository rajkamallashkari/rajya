import { useTranslation } from "react-i18next";
import { Link } from "react-router";
import { ListErrorBoundary } from "@/app/error-boundaries/error-boundary";
import { useResolvedTheme } from "@/app/theme-provider";
import { useShellStore } from "@/features/settings/store/shell-store";
import { Button } from "@/shared/ui/button";
import { Logo } from "@/shared/ui/logo";
import { PAGE_INSET } from "@/shared/ui/metrics";
import { cn } from "@/shared/lib/cn";

export function AppShell() {
  const { t } = useTranslation();
  const resolvedTheme = useResolvedTheme();
  const mobileNavOpen = useShellStore((state) => state.mobileNavOpen);

  return (
    <main
      className={cn(
        "flex min-h-[100dvh] flex-col items-center justify-center gap-[var(--control-gap)] bg-[var(--surface-app)] text-[var(--text-primary)]",
        PAGE_INSET,
      )}
    >
      <Logo resolvedTheme={resolvedTheme} />
      <p>{t("app.tagline")}</p>
      <Button asChild variant="ghost">
        <Link to="/dev/gallery">{t("app.gallery")}</Link>
      </Button>
      <ListErrorBoundary>
        <div data-mobile-nav={mobileNavOpen ? "open" : "closed"} />
      </ListErrorBoundary>
    </main>
  );
}
