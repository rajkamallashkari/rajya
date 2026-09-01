import { useState, type ReactNode } from "react";
import { Link } from "react-router";
import { useTranslation } from "react-i18next";
import { useAdminUsers } from "@/features/admin/api/queries";
import { queryListStatus } from "@/features/admin/model/display";
import { Badge, Button, Input, ListView } from "@/shared/ui";
import { WEIGHT_EMPHASIS } from "@/shared/ui/metrics";

export function AdminUsersPanel(): ReactNode {
  const { t } = useTranslation();
  const [q, setQ] = useState("");
  const listed = useAdminUsers(q.trim() || undefined);
  const rows = listed.data?.users ?? [];
  return (
    <div className="flex flex-col gap-[var(--control-gap)]" data-admin-users="">
      <Input
        aria-label={t("admin.search_users")}
        onChange={(event) => setQ(event.target.value)}
        value={q}
      />
      <ListView
        onRetry={() => void listed.refetch()}
        status={queryListStatus(listed.isPending, listed.isError, rows.length === 0)}
      >
        <ul className="flex flex-col">
          {rows.map((row) => (
            <li key={row.id}>
              <Button asChild className="h-auto w-full justify-start" variant="ghost">
                <Link to={`/admin/users/${String(row.id)}`}>
                  <span className="flex min-w-0 flex-col items-start gap-[var(--space-1)]">
                    <span className={WEIGHT_EMPHASIS}>{row.account.display_name}</span>
                    <span className="text-[var(--text-secondary)]">
                      {row.email ?? row.account.username}
                    </span>
                    {row.is_admin ? <Badge variant="accent">{t("admin.title")}</Badge> : null}
                    {row.phone_verified ? (
                      <Badge variant="success">{t("admin.phone_verified")}</Badge>
                    ) : null}
                  </span>
                </Link>
              </Button>
            </li>
          ))}
        </ul>
      </ListView>
    </div>
  );
}
