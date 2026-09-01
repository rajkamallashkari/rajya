import { type ReactNode } from "react";
import { useTranslation } from "react-i18next";
import { useAdminDashboard } from "@/features/admin/api/queries";
import { displayMetric, queryListStatus } from "@/features/admin/model/display";
import { ListView } from "@/shared/ui";
import { WEIGHT_EMPHASIS } from "@/shared/ui/metrics";

export function AdminDashboardPanel(): ReactNode {
  const { t } = useTranslation();
  const dashboard = useAdminDashboard();
  const data = dashboard.data;
  return (
    <ListView
      onRetry={() => void dashboard.refetch()}
      status={queryListStatus(dashboard.isPending, dashboard.isError, data == null)}
    >
      <div className="flex flex-col gap-[var(--space-6)]" data-admin-dashboard="">
        <section className="flex flex-col gap-[var(--control-gap)]">
          <h2 className={WEIGHT_EMPHASIS}>{t("admin.buckets")}</h2>
          {(data?.buckets ?? []).map((bucket) => (
            <p key={bucket.service_name}>
              {bucket.service_name} {bucket.status} {bucket.used_bytes}/{bucket.capacity_bytes}
            </p>
          ))}
        </section>
        <section className="flex flex-col gap-[var(--control-gap)]">
          <h2 className={WEIGHT_EMPHASIS}>{t("admin.quotas")}</h2>
          {Object.entries(data?.quotas ?? {}).map(([key, value]) => (
            <p key={key}>
              {key} {displayMetric(value)}
            </p>
          ))}
        </section>
        <section className="flex flex-col gap-[var(--control-gap)]">
          <h2 className={WEIGHT_EMPHASIS}>{t("admin.ai_usage")}</h2>
          {(data?.ai_usage ?? []).map((row) => (
            <p key={`${row.capability}-${row.status}`}>
              {row.capability} {row.status} {row.count}
            </p>
          ))}
        </section>
        <section className="flex flex-col gap-[var(--control-gap)]">
          <h2 className={WEIGHT_EMPHASIS}>{t("admin.jobs")}</h2>
          {Object.entries(data?.jobs ?? {}).map(([key, value]) => (
            <p key={key}>
              {key} {displayMetric(value)}
            </p>
          ))}
        </section>
      </div>
    </ListView>
  );
}
