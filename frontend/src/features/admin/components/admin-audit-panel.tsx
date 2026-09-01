import { useState, type ReactNode } from "react";
import { useTranslation } from "react-i18next";
import { useAdminAuditEvents } from "@/features/admin/api/queries";
import { displayMetric, queryListStatus } from "@/features/admin/model/display";
import { Input, ListView } from "@/shared/ui";
import { WEIGHT_EMPHASIS } from "@/shared/ui/metrics";

export function AdminAuditPanel(): ReactNode {
  const { t } = useTranslation();
  const [actionName, setActionName] = useState("");
  const listed = useAdminAuditEvents(actionName.trim() || undefined);
  const rows = listed.data?.audit_events ?? [];
  return (
    <div className="flex flex-col gap-[var(--control-gap)]" data-admin-audit="">
      <h1 className={WEIGHT_EMPHASIS}>{t("admin.audit")}</h1>
      <Input
        aria-label={t("admin.action")}
        onChange={(event) => setActionName(event.target.value)}
        value={actionName}
      />
      <ListView
        onRetry={() => void listed.refetch()}
        status={queryListStatus(listed.isPending, listed.isError, rows.length === 0)}
      >
        <ul className="flex flex-col gap-[var(--space-4)]">
          {rows.map((row) => (
            <li key={row.id}>
              <p className={WEIGHT_EMPHASIS}>{row.action}</p>
              <p className="text-[var(--text-secondary)]">
                {row.created_at}
                {row.impersonated_account ? ` ${row.impersonated_account.display_name}` : ""}
              </p>
              <p>{displayMetric(row.metadata)}</p>
            </li>
          ))}
        </ul>
      </ListView>
    </div>
  );
}
