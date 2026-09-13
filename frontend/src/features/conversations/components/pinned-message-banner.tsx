import { ChevronDown, ChevronUp, Pin } from "lucide-react";
import { useEffect, useState } from "react";
import { useTranslation } from "react-i18next";
import type { Message } from "@/features/conversations/api/http";
import { useDateTimeFormatter } from "@/shared/hooks/use-date-time-formatter";
import { cn } from "@/shared/lib/cn";
import { IconButton } from "@/shared/ui/icon-button";
import { Button } from "@/shared/ui";

export interface PinnedMessageView {
  message: Message;
  message_id: number;
}

export function PinnedMessageBanner({
  canUnpin,
  onJump,
  onUnpin,
  pins,
  viewerId,
}: {
  canUnpin: boolean;
  onJump: (messageId: number) => void;
  onUnpin: (messageId: number) => void;
  pins: PinnedMessageView[];
  viewerId?: number;
}) {
  const { t } = useTranslation();
  const formatDateTime = useDateTimeFormatter();
  const [index, setIndex] = useState(Math.max(0, pins.length - 1));
  useEffect(() => setIndex(Math.max(0, pins.length - 1)), [pins.length]);
  const current = pins[index];
  if (!current) {
    return null;
  }
  const side = current.message.sender?.id === viewerId ? "sent" : "received";
  return (
    <div
      className={cn(
        "flex items-center gap-[var(--space-2)] border-b border-[var(--border-default)] px-[var(--space-list-x)] py-[var(--space-2)] text-[var(--text-primary)]",
        side === "sent" ? "bg-[var(--bubble-sent-fill)]" : "bg-[var(--bubble-received-fill)]",
      )}
      data-pinned-message-banner=""
      data-side={side}
    >
      {canUnpin ? (
        <IconButton
          aria-label={t("pins.unpin")}
          className="shrink-0 hover:bg-transparent"
          onClick={() => onUnpin(current.message_id)}
        >
          <Pin className="size-[var(--icon-size-sm)]" />
        </IconButton>
      ) : (
        <Pin
          aria-hidden="true"
          className="size-[var(--icon-size-sm)] shrink-0 text-[var(--text-secondary)]"
        />
      )}
      <Button
        aria-label={t("pins.jump")}
        className="h-auto min-w-0 flex-1 justify-start gap-[var(--space-3)] p-0 text-left hover:bg-transparent"
        onClick={() => onJump(current.message_id)}
        type="button"
        variant="ghost"
      >
        <span className="min-w-0 flex-1 truncate text-[length:var(--text-sm)] text-[var(--text-primary)]">
          {current.message.sender?.display_name ? `${current.message.sender.display_name}: ` : ""}
          {current.message.body || t("reactions.attachment")}
        </span>
        <time
          className="shrink-0 text-[length:var(--text-xs)] text-[var(--text-tertiary)]"
          dateTime={current.message.created_at}
        >
          {formatDateTime.dateTime(current.message.created_at)}
        </time>
        <span className="sr-only">
          {pins.length > 1
            ? t("pins.label_position", { count: pins.length, position: index + 1 })
            : t("pins.label")}
        </span>
      </Button>
      {pins.length > 1 ? (
        <div className="flex">
          <IconButton
            aria-label={t("pins.previous")}
            disabled={index === 0}
            onClick={() => setIndex((value) => Math.max(0, value - 1))}
          >
            <ChevronUp className="size-[var(--icon-size-sm)]" />
          </IconButton>
          <IconButton
            aria-label={t("pins.next")}
            disabled={index === pins.length - 1}
            onClick={() => setIndex((value) => Math.min(pins.length - 1, value + 1))}
          >
            <ChevronDown className="size-[var(--icon-size-sm)]" />
          </IconButton>
        </div>
      ) : null}
    </div>
  );
}
