import { Archive, BellOff, Check } from "lucide-react";
import { useTranslation } from "react-i18next";
import { cn } from "@/shared/lib/cn";
import { Button, DismissLayer } from "@/shared/ui";
import { ICON_CLASS, MENU_CONTENT_CLASS, MENU_ITEM_CLASS } from "@/shared/ui/metrics";

export function ConversationMenu({
  muted,
  onArchive,
  onClose,
  onMarkRead,
  onMarkUnread,
  onMute,
  onPin,
  pinned,
  unread,
  x,
  y,
}: {
  muted: boolean;
  onArchive?: () => void;
  onClose: () => void;
  onMarkRead?: () => void;
  onMarkUnread?: () => void;
  onMute?: () => void;
  onPin?: () => void;
  pinned: boolean;
  unread: boolean;
  x: number;
  y: number;
}) {
  const { t } = useTranslation();
  const items = [
    {
      key: "pin",
      label: pinned ? t("conversations.unpin") : t("conversations.pin"),
      onClick: onPin,
    },
    {
      key: "unread",
      label: unread ? t("conversations.mark_read") : t("conversations.mark_unread"),
      onClick: unread ? onMarkRead : onMarkUnread,
    },
    {
      key: "mute",
      label: muted ? t("conversations.unmute") : t("conversations.mute"),
      onClick: onMute,
    },
    {
      key: "archive",
      label: t("conversations.archive"),
      onClick: onArchive,
    },
  ].filter((item): item is { key: string; label: string; onClick: () => void } =>
    Boolean(item.onClick),
  );

  return (
    <>
      <DismissLayer label={t("ui.close")} onDismiss={onClose} scrim />
      <div
        className={cn(MENU_CONTENT_CLASS, "fixed z-[var(--z-menu)]")}
        data-conversation-menu=""
        role="menu"
        style={{ left: x, top: y }}
      >
        {items.map((item) => (
          <Button
            className={cn(MENU_ITEM_CLASS, "w-full justify-start")}
            key={item.key}
            onClick={() => {
              item.onClick();
              onClose();
            }}
            role="menuitem"
            variant="ghost"
          >
            {item.label}
          </Button>
        ))}
      </div>
    </>
  );
}

export function SwipeActions({
  muted,
  onArchive,
  onMarkRead,
  onMute,
}: {
  muted: boolean;
  onArchive?: () => void;
  onMarkRead?: () => void;
  onMute?: () => void;
}) {
  const { t } = useTranslation();
  return (
    <>
      <div className="absolute inset-y-0 left-0 flex w-[var(--swipe-action-width)] items-center justify-center bg-[var(--status-success-subtle)]">
        <IconAction label={t("conversations.mark_read")} onClick={onMarkRead}>
          <Check className={ICON_CLASS} />
        </IconAction>
      </div>
      <div className="absolute inset-y-0 right-0 flex w-[calc(var(--swipe-action-width)*2)] items-center justify-end bg-[var(--status-warning-subtle)]">
        <IconAction label={muted ? t("conversations.unmute") : t("conversations.mute")} onClick={onMute}>
          <BellOff className={ICON_CLASS} />
        </IconAction>
        <IconAction label={t("conversations.archive")} onClick={onArchive}>
          <Archive className={ICON_CLASS} />
        </IconAction>
      </div>
    </>
  );
}

function IconAction({
  children,
  label,
  onClick,
}: {
  children: React.ReactNode;
  label: string;
  onClick?: () => void;
}) {
  return (
    <Button
      aria-label={label}
      className="h-full min-h-[var(--touch-target-min)] w-[var(--swipe-action-width)] rounded-none"
      onClick={onClick}
      variant="ghost"
    >
      {children}
    </Button>
  );
}
