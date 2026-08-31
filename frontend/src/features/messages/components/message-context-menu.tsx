import {
  Clock,
  Copy,
  Flag,
  Forward,
  Info,
  List,
  Pencil,
  Pin,
  PinOff,
  Reply,
  RotateCcw,
  Smile,
  Sparkles,
  Star,
  StarOff,
  Trash2,
} from "lucide-react";
import { useLayoutEffect, useRef, useState } from "react";
import { useTranslation } from "react-i18next";
import { DEFAULT_QUICK_REACTIONS } from "@/features/messages/model/menu";
import { cn } from "@/shared/lib/cn";
import { menuPosFromElement } from "@/shared/lib/menu-position";
import { Button, DismissLayer } from "@/shared/ui";
import {
  ICON_CLASS,
  MENU_CONTENT_CLASS,
  MENU_ITEM_AI_CLASS,
  MENU_ITEM_CLASS,
  MENU_ITEM_DANGER_CLASS,
} from "@/shared/ui/metrics";

export interface MessageMenuActions {
  canEdit?: boolean;
  hasId?: boolean;
  hasText?: boolean;
  isFailed?: boolean;
  isMine?: boolean;
  isPinned?: boolean;
  isSaved?: boolean;
  onCopy?: () => void;
  onEdit?: () => void;
  onForward?: () => void;
  onInfo?: () => void;
  onPin?: () => void;
  onReact?: (emoji: string) => void;
  onReply?: () => void;
  onReport?: () => void;
  onRetry?: () => void;
  onSave?: () => void;
  onSelect?: () => void;
  onSuggestReply?: () => void;
  onTranslate?: () => void;
  onReactions?: () => void;
  onRemind?: () => void;
  onRegenerate?: () => void;
  onUnsend?: () => void;
  quickReactions?: string[];
}

export function MessageContextMenu({
  actions,
  onClose,
  x,
  y,
}: {
  actions: MessageMenuActions;
  onClose: () => void;
  x: number;
  y: number;
}) {
  const { t } = useTranslation();
  const menuRef = useRef<HTMLDivElement>(null);
  const [pos, setPos] = useState({ left: x, top: y });
  const reactions = actions.quickReactions ?? DEFAULT_QUICK_REACTIONS;
  const persisted = actions.hasId !== false && !actions.isFailed;

  useLayoutEffect(() => {
    setPos(menuPosFromElement(menuRef.current, x, y, window.innerWidth, window.innerHeight));
  }, [x, y]);

  const items: {
    accent?: boolean;
    danger?: boolean;
    key: string;
    label: string;
    onClick?: () => void;
  }[] = [
    {
      key: "retry",
      label: t("messages.menu.retry"),
      onClick: actions.isFailed ? actions.onRetry : undefined,
    },
    {
      key: "regenerate",
      label: t("messages.menu.regenerate"),
      onClick: actions.onRegenerate,
    },
    {
      key: "reply",
      label: t("messages.menu.reply"),
      onClick: persisted ? actions.onReply : undefined,
    },
    {
      key: "edit",
      label: t("messages.menu.edit"),
      onClick: actions.canEdit ? actions.onEdit : undefined,
    },
    {
      key: "forward",
      label: t("messages.menu.forward"),
      onClick: persisted ? actions.onForward : undefined,
    },
    {
      key: "copy",
      label: t("messages.menu.copy"),
      onClick: actions.hasText ? actions.onCopy : undefined,
    },
    {
      accent: true,
      key: "suggest_reply",
      label: t("messages.menu.suggest_reply"),
      onClick: persisted && actions.hasText ? actions.onSuggestReply : undefined,
    },
    {
      accent: true,
      key: "translate",
      label: t("messages.menu.translate"),
      onClick: persisted && actions.hasText ? actions.onTranslate : undefined,
    },
    {
      key: "pin",
      label: actions.isPinned ? t("messages.menu.unpin") : t("messages.menu.pin"),
      onClick: persisted ? actions.onPin : undefined,
    },
    {
      key: "save",
      label: actions.isSaved ? t("messages.menu.unsave") : t("messages.menu.save"),
      onClick: persisted ? actions.onSave : undefined,
    },
    {
      key: "info",
      label: t("messages.menu.info"),
      onClick: actions.isMine && persisted ? actions.onInfo : undefined,
    },
    {
      key: "select",
      label: t("messages.menu.select"),
      onClick: persisted ? actions.onSelect : undefined,
    },
    {
      key: "reactions",
      label: t("messages.menu.reactions"),
      onClick: persisted ? actions.onReactions : undefined,
    },
    {
      key: "remind",
      label: t("messages.menu.remind"),
      onClick: persisted ? actions.onRemind : undefined,
    },
    {
      key: "report",
      label: t("messages.menu.report"),
      onClick: persisted ? actions.onReport : undefined,
    },
    {
      key: "unsend",
      danger: true,
      label: t("messages.menu.unsend"),
      onClick: actions.isMine ? actions.onUnsend : undefined,
    },
  ];

  return (
    <>
      <DismissLayer label={t("ui.close")} onDismiss={onClose} scrim />
      <div
        className={cn(MENU_CONTENT_CLASS, "fixed z-[var(--z-menu)]")}
        data-message-menu=""
        ref={menuRef}
        role="menu"
        style={{ left: pos.left, top: pos.top }}
      >
        {persisted ? (
          <div className="flex gap-[var(--space-0_5)] px-[var(--space-1)] py-[var(--space-1)]">
            {reactions.map((emoji) => (
              <Button
                aria-label={t("messages.menu.react", { emoji })}
                className="min-h-[var(--touch-target-min)] min-w-[var(--touch-target-min)]"
                key={emoji}
                onClick={() => {
                  actions.onReact?.(emoji);
                  onClose();
                }}
                variant="ghost"
              >
                {emoji}
              </Button>
            ))}
          </div>
        ) : null}
        {items
          .filter((item) => item.onClick)
          .map((item) => (
            <Button
              className={cn(
                MENU_ITEM_CLASS,
                "w-full justify-start",
                item.danger && MENU_ITEM_DANGER_CLASS,
                item.accent && MENU_ITEM_AI_CLASS,
              )}
              key={item.key}
              onClick={() => {
                item.onClick?.();
                onClose();
              }}
              role="menuitem"
              variant="ghost"
            >
              <MenuIcon name={item.key} pinned={actions.isPinned} saved={actions.isSaved} />
              {item.label}
            </Button>
          ))}
      </div>
    </>
  );
}

function MenuIcon({ name, pinned, saved }: { name: string; pinned?: boolean; saved?: boolean }) {
  const className = ICON_CLASS;
  if (name === "retry" || name === "regenerate") {
    return <RotateCcw className={className} />;
  }
  if (name === "reply") {
    return <Reply className={className} />;
  }
  if (name === "edit") {
    return <Pencil className={className} />;
  }
  if (name === "forward") {
    return <Forward className={className} />;
  }
  if (name === "copy") {
    return <Copy className={className} />;
  }
  if (name === "suggest_reply" || name === "translate") {
    return <Sparkles className={className} />;
  }
  if (name === "pin") {
    return pinned ? <PinOff className={className} /> : <Pin className={className} />;
  }
  if (name === "save") {
    return saved ? <StarOff className={className} /> : <Star className={className} />;
  }
  if (name === "info") {
    return <Info className={className} />;
  }
  if (name === "select") {
    return <List className={className} />;
  }
  if (name === "reactions") {
    return <Smile className={className} />;
  }
  if (name === "remind") {
    return <Clock className={className} />;
  }
  if (name === "report") {
    return <Flag className={className} />;
  }
  return <Trash2 className={className} />;
}
