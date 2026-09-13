import { type ReactNode, useState } from "react";
import { useTranslation } from "react-i18next";
import {
  useAdminBotRequests,
  useApproveAdminBotRequest,
  useDeclineAdminBotRequest,
} from "@/features/admin/api/queries";
import { queryListStatus } from "@/features/admin/model/display";
import { Avatar, Button, Input, ListView } from "@/shared/ui";
import { WEIGHT_EMPHASIS } from "@/shared/ui/metrics";

export function AdminBotsPanel(): ReactNode {
  const { t } = useTranslation();
  const [kind, setKind] = useState<"create" | "edit" | undefined>();
  const [reasons, setReasons] = useState<Record<number, string>>({});
  const listed = useAdminBotRequests(kind);
  const approve = useApproveAdminBotRequest();
  const decline = useDeclineAdminBotRequest();
  const rows = listed.data?.bot_requests ?? [];
  return (
    <div className="flex flex-col gap-[var(--control-gap)]" data-admin-bots="">
      <h1 className={WEIGHT_EMPHASIS}>{t("admin.bots")}</h1>
      <div
        aria-label={t("admin.bot_request_filter")}
        className="flex gap-[var(--control-gap)]"
        role="group"
      >
        <Button
          onClick={() => setKind(undefined)}
          type="button"
          variant={kind ? "secondary" : "primary"}
        >
          {t("admin.bot_request_all")}
        </Button>
        <Button
          onClick={() => setKind("create")}
          type="button"
          variant={kind === "create" ? "primary" : "secondary"}
        >
          {t("admin.request_create")}
        </Button>
        <Button
          onClick={() => setKind("edit")}
          type="button"
          variant={kind === "edit" ? "primary" : "secondary"}
        >
          {t("admin.request_edit")}
        </Button>
      </div>
      <ListView
        onRetry={() => void listed.refetch()}
        status={queryListStatus(listed.isPending, listed.isError, rows.length === 0)}
      >
        <ul className="flex flex-col gap-[var(--space-4)]">
          {rows.map((row) => (
            <li
              className="flex flex-col gap-[var(--control-gap)] rounded-[var(--radius-md)] bg-[var(--surface-raised)] p-[var(--space-3)]"
              key={row.id}
            >
              <div className="flex items-center gap-[var(--control-gap)]">
                <Avatar
                  name={row.payload.name ?? row.payload.username ?? String(row.id)}
                  src={row.avatar_url}
                />
                <p className={WEIGHT_EMPHASIS}>
                  {row.payload.name ?? row.payload.username ?? String(row.id)}
                </p>
              </div>
              <p>{row.kind === "edit" ? t("admin.request_edit") : t("admin.request_create")}</p>
              {row.payload.username ? <p>@{row.payload.username}</p> : null}
              {row.payload.bio ? <p>{row.payload.bio}</p> : null}
              {row.payload.persona_prompt ? (
                <p className="whitespace-pre-wrap">{row.payload.persona_prompt}</p>
              ) : null}
              {row.status === "pending" ? (
                <>
                  <Input
                    aria-label={t("admin.decline_reason")}
                    onChange={(event) =>
                      setReasons((current) => ({ ...current, [row.id]: event.target.value }))
                    }
                    placeholder={t("admin.decline_reason")}
                    value={reasons[row.id] ?? ""}
                  />
                  <div className="flex gap-[var(--control-gap)]">
                    <Button
                      disabled={approve.isPending}
                      onClick={() => approve.mutate(row.id)}
                      type="button"
                    >
                      {t("admin.approve")}
                    </Button>
                    <Button
                      disabled={decline.isPending}
                      onClick={() =>
                        decline.mutate({ id: row.id, reason: reasons[row.id]?.trim() || undefined })
                      }
                      type="button"
                      variant="secondary"
                    >
                      {t("admin.decline")}
                    </Button>
                  </div>
                </>
              ) : null}
            </li>
          ))}
        </ul>
      </ListView>
    </div>
  );
}
