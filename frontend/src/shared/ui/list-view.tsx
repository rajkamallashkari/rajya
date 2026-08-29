import { type ReactNode } from "react";
import { useTranslation } from "react-i18next";
import { Button } from "@/shared/ui/button";
import { EmptyState } from "@/shared/ui/empty-state";
import { ListSkeleton } from "@/shared/ui/list-skeleton";

export type ListViewStatus = "loading" | "empty" | "error" | "ready";

export function ListView({
  action,
  children,
  onRetry,
  status,
}: {
  action?: ReactNode;
  children: ReactNode;
  onRetry?: () => void;
  status: ListViewStatus;
}) {
  const { t } = useTranslation();
  if (status === "loading") {
    return <ListSkeleton />;
  }
  if (status === "empty") {
    return (
      <EmptyState
        action={action}
        description={t("lists.empty_description")}
        title={t("lists.empty_title")}
      />
    );
  }
  if (status === "error") {
    return (
      <EmptyState
        action={
          <Button onClick={onRetry} type="button" variant="secondary">
            {t("lists.error_retry")}
          </Button>
        }
        description={t("lists.error_description")}
        title={t("lists.error_title")}
      />
    );
  }
  return <>{children}</>;
}
