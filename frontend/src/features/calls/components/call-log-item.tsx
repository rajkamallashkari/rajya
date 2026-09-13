import { ArrowDownRight, ArrowUpRight, Phone, Video } from "lucide-react";
import { type ReactNode } from "react";
import { useTranslation } from "react-i18next";
import type { CallLogEntry } from "@/features/calls/api/http";
import { callLogDirection } from "@/features/calls/model/log";
import { useAccountsStore } from "@/features/auth/store/accounts-store";
import { callMessageDetail } from "@/features/messages/components/call-message-bubble";
import { ConversationIdentityRow } from "@/shared/ui/conversation-identity-row";
import { ICON_CLASS } from "@/shared/ui/metrics";
import { useDateTimeFormatter } from "@/shared/hooks/use-date-time-formatter";
import { cn } from "@/shared/lib/cn";

export function CallLogItem({ onOpen, row }: { onOpen: () => void; row: CallLogEntry }): ReactNode {
  const { t } = useTranslation();
  const formatDateTime = useDateTimeFormatter();
  const viewerId = useAccountsStore((state) => state.activeAccountId) ?? 0;
  const direction = callLogDirection({
    initiator_account_id: row.initiator_account_id,
    viewerId,
  });
  const name = row.title ?? t("conversations.untitled");
  const when = formatDateTime.dateTime(row.created_at);
  const video = row.kind === "video";
  const side = direction === "outgoing" ? "sent" : "received";
  const { detail, phase } = callMessageDetail(
    {
      duration_seconds: row.duration_seconds,
      initiator_account_id: row.initiator_account_id,
      kind: row.kind,
      status: row.status,
    },
    `call_${row.status}`,
    side,
    t,
  );
  const failed = phase === "busy" || phase === "declined" || phase === "missed";
  const DirectionIcon = direction === "outgoing" ? ArrowUpRight : ArrowDownRight;
  const CallIcon = video ? Video : Phone;
  const arrowTone = failed ? "text-[var(--status-danger)]" : "text-[var(--status-success)]";
  const infoTone = failed ? "text-[var(--status-danger)]" : "text-[var(--text-secondary)]";

  return (
    <div
      className="flex items-center gap-[var(--space-2)] px-[var(--space-list-x)] py-[var(--space-list-y)]"
      data-call-direction={direction}
      data-call-kind={video ? "video" : "audio"}
      data-call-row={row.id}
      data-call-status={row.status}
    >
      <ConversationIdentityRow
        ariaLabel={t("calls.row_label", {
          name,
          direction: t(`calls.direction_${direction}`),
          kind: t(video ? "calls.title_video" : "calls.title_audio"),
          detail,
          when,
        })}
        className="min-w-0 flex-1"
        conversation={{
          avatar_url: row.avatar_url,
          id: row.conversation_id,
          kind: row.conversation_kind as "direct" | "group" | "channel",
          member_count: row.member_count,
          peer: row.peer,
          title: row.title,
        }}
        onSelect={onOpen}
      />
      <div className="flex shrink-0 flex-col items-end gap-[var(--space-0_5)]">
        <time
          className="whitespace-nowrap text-[length:var(--text-xs)] text-[var(--text-tertiary)]"
          dateTime={row.created_at}
        >
          {when}
        </time>
        <span
          className="flex items-center gap-[var(--space-1)]"
          data-call-message={`call_${row.status}`}
          data-call-phase={phase}
        >
          <DirectionIcon
            aria-label={`${t(`calls.direction_${direction}`)}: ${detail}`}
            className={cn(ICON_CLASS, "shrink-0", arrowTone)}
            data-call-arrow={direction}
            role="img"
          />
          <CallIcon
            aria-hidden="true"
            className={cn(ICON_CLASS, "shrink-0", infoTone)}
          />
          <span className={cn("whitespace-nowrap text-[length:var(--text-xs)]", infoTone)}>
            {detail}
          </span>
        </span>
      </div>
    </div>
  );
}
