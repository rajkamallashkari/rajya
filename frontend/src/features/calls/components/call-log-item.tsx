import { ArrowDownRight, ArrowUpRight, Phone, Video } from "lucide-react";
import { type ReactNode } from "react";
import { useTranslation } from "react-i18next";
import type { CallLogEntry } from "@/features/calls/api/http";
import {
  callLogDetail,
  callLogDirection,
  callLogFailed,
  formatCallLogWhen,
} from "@/features/calls/model/log";
import { useAccountsStore } from "@/features/auth/store/accounts-store";
import { cn } from "@/shared/lib/cn";
import { Avatar } from "@/shared/ui/avatar";
import { Button } from "@/shared/ui/button";
import { ICON_CLASS, WEIGHT_EMPHASIS } from "@/shared/ui/metrics";

export function CallLogItem({ onOpen, row }: { onOpen: () => void; row: CallLogEntry }): ReactNode {
  const { t, i18n } = useTranslation();
  const viewerId = useAccountsStore((state) => state.activeAccountId) ?? 0;
  const direction = callLogDirection({
    initiator_account_id: row.initiator_account_id,
    viewerId,
  });
  const name = row.title ?? t("conversations.untitled");
  const when = formatCallLogWhen(row.created_at, i18n.language);
  const failed = callLogFailed(row.status);
  const detail = callLogDetail(row, t);
  const video = row.kind === "video";
  const DirectionIcon = direction === "outgoing" ? ArrowUpRight : ArrowDownRight;
  const KindIcon = video ? Video : Phone;
  const tone = failed ? "text-[var(--status-danger)]" : "text-[var(--text-secondary)]";
  const arrowTone = failed ? "text-[var(--status-danger)]" : "text-[var(--status-success)]";
  return (
    <Button
      aria-label={t("calls.row_label", {
        name,
        direction: t(`calls.direction_${direction}`),
        kind: t(video ? "calls.title_video" : "calls.title_audio"),
        detail,
        when,
      })}
      className="h-auto w-full justify-start gap-[var(--space-3)] rounded-none px-[var(--space-list-x)] py-[var(--space-list-y)] text-left"
      data-call-direction={direction}
      data-call-kind={video ? "video" : "audio"}
      data-call-row={row.id}
      data-call-status={row.status}
      onClick={onOpen}
      type="button"
      variant="ghost"
    >
      <Avatar name={name} />
      <span className="min-w-0 flex-1">
        <span className="flex items-baseline justify-between gap-[var(--space-2)]">
          <span className={cn("min-w-0 truncate", WEIGHT_EMPHASIS)}>{name}</span>
          <time
            className="shrink-0 text-[length:var(--text-xs)] text-[var(--text-tertiary)]"
            dateTime={row.created_at}
          >
            {when}
          </time>
        </span>
        <span
          className={cn(
            "flex min-w-0 items-center gap-[var(--space-1)] text-[length:var(--text-sm)]",
            tone,
          )}
        >
          <DirectionIcon
            aria-hidden
            className={cn(ICON_CLASS, "shrink-0", arrowTone)}
            data-call-arrow={direction}
          />
          <span className="truncate">{detail}</span>
        </span>
      </span>
      <KindIcon aria-hidden className={cn(ICON_CLASS, "shrink-0 text-[var(--text-tertiary)]")} />
    </Button>
  );
}
