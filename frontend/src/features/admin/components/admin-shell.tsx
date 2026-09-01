import { NavLink, Outlet, Link } from "react-router";
import { type ReactNode } from "react";
import { useTranslation } from "react-i18next";
import { ImpersonationBanner } from "@/app/banners/impersonation-banner";
import { useMe, useStopImpersonation } from "@/features/admin/api/queries";
import { queryListStatus } from "@/features/admin/model/display";
import { useShellStore } from "@/features/settings/store/shell-store";
import { Badge, Button, EmptyState, ListView } from "@/shared/ui";
import { WEIGHT_EMPHASIS } from "@/shared/ui/metrics";

const NAV = [
  { end: true, key: "dashboard", to: "/admin" },
  { end: false, key: "users", to: "/admin/users" },
  { end: false, key: "bots", to: "/admin/bots" },
  { end: false, key: "reports", to: "/admin/reports" },
  { end: false, key: "packs", to: "/admin/packs" },
  { end: false, key: "audit", to: "/admin/audit" },
  { end: false, key: "settings", to: "/admin/config" },
  { end: false, key: "prompts", to: "/admin/prompts" },
] as const;

export function AdminShell(): ReactNode {
  const { t } = useTranslation();
  const me = useMe();
  const impersonatingName = useShellStore((state) => state.impersonatingName);
  const stopImpersonation = useStopImpersonation();
  const isAdmin = me.data?.user.is_admin === true;
  const status = queryListStatus(me.isPending, me.isError, false);
  return (
    <div
      className="flex h-[100dvh] min-h-0 flex-col overflow-hidden bg-[var(--surface-app)] text-[var(--text-primary)]"
      data-admin-shell=""
    >
      {impersonatingName ? (
        <ImpersonationBanner name={impersonatingName} onExit={stopImpersonation} />
      ) : null}
      <header className="flex items-center gap-[var(--control-gap)] border-b border-[var(--border-subtle)] px-[var(--space-list-x)] py-[var(--space-list-y)]">
        <Badge data-admin-chip="" variant="accent">
          {t("admin.title")}
        </Badge>
        <h1 className={WEIGHT_EMPHASIS}>{t("admin.title")}</h1>
        <Button asChild className="ml-auto" size="sm" variant="ghost">
          <Link to="/">{t("admin.back_to_chats")}</Link>
        </Button>
      </header>
      {isAdmin ? (
        <nav
          aria-label={t("admin.title")}
          className="flex flex-wrap gap-[var(--space-2)] border-b border-[var(--border-subtle)] px-[var(--space-list-x)] py-[var(--space-2)]"
        >
          {NAV.map((item) => (
            <NavLink
              className={({ isActive }) =>
                `${WEIGHT_EMPHASIS} rounded-[var(--control-radius)] px-[var(--control-pad-x-sm)] py-[var(--control-pad-y-sm)] ${
                  isActive
                    ? "bg-[var(--accent-subtle)] text-[var(--accent)]"
                    : "text-[var(--text-secondary)]"
                }`
              }
              end={item.end}
              key={item.to}
              to={item.to}
            >
              {t(`admin.${item.key}`)}
            </NavLink>
          ))}
        </nav>
      ) : null}
      <main className="min-h-0 flex-1 overflow-y-auto px-[var(--space-list-x)] py-[var(--space-4)]">
        {me.isPending || me.isError ? (
          <ListView onRetry={() => void me.refetch()} status={status}>
            {null}
          </ListView>
        ) : isAdmin ? (
          <Outlet />
        ) : (
          <EmptyState title={t("admin.forbidden")} />
        )}
      </main>
    </div>
  );
}
