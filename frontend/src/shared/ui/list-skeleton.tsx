import { useTranslation } from "react-i18next";
import { SKELETON_LIST_ROWS } from "@/shared/lib/navigation/constants";
import { Skeleton } from "@/shared/ui/skeleton";

export function ListSkeleton({ rows = SKELETON_LIST_ROWS }: { rows?: number }) {
  const { t } = useTranslation();
  return (
    <div aria-busy="true" aria-label={t("lists.loading")} data-list-skeleton="" role="status">
      {Array.from({ length: rows }, (_, index) => (
        <div
          className="flex items-center gap-[var(--control-gap)] px-[var(--space-list-x)] py-[var(--space-list-y)]"
          key={index}
        >
          <Skeleton className="size-[var(--chat-list-avatar-size)] rounded-full" />
          <div className="flex min-w-0 flex-1 flex-col gap-[var(--space-2)]">
            <Skeleton className="h-[var(--space-4)] w-[calc(var(--space-16)*2)]" />
            <Skeleton className="h-[var(--space-3)] w-full" />
          </div>
        </div>
      ))}
    </div>
  );
}
