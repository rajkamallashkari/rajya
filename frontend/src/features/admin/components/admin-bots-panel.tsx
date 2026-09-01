import { type ReactNode } from "react";
import { useTranslation } from "react-i18next";
import {
  useAdminBotRequests,
  useApproveAdminBotRequest,
  useDeclineAdminBotRequest,
} from "@/features/admin/api/queries";
import { queryListStatus } from "@/features/admin/model/display";
import { Button, ListView } from "@/shared/ui";
import { WEIGHT_EMPHASIS } from "@/shared/ui/metrics";

export function AdminBotsPanel(): ReactNode {
  const { t } = useTranslation();
  const listed = useAdminBotRequests();
  const approve = useApproveAdminBotRequest();
  const decline = useDeclineAdminBotRequest();
  const rows = listed.data?.bot_requests ?? [];
  return (
    <div className="flex flex-col gap-[var(--control-gap)]" data-admin-bots="">
      <h1 className={WEIGHT_EMPHASIS}>{t("admin.bots")}</h1>
      <ListView
        onRetry={() => void listed.refetch()}
        status={queryListStatus(listed.isPending, listed.isError, rows.length === 0)}
      >
        <ul className="flex flex-col gap-[var(--space-4)]">
          {rows.map((row) => (
            <li className="flex flex-col gap-[var(--control-gap)]" key={row.id}>
              <p className={WEIGHT_EMPHASIS}>
                {row.payload.name ?? row.payload.username ?? String(row.id)}
              </p>
              <p>{row.kind === "edit" ? t("admin.request_edit") : t("admin.request_create")}</p>
              <div className="flex gap-[var(--control-gap)]">
                <Button onClick={() => approve.mutate(row.id)} type="button">
                  {t("admin.approve")}
                </Button>
                <Button
                  onClick={() => decline.mutate({ id: row.id })}
                  type="button"
                  variant="secondary"
                >
                  {t("admin.decline")}
                </Button>
              </div>
            </li>
          ))}
        </ul>
      </ListView>
    </div>
  );
}
