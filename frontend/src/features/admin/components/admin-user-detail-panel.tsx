import { type ReactNode } from "react";
import { Link, useParams } from "react-router";
import { useTranslation } from "react-i18next";
import { useAdminUser, useStartImpersonation } from "@/features/admin/api/queries";
import { queryListStatus } from "@/features/admin/model/display";
import { Badge, Button, ListView } from "@/shared/ui";
import { WEIGHT_EMPHASIS } from "@/shared/ui/metrics";

export function AdminUserDetailPanel(): ReactNode {
  const { t } = useTranslation();
  const params = useParams();
  const id = Number(params.userId);
  const detail = useAdminUser(id);
  const impersonate = useStartImpersonation();
  const user = detail.data?.user;
  const conversations = detail.data?.conversations ?? [];
  return (
    <ListView
      onRetry={() => void detail.refetch()}
      status={queryListStatus(detail.isPending, detail.isError, user == null)}
    >
      {user ? (
        <div className="flex flex-col gap-[var(--space-6)]" data-admin-user="">
          <div className="flex flex-col gap-[var(--control-gap)]">
            <p className={WEIGHT_EMPHASIS}>{user.account.display_name}</p>
            <p>
              {t("admin.email")} {user.email ?? user.account.username}
            </p>
            {user.is_admin ? <Badge variant="accent">{t("admin.title")}</Badge> : null}
            {user.phone_verified ? (
              <Badge variant="success">{t("admin.phone_verified")}</Badge>
            ) : null}
            <Button
              onClick={() => {
                impersonate.mutate(user.account.id);
              }}
              type="button"
            >
              {t("admin.impersonate")}
            </Button>
          </div>
          <section className="flex flex-col gap-[var(--control-gap)]">
            <h2 className={WEIGHT_EMPHASIS}>{t("admin.conversations")}</h2>
            <ul className="flex flex-col">
              {conversations.map((conversation) => (
                <li key={conversation.id}>
                  <Button asChild className="h-auto w-full justify-start" variant="ghost">
                    <Link to={`/admin/conversations/${String(conversation.id)}`}>
                      <span className="flex flex-col items-start">
                        <span className={WEIGHT_EMPHASIS}>
                          {conversation.title ?? conversation.kind}
                        </span>
                        <span className="text-[var(--text-secondary)]">
                          {t("admin.member_count", { count: conversation.member_count })}
                        </span>
                      </span>
                    </Link>
                  </Button>
                </li>
              ))}
            </ul>
          </section>
        </div>
      ) : null}
    </ListView>
  );
}
