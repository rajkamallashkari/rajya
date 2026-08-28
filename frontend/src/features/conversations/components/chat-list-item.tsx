import { BellOff, Pin } from "lucide-react";
import { useState } from "react";
import { useTranslation } from "react-i18next";
import {
  ConversationMenu,
  SwipeActions,
} from "@/features/conversations/components/conversation-menu";
import { useChatListGestures } from "@/features/conversations/hooks/use-chat-list-gestures";
import type { ConversationKind } from "@/features/conversations/model/constants";
import { lastActivityPrefix, lastActivityTone, type LastActivity } from "@/features/conversations/model/preview";
import { formatUnread } from "@/features/conversations/model/unread";
import { cn } from "@/shared/lib/cn";
import { Avatar, Badge } from "@/shared/ui";
import { ICON_CLASS, WEIGHT_EMPHASIS } from "@/shared/ui/metrics";
import type { Presence } from "@/shared/ui/avatar";

export interface ChatListItemProps {
  archived?: boolean;
  avatarSrc?: string | null;
  isGroup?: boolean;
  kind?: ConversationKind;
  lastActivity: LastActivity;
  markedUnread?: boolean;
  muted?: boolean;
  name: string;
  onArchive?: () => void;
  onMarkRead?: () => void;
  onMarkUnread?: () => void;
  onMute?: () => void;
  onOpen?: () => void;
  onPin?: () => void;
  pinned?: boolean;
  presence?: Presence;
  selected?: boolean;
  timestampLabel: string;
  unreadCount?: number;
}

export function ChatListItem({
  archived = false,
  avatarSrc,
  isGroup = false,
  kind = "direct",
  lastActivity,
  markedUnread = false,
  muted = false,
  name,
  onArchive,
  onMarkRead,
  onMarkUnread,
  onMute,
  onOpen,
  onPin,
  pinned = false,
  presence,
  selected = false,
  timestampLabel,
  unreadCount = 0,
}: ChatListItemProps) {
  const { t } = useTranslation();
  const [menu, setMenu] = useState<{ x: number; y: number } | null>(null);
  const unread = unreadCount > 0 || markedUnread;
  const gestures = useChatListGestures({
    canSwipeRight: unread,
    onCommitRight: () => onMarkRead?.(),
    onLongPress: (point) => setMenu(point),
    onOpen: () => onOpen?.(),
  });
  const unreadLabel = formatUnread(unreadCount);
  const tone = lastActivityTone(lastActivity.kind);
  const prefix = lastActivityPrefix(lastActivity, isGroup);
  const previewText =
    lastActivity.kind === "typing"
      ? t("conversations.typing")
      : lastActivity.kind === "media" && lastActivity.mediaType
        ? t(`conversations.media.${lastActivity.mediaType}`)
        : lastActivity.text;

  return (
    <div
      className="relative overflow-hidden"
      data-archived={archived ? "true" : "false"}
      data-chat-list-item=""
      data-kind={kind}
      data-muted={muted ? "true" : "false"}
      data-pinned={pinned ? "true" : "false"}
      data-selected={selected ? "true" : "false"}
      data-unread={unread ? "true" : "false"}
    >
      <SwipeActions muted={muted} onArchive={onArchive} onMarkRead={onMarkRead} onMute={onMute} />
      <div
        className={cn(
          "relative flex min-h-[var(--touch-target-min)] items-center gap-[var(--control-gap)] px-[var(--space-list-x)] py-[var(--space-list-y)]",
          selected ? "bg-[var(--surface-selected)]" : "bg-[var(--surface-panel)]",
        )}
        onContextMenu={gestures.onContextMenu}
        onPointerCancel={gestures.onPointerCancel}
        onPointerDown={gestures.onPointerDown}
        onPointerMove={gestures.onPointerMove}
        onPointerUp={gestures.onPointerUp}
        style={{ transform: `translateX(${gestures.offset}px)` }}
      >
        <Avatar
          className="size-[var(--chat-list-avatar-size)]"
          name={name}
          presence={presence}
          src={avatarSrc}
        />
        <div className="min-w-0 flex-1">
          <div className="flex items-baseline justify-between gap-[var(--space-2)]">
            <span className={cn("flex min-w-0 items-center gap-[var(--space-1)] truncate", WEIGHT_EMPHASIS)}>
              {pinned ? (
                <Pin
                  aria-label={t("conversations.pinned")}
                  className="h-[var(--pin-icon-size)] w-[var(--pin-icon-size)] text-[var(--text-tertiary)]"
                />
              ) : null}
              <span className="truncate">{name}</span>
            </span>
            <time className="shrink-0 text-[length:var(--text-xs)] text-[var(--text-tertiary)]">
              {timestampLabel}
            </time>
          </div>
          <div className="flex items-center justify-between gap-[var(--space-2)]">
            <p
              className={cn(
                "min-w-0 flex-1 truncate text-[length:var(--text-sm)]",
                tone === "accent" && "text-[var(--accent)]",
                tone === "italic" && "text-[var(--text-tertiary)] italic",
                tone === "default" && "text-[var(--text-secondary)]",
              )}
              data-activity={lastActivity.kind}
            >
              {prefix ? (
                <span className={cn("text-[var(--text-primary)]", WEIGHT_EMPHASIS)}>{`${prefix}: `}</span>
              ) : null}
              {previewText}
            </p>
            <span className="flex shrink-0 items-center gap-[var(--space-1)]">
              {muted ? (
                <BellOff
                  aria-label={t("conversations.muted")}
                  className={cn(ICON_CLASS, "text-[var(--text-tertiary)]")}
                />
              ) : null}
              {unread ? (
                <Badge variant={muted ? "muted" : "accent"}>
                  {unreadLabel || t("conversations.unread")}
                </Badge>
              ) : null}
            </span>
          </div>
        </div>
      </div>
      {menu ? (
        <ConversationMenu
          muted={muted}
          onArchive={onArchive}
          onClose={() => setMenu(null)}
          onMarkRead={onMarkRead}
          onMarkUnread={onMarkUnread}
          onMute={onMute}
          onPin={onPin}
          pinned={pinned}
          unread={unread}
          x={menu.x}
          y={menu.y}
        />
      ) : null}
    </div>
  );
}
