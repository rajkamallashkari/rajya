import { Plus } from "lucide-react";
import {
  useEffect,
  useRef,
  useState,
  type DragEvent,
  type FormEvent,
  type MouseEvent,
  type PointerEvent,
  type ReactNode,
} from "react";
import { useTranslation } from "react-i18next";
import type { ConversationFolder } from "@/features/conversations/api/http";
import {
  folderTabValue,
  moveFolderId,
  parseFolderTab,
} from "@/features/conversations/model/folders";
import { LONG_PRESS_MOVE_TOLERANCE_PX, LONG_PRESS_MS } from "@/shared/hooks/constants";
import {
  Badge,
  Button,
  DismissLayer,
  IconButton,
  Input,
  ResponsiveOverlay,
  ResponsiveOverlayDescription,
  ResponsiveOverlayContent,
  ResponsiveOverlayTitle,
} from "@/shared/ui";
import { cn } from "@/shared/lib/cn";
import { ICON_CLASS, MENU_CONTENT_CLASS, MENU_ITEM_CLASS } from "@/shared/ui/metrics";

export function FolderStrip({
  archivedUnread,
  folders,
  onCreate,
  onDestroy,
  onRename,
  onReorder,
  onTabChange,
  tab,
}: {
  archivedUnread: number;
  folders: ConversationFolder[];
  onCreate: (name: string) => void;
  onDestroy: (id: number) => void;
  onRename: (id: number, name: string) => void;
  onReorder: (ids: number[]) => void;
  onTabChange: (value: string) => void;
  tab: string;
}): ReactNode {
  const { t } = useTranslation();
  const [formFolder, setFormFolder] = useState<ConversationFolder | "create" | null>(null);
  const [destroying, setDestroying] = useState<ConversationFolder | null>(null);
  const [name, setName] = useState("");
  const [menu, setMenu] = useState<{
    folder: ConversationFolder;
    x: number;
    y: number;
  } | null>(null);
  const parsed = parseFolderTab(tab);
  const ids = folders.map((folder) => folder.id);

  const onDrop = (targetId: number, event: DragEvent<HTMLButtonElement>) => {
    event.preventDefault();
    const fromId = Number(event.dataTransfer.getData("text/folder-id"));
    if (!fromId) {
      return;
    }
    onReorder(moveFolderId(ids, fromId, targetId));
  };

  const onSubmit = (event: FormEvent) => {
    event.preventDefault();
    const next = name.trim();
    if (!next) {
      return;
    }
    if (formFolder === "create") {
      onCreate(next);
    } else if (formFolder) {
      onRename(formFolder.id, next);
    }
    setName("");
    setFormFolder(null);
  };

  return (
    <div
      className="flex items-center gap-[var(--space-1)] overflow-x-auto px-[var(--space-list-x)] pb-[var(--space-list-y)]"
      data-folder-strip=""
    >
      <div className="flex items-center gap-[var(--space-1)]" role="tablist">
        <TabButton
          label={t("conversations.folders.all")}
          onSelect={() => onTabChange("all")}
          selected={tab === "all"}
          value="all"
        />
        <TabButton
          label={t("conversations.folders.unread")}
          onSelect={() => onTabChange("unread")}
          selected={tab === "unread"}
          value="unread"
        />
        {folders.map((folder) => (
          <CustomFolderTab
            folder={folder}
            key={folder.id}
            onDragStart={(event) => event.dataTransfer.setData("text/folder-id", String(folder.id))}
            onDrop={(event) => onDrop(folder.id, event)}
            onMenu={(point) => setMenu({ folder, ...point })}
            onSelect={() => onTabChange(folderTabValue({ kind: "folder", id: folder.id }))}
            selected={parsed.kind === "folder" && parsed.id === folder.id}
          />
        ))}
        <TabButton
          label={t("conversations.folders.archived")}
          onSelect={() => onTabChange("archived")}
          selected={tab === "archived"}
          unreadCount={archivedUnread}
          value="archived"
        />
      </div>
      <IconButton
        aria-label={t("conversations.folders.create")}
        onClick={() => {
          setName("");
          setFormFolder("create");
        }}
        type="button"
      >
        <Plus className={ICON_CLASS} />
      </IconButton>
      {menu ? (
        <>
          <DismissLayer label={t("ui.close")} onDismiss={() => setMenu(null)} scrim />
          <div
            className={cn(MENU_CONTENT_CLASS, "fixed z-[var(--z-menu)]")}
            data-folder-menu=""
            role="menu"
            style={{ left: menu.x, top: menu.y }}
          >
            <Button
              className={cn(MENU_ITEM_CLASS, "w-full justify-start")}
              onClick={() => {
                setFormFolder(menu.folder);
                setName(menu.folder.name);
                setMenu(null);
              }}
              role="menuitem"
              variant="ghost"
            >
              {t("conversations.folders.rename")}
            </Button>
            <Button
              className={cn(MENU_ITEM_CLASS, "w-full justify-start")}
              onClick={() => {
                setDestroying(menu.folder);
                setMenu(null);
              }}
              role="menuitem"
              variant="ghost"
            >
              {t("conversations.folders.delete")}
            </Button>
          </div>
        </>
      ) : null}
      <ResponsiveOverlay
        onOpenChange={(open) => {
          if (!open) {
            setFormFolder(null);
            setName("");
          }
        }}
        open={formFolder !== null}
      >
        <ResponsiveOverlayContent>
          <ResponsiveOverlayTitle>
            {formFolder === "create"
              ? t("conversations.folders.create")
              : t("conversations.folders.rename")}
          </ResponsiveOverlayTitle>
          <ResponsiveOverlayDescription className="sr-only">
            {t("conversations.folders.form_description")}
          </ResponsiveOverlayDescription>
          <form
            className="mt-[var(--space-4)] flex flex-col gap-[var(--space-3)]"
            onSubmit={onSubmit}
          >
            <Input
              aria-label={
                formFolder === "create"
                  ? t("conversations.folders.name")
                  : t("conversations.folders.rename_name")
              }
              autoFocus
              onChange={(event) => setName(event.target.value)}
              value={name}
            />
            <Button disabled={!name.trim()} type="submit">
              {formFolder === "create"
                ? t("conversations.folders.save")
                : t("conversations.folders.rename_save")}
            </Button>
          </form>
        </ResponsiveOverlayContent>
      </ResponsiveOverlay>
      <ResponsiveOverlay
        onOpenChange={(open) => {
          if (!open) {
            setDestroying(null);
          }
        }}
        open={destroying !== null}
      >
        <ResponsiveOverlayContent>
          <ResponsiveOverlayTitle>{t("conversations.folders.delete_title")}</ResponsiveOverlayTitle>
          <ResponsiveOverlayDescription className="mt-[var(--space-2)]">
            {t("conversations.folders.delete_description", { name: destroying?.name ?? "" })}
          </ResponsiveOverlayDescription>
          <div className="mt-[var(--space-4)] flex justify-end gap-[var(--space-2)]">
            <Button onClick={() => setDestroying(null)} type="button" variant="ghost">
              {t("ui.cancel")}
            </Button>
            <Button
              onClick={() => {
                if (destroying) {
                  onDestroy(destroying.id);
                }
                setDestroying(null);
              }}
              type="button"
              variant="danger"
            >
              {t("conversations.folders.delete")}
            </Button>
          </div>
        </ResponsiveOverlayContent>
      </ResponsiveOverlay>
    </div>
  );
}

function CustomFolderTab({
  folder,
  onDragStart,
  onDrop,
  onMenu,
  onSelect,
  selected,
}: {
  folder: ConversationFolder;
  onDragStart: (event: DragEvent<HTMLButtonElement>) => void;
  onDrop: (event: DragEvent<HTMLButtonElement>) => void;
  onMenu: (point: { x: number; y: number }) => void;
  onSelect: () => void;
  selected: boolean;
}) {
  const startRef = useRef<{ x: number; y: number } | null>(null);
  const timerRef = useRef<ReturnType<typeof setTimeout> | null>(null);
  const suppressClickRef = useRef(false);

  const clearTimer = () => {
    if (timerRef.current) {
      clearTimeout(timerRef.current);
      timerRef.current = null;
    }
  };

  useEffect(
    () => () => {
      if (timerRef.current) {
        clearTimeout(timerRef.current);
      }
    },
    [],
  );

  const onPointerDown = (event: PointerEvent<HTMLButtonElement>) => {
    if (event.button !== 0 || event.pointerType === "mouse") {
      return;
    }
    const point = { x: event.clientX, y: event.clientY };
    startRef.current = point;
    suppressClickRef.current = false;
    clearTimer();
    timerRef.current = setTimeout(() => {
      suppressClickRef.current = true;
      onMenu(point);
    }, LONG_PRESS_MS);
  };

  const onPointerMove = (event: PointerEvent<HTMLButtonElement>) => {
    const start = startRef.current;
    if (
      start &&
      (Math.abs(event.clientX - start.x) > LONG_PRESS_MOVE_TOLERANCE_PX ||
        Math.abs(event.clientY - start.y) > LONG_PRESS_MOVE_TOLERANCE_PX)
    ) {
      clearTimer();
    }
  };

  return (
    <TabButton
      draggable
      label={folder.name}
      onClick={() => {
        if (suppressClickRef.current) {
          suppressClickRef.current = false;
          return;
        }
        onSelect();
      }}
      onContextMenu={(event) => {
        event.preventDefault();
        onMenu({ x: event.clientX, y: event.clientY });
      }}
      onDragStart={onDragStart}
      onDrop={onDrop}
      onPointerCancel={clearTimer}
      onPointerDown={onPointerDown}
      onPointerMove={onPointerMove}
      onPointerUp={clearTimer}
      selected={selected}
      value={folderTabValue({ kind: "folder", id: folder.id })}
    />
  );
}

function TabButton({
  draggable = false,
  label,
  onClick,
  onContextMenu,
  onDragStart,
  onDrop,
  onPointerCancel,
  onPointerDown,
  onPointerMove,
  onPointerUp,
  onSelect,
  selected,
  unreadCount = 0,
  value,
}: {
  draggable?: boolean;
  label: string;
  onClick?: () => void;
  onContextMenu?: (event: MouseEvent<HTMLButtonElement>) => void;
  onDragStart?: (event: DragEvent<HTMLButtonElement>) => void;
  onDrop?: (event: DragEvent<HTMLButtonElement>) => void;
  onPointerCancel?: () => void;
  onPointerDown?: (event: PointerEvent<HTMLButtonElement>) => void;
  onPointerMove?: (event: PointerEvent<HTMLButtonElement>) => void;
  onPointerUp?: () => void;
  onSelect?: () => void;
  selected: boolean;
  unreadCount?: number;
  value: string;
}) {
  return (
    <Button
      aria-label={label}
      aria-selected={selected}
      className="shrink-0"
      data-folder-tab={value}
      draggable={draggable}
      onClick={onClick ?? onSelect}
      onContextMenu={onContextMenu}
      onDragOver={(event) => event.preventDefault()}
      onDragStart={onDragStart}
      onDrop={onDrop}
      onPointerCancel={onPointerCancel}
      onPointerDown={onPointerDown}
      onPointerMove={onPointerMove}
      onPointerUp={onPointerUp}
      role="tab"
      size="sm"
      type="button"
      variant={selected ? "secondary" : "ghost"}
    >
      {label}
      {unreadCount > 0 ? <Badge variant="accent">{String(unreadCount)}</Badge> : null}
    </Button>
  );
}
