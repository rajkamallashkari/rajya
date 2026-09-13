import { Archive, BellOff, Check, ChevronRight } from "lucide-react";
import { useTranslation } from "react-i18next";
import type { ConversationFolder } from "@/features/conversations/api/http";
import { muteDurationOptions } from "@/features/conversations/model/mute";
import { cn } from "@/shared/lib/cn";
import {
  Button,
  Checkbox,
  DismissLayer,
  ResponsiveOverlay,
  ResponsiveOverlayContent,
  ResponsiveOverlayTitle,
} from "@/shared/ui";
import { ICON_CLASS, MENU_CONTENT_CLASS, MENU_ITEM_CLASS } from "@/shared/ui/metrics";

export function ConversationMenu({
  archived = false,
  folders = [],
  muted,
  onAddToFolder,
  onArchive,
  onClose,
  onMarkRead,
  onMarkUnread,
  onMute,
  onOpenFolders,
  onOpenMute,
  onPin,
  pinned,
  unread,
  x,
  y,
}: {
  archived?: boolean;
  folders?: ConversationFolder[];
  folderIds?: number[];
  muted: boolean;
  onAddToFolder?: (folderId: number, add: boolean) => void;
  onArchive?: () => void;
  onClose: () => void;
  onMarkRead?: () => void;
  onMarkUnread?: () => void;
  onMute?: (duration: number) => void;
  onOpenFolders?: () => void;
  onOpenMute?: () => void;
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
    ...(muted
      ? [
          {
            key: "unmute",
            label: t("conversations.unmute"),
            onClick: onMute ? () => onMute(0) : undefined,
          },
        ]
      : [
          {
            key: "mute",
            label: t("conversations.mute"),
            onClick: onMute ? onOpenMute : undefined,
            nested: true,
          },
        ]),
    {
      key: "archive",
      label: archived ? t("conversations.unarchive") : t("conversations.archive"),
      onClick: onArchive,
    },
    {
      key: "folders",
      label: t("conversations.folders.action"),
      nested: true,
      onClick: folders.length > 0 && onAddToFolder ? onOpenFolders : undefined,
    },
  ].filter((item): item is { key: string; label: string; nested?: boolean; onClick: () => void } =>
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
            <span className="flex-1 text-left">{item.label}</span>
            {item.nested ? <ChevronRight className={ICON_CLASS} aria-hidden="true" /> : null}
          </Button>
        ))}
      </div>
    </>
  );
}

export function MuteDurationOverlay({
  onMute,
  onOpenChange,
  open,
}: {
  onMute: (duration: number) => void;
  onOpenChange: (open: boolean) => void;
  open: boolean;
}) {
  const { t } = useTranslation();
  return (
    <ResponsiveOverlay onOpenChange={onOpenChange} open={open}>
      <ResponsiveOverlayContent>
        <ResponsiveOverlayTitle>{t("conversations.mute")}</ResponsiveOverlayTitle>
        <div className="mt-[var(--space-3)] flex flex-col gap-[var(--space-1)]">
          {muteDurationOptions().map((option) => (
            <Button
              className="w-full justify-start"
              key={option.seconds}
              onClick={() => {
                onMute(option.seconds);
                onOpenChange(false);
              }}
              variant="ghost"
            >
              {t(option.labelKey)}
            </Button>
          ))}
        </div>
      </ResponsiveOverlayContent>
    </ResponsiveOverlay>
  );
}

export function FolderMembershipOverlay({
  folderIds,
  folders,
  onOpenChange,
  onToggleFolder,
  open,
}: {
  folderIds: number[];
  folders: ConversationFolder[];
  onOpenChange: (open: boolean) => void;
  onToggleFolder: (folderId: number, add: boolean) => void;
  open: boolean;
}) {
  const { t } = useTranslation();
  return (
    <ResponsiveOverlay onOpenChange={onOpenChange} open={open}>
      <ResponsiveOverlayContent>
        <ResponsiveOverlayTitle>{t("conversations.folders.action")}</ResponsiveOverlayTitle>
        <div className="mt-[var(--space-3)] flex flex-col gap-[var(--space-2)]">
          {folders.map((folder) => {
            const checked = folderIds.includes(folder.id);
            return (
              <label
                className="flex min-h-[var(--touch-target-min)] items-center justify-between gap-[var(--space-3)]"
                key={folder.id}
              >
                <span>{folder.name}</span>
                <Checkbox
                  aria-label={folder.name}
                  checked={checked}
                  onCheckedChange={(next) => onToggleFolder(folder.id, next === true)}
                />
              </label>
            );
          })}
        </div>
      </ResponsiveOverlayContent>
    </ResponsiveOverlay>
  );
}

export function SwipeActions({
  archived = false,
  muted,
  onArchive,
  onMarkRead,
  onMute,
}: {
  archived?: boolean;
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
        <IconAction
          label={muted ? t("conversations.unmute") : t("conversations.mute")}
          onClick={onMute}
        >
          <BellOff className={ICON_CLASS} />
        </IconAction>
        <IconAction
          label={archived ? t("conversations.unarchive") : t("conversations.archive")}
          onClick={onArchive}
        >
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
