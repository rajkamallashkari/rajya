import { useState, type DragEvent, type FormEvent, type ReactNode } from "react";
import { useTranslation } from "react-i18next";
import type { ConversationFolder } from "@/features/conversations/api/http";
import { folderTabValue, moveFolderId, parseFolderTab } from "@/features/conversations/model/folders";
import { Badge, Button, Input } from "@/shared/ui";

export function FolderStrip({
  archivedUnread,
  folders,
  onCreate,
  onDestroy,
  onReorder,
  onTabChange,
  tab,
}: {
  archivedUnread: number;
  folders: ConversationFolder[];
  onCreate: (name: string) => void;
  onDestroy: (id: number) => void;
  onReorder: (ids: number[]) => void;
  onTabChange: (value: string) => void;
  tab: string;
}): ReactNode {
  const { t } = useTranslation();
  const [creating, setCreating] = useState(false);
  const [name, setName] = useState("");
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
    onCreate(next);
    setName("");
    setCreating(false);
  };

  return (
    <div
      className="flex items-center gap-[var(--space-1)] overflow-x-auto px-[var(--space-list-x)] pb-[var(--space-list-y)]"
      data-folder-strip=""
      role="tablist"
    >
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
        <TabButton
          key={folder.id}
          draggable
          label={folder.name}
          onDragStart={(event) => event.dataTransfer.setData("text/folder-id", String(folder.id))}
          onDrop={(event) => onDrop(folder.id, event)}
          onSelect={() => onTabChange(folderTabValue({ kind: "folder", id: folder.id }))}
          selected={parsed.kind === "folder" && parsed.id === folder.id}
          value={folderTabValue({ kind: "folder", id: folder.id })}
        />
      ))}
      {creating ? (
        <form className="flex items-center gap-[var(--space-1)]" onSubmit={onSubmit}>
          <Input
            aria-label={t("conversations.folders.name")}
            onChange={(event) => setName(event.target.value)}
            value={name}
          />
          <Button size="sm" type="submit">
            {t("conversations.folders.save")}
          </Button>
        </form>
      ) : (
        <Button onClick={() => setCreating(true)} size="sm" type="button" variant="ghost">
          {t("conversations.folders.create")}
        </Button>
      )}
      {parsed.kind === "folder" ? (
        <Button
          onClick={() => onDestroy(parsed.id)}
          size="sm"
          type="button"
          variant="ghost"
        >
          {t("conversations.folders.delete")}
        </Button>
      ) : null}
      <TabButton
        label={t("conversations.folders.archived")}
        onSelect={() => onTabChange("archived")}
        selected={tab === "archived"}
        unreadCount={archivedUnread}
        value="archived"
      />
    </div>
  );
}

function TabButton({
  draggable = false,
  label,
  onDragStart,
  onDrop,
  onSelect,
  selected,
  unreadCount = 0,
  value,
}: {
  draggable?: boolean;
  label: string;
  onDragStart?: (event: DragEvent<HTMLButtonElement>) => void;
  onDrop?: (event: DragEvent<HTMLButtonElement>) => void;
  onSelect: () => void;
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
      onClick={onSelect}
      onDragOver={(event) => event.preventDefault()}
      onDragStart={onDragStart}
      onDrop={onDrop}
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
