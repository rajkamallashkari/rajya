import { useState } from "react";
import { MessageContent } from "@/features/messages/components/message-content";
import { TickIndicator } from "@/features/messages/components/tick-indicator";
import type { BubbleRole, MessageSide, TickStatus } from "@/features/messages/model/constants";
import { showsTimestampByDefault } from "@/features/messages/model/grouping";
import { getJumboInfo } from "@/features/messages/model/jumbo-emoji";
import { useLongPress } from "@/shared/hooks/use-long-press";
import { cn } from "@/shared/lib/cn";
import { Avatar } from "@/shared/ui";

const RADIUS = {
  sent: {
    first:
      "rounded-tl-[var(--radius-bubble)] rounded-tr-[var(--radius-bubble)] rounded-bl-[var(--radius-bubble)] rounded-br-[var(--radius-sm)]",
    last: "rounded-tl-[var(--radius-bubble)] rounded-tr-[var(--radius-sm)] rounded-bl-[var(--radius-bubble)] rounded-br-[var(--radius-sm)]",
    middle:
      "rounded-tl-[var(--radius-bubble)] rounded-tr-[var(--radius-sm)] rounded-bl-[var(--radius-bubble)] rounded-br-[var(--radius-sm)]",
    single:
      "rounded-tl-[var(--radius-bubble)] rounded-tr-[var(--radius-bubble)] rounded-bl-[var(--radius-bubble)] rounded-br-[var(--radius-sm)]",
  },
  received: {
    first:
      "rounded-tl-[var(--radius-bubble)] rounded-tr-[var(--radius-bubble)] rounded-bl-[var(--radius-sm)] rounded-br-[var(--radius-bubble)]",
    last: "rounded-tl-[var(--radius-sm)] rounded-tr-[var(--radius-bubble)] rounded-bl-[var(--radius-sm)] rounded-br-[var(--radius-bubble)]",
    middle:
      "rounded-tl-[var(--radius-sm)] rounded-tr-[var(--radius-bubble)] rounded-bl-[var(--radius-sm)] rounded-br-[var(--radius-bubble)]",
    single:
      "rounded-tl-[var(--radius-bubble)] rounded-tr-[var(--radius-bubble)] rounded-bl-[var(--radius-sm)] rounded-br-[var(--radius-bubble)]",
  },
} as const;

export function formatMessageTime(iso: string, locale: string): string {
  return new Intl.DateTimeFormat(locale, {
    hour: "2-digit",
    hour12: false,
    minute: "2-digit",
  }).format(new Date(iso));
}

export function MessageBubble({
  body,
  createdAt,
  lifted = false,
  locale = "en",
  onMentionClick,
  onOpenMenu,
  onRetry,
  reserveAvatar,
  role = "single",
  senderName,
  senderSrc,
  showAvatar = false,
  side,
  status,
}: {
  body: string;
  createdAt?: string;
  lifted?: boolean;
  locale?: string;
  onMentionClick?: (handle: string) => void;
  onOpenMenu?: (point: { clientX: number; clientY: number }) => void;
  onRetry?: () => void;
  reserveAvatar?: boolean;
  role?: BubbleRole;
  senderName?: string | null;
  senderSrc?: string | null;
  showAvatar?: boolean;
  side: MessageSide;
  status?: TickStatus;
}) {
  const [hovered, setHovered] = useState(false);
  const jumbo = getJumboInfo(body) !== null;
  const alwaysTime = document.documentElement.dataset.timestamps === "always";
  const showTime = Boolean(createdAt) && (alwaysTime || hovered || showsTimestampByDefault(role));
  const queued = status === "queued";
  const fill =
    side === "sent" ? "bg-[var(--bubble-sent-fill)]" : "bg-[var(--bubble-received-fill)]";
  const keepAvatarSlot = reserveAvatar ?? (side === "received" && !showAvatar);
  const showTicks = side === "sent" && Boolean(status);
  const longPress = useLongPress(onOpenMenu ?? null, { enabled: Boolean(onOpenMenu) });

  return (
    <div
      className={cn(
        "group/msg flex max-w-[var(--bubble-max-width)] items-end gap-[var(--space-1_5)]",
        side === "sent" ? "ml-auto flex-row-reverse" : "mr-auto",
        queued && "opacity-[var(--opacity-queued)]",
        lifted && "relative z-[var(--z-popover)]",
      )}
      data-lifted={lifted ? "true" : "false"}
      data-message-bubble=""
      data-role={role}
      data-side={side}
      data-status={status ?? "none"}
      onContextMenu={(event) => {
        longPress.onContextMenu(event);
        if (onOpenMenu) {
          event.preventDefault();
          onOpenMenu({ clientX: event.clientX, clientY: event.clientY });
        }
      }}
      onMouseEnter={() => setHovered(true)}
      onMouseLeave={() => setHovered(false)}
      onPointerCancel={longPress.onPointerCancel}
      onPointerDown={longPress.onPointerDown}
      onPointerMove={longPress.onPointerMove}
      onPointerUp={longPress.onPointerUp}
    >
      {side === "received" && showAvatar ? (
        <Avatar className="size-[var(--bubble-avatar-size)]" name={senderName} src={senderSrc} />
      ) : keepAvatarSlot ? (
        <span className="inline-flex size-[var(--bubble-avatar-size)] shrink-0" />
      ) : null}
      <div className={cn("flex min-w-0 flex-col", side === "sent" ? "items-end" : "items-start")}>
        <div
          className={cn(
            "message-bubble relative max-w-full",
            jumbo
              ? "bg-transparent py-[var(--space-2)]"
              : cn(fill, RADIUS[side][role], "px-[var(--space-4)] py-[var(--space-2)]"),
            lifted && "shadow-[var(--elevation-3)]",
          )}
          data-jumbo={jumbo ? "true" : "false"}
          data-side={side}
        >
          <MessageContent body={body} onMentionClick={onMentionClick} />
          {showTime || showTicks ? (
            <div
              className={cn(
                "mt-[var(--space-1)] flex items-center gap-[var(--space-1)]",
                side === "sent" ? "justify-end" : "justify-start",
              )}
            >
              {createdAt && showTime ? (
                <time
                  className="text-[length:var(--text-xs)] text-[var(--text-tertiary)]"
                  dateTime={createdAt}
                >
                  {formatMessageTime(createdAt, locale)}
                </time>
              ) : null}
              {showTicks && status ? <TickIndicator onRetry={onRetry} status={status} /> : null}
            </div>
          ) : null}
        </div>
      </div>
    </div>
  );
}
