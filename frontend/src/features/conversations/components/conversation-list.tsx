import { useMemo, useRef, useState, type ReactNode, type RefObject } from "react";
import { useTranslation } from "react-i18next";
import { Link } from "react-router";
import { formatMessageTime } from "@/features/messages";
import { ChatListItem } from "@/features/conversations/components/chat-list-item";
import { FolderStrip } from "@/features/conversations/components/folder-strip";
import type { Conversation, ConversationFolder } from "@/features/conversations/api/http";
import {
  useArchiveConversation,
  useConversations,
  useCreateFolder,
  useDestroyFolder,
  useFolderMembership,
  useFolders,
  useMarkConversationUnread,
  useMuteConversation,
  usePinConversation,
  useReorderFolders,
} from "@/features/conversations/api/queries";
import { lastActivityFromPreview } from "@/features/conversations/model/preview";
import { useTypingIndicators } from "@/features/conversations/hooks/use-typing-indicators";
import {
  archivedUnreadCount,
  folderIdsForConversation,
  parseFolderTab,
  visibleConversations,
} from "@/features/conversations/model/folders";
import {
  conversationTitle,
  isGroupConversation,
  isMuted,
} from "@/features/conversations/model/title";
import { conversationLayer, useLayerStore } from "@/shared/lib/navigation/layer-store";
import { Button } from "@/shared/ui/button";
import { Input } from "@/shared/ui/input";
import { ListView, type ListViewStatus } from "@/shared/ui/list-view";
import { Logo } from "@/shared/ui/logo";
import { useResolvedTheme } from "@/app/theme-provider";

const EMPTY_FOLDERS: ConversationFolder[] = [];

export function ConversationList({
  searchRef,
}: {
  searchRef?: RefObject<HTMLInputElement | null>;
}): ReactNode {
  const { t, i18n } = useTranslation();
  const resolvedTheme = useResolvedTheme();
  const openConversation = useLayerStore((state) => state.openConversation);
  const layers = useLayerStore((state) => state.layers);
  const [query, setQuery] = useState("");
  const [tab, setTab] = useState("all");
  const localRef = useRef<HTMLInputElement>(null);
  const inputRef = searchRef ?? localRef;
  const selectedId = layers.find((layer) => layer.kind === "conversation")?.conversationId;
  const parsed = parseFolderTab(tab);
  const inbox = useConversations();
  const archived = useConversations(true);
  const foldersQuery = useFolders();
  const pinConversation = usePinConversation();
  const markUnread = useMarkConversationUnread();
  const archiveConversation = useArchiveConversation();
  const muteConversation = useMuteConversation();
  const createFolder = useCreateFolder();
  const destroyFolder = useDestroyFolder();
  const reorderFolders = useReorderFolders();
  const folderMembership = useFolderMembership();
  const folderRows = foldersQuery.data?.folders ?? EMPTY_FOLDERS;
  const source = parsed.kind === "archived" ? archived : inbox;
  const filtered = useMemo(() => {
    const rows = visibleConversations(
      inbox.data?.conversations ?? [],
      archived.data?.conversations ?? [],
      folderRows,
      parsed,
    );
    const needle = query.trim().toLowerCase();
    if (!needle) {
      return rows;
    }
    return rows.filter((item) =>
      conversationTitle(item, t("conversations.untitled")).toLowerCase().includes(needle),
    );
  }, [archived.data, folderRows, inbox.data, parsed, query, t]);
  const listStatus: ListViewStatus = source.isPending
    ? "loading"
    : source.isError
      ? "error"
      : filtered.length === 0
        ? "empty"
        : "ready";

  return (
    <div
      className="flex h-full min-h-0 flex-col bg-[var(--surface-panel)]"
      data-conversation-list=""
    >
      <header className="flex items-center gap-[var(--control-gap)] px-[var(--space-list-x)] py-[var(--space-list-y)]">
        <Logo resolvedTheme={resolvedTheme} />
        <div className="min-w-0 flex-1">
          <p className="[font-weight:var(--font-weight-emphasis)]">{t("shell.chats")}</p>
          <p className="text-[length:var(--text-sm)] text-[var(--text-secondary)]">
            {t("app.tagline")}
          </p>
        </div>
        <Button asChild size="sm" variant="ghost">
          <Link to="/dev/gallery">{t("app.gallery")}</Link>
        </Button>
        <Button asChild size="sm" variant="ghost">
          <Link to="/dev/accounts">{t("app.accounts")}</Link>
        </Button>
      </header>
      <div className="px-[var(--space-list-x)] pb-[var(--space-list-y)]">
        <Input
          aria-label={t("search.label")}
          onChange={(event) => setQuery(event.target.value)}
          placeholder={t("search.placeholder")}
          ref={inputRef}
          value={query}
        />
      </div>
      <FolderStrip
        archivedUnread={archivedUnreadCount(archived.data?.conversations ?? [])}
        folders={folderRows}
        onCreate={(name) => createFolder.mutate(name)}
        onDestroy={(id) =>
          destroyFolder.mutate(id, {
            onSuccess: () => setTab("all"),
          })
        }
        onReorder={(ids) => reorderFolders.mutate(ids)}
        onTabChange={setTab}
        tab={tab}
      />
      <div className="min-h-0 flex-1 overflow-y-auto" data-layer-scroll="base">
        <ListView
          action={
            <Button onClick={() => setQuery("")} type="button">
              {t("lists.empty_action")}
            </Button>
          }
          onRetry={() => void source.refetch()}
          status={listStatus}
        >
          {filtered.map((item) => (
            <LiveChatRow
              archived={parsed.kind === "archived"}
              folders={folderRows}
              item={item}
              key={item.id}
              locale={i18n.language}
              onArchive={() =>
                archiveConversation.mutate({ archived: parsed.kind !== "archived", id: item.id })
              }
              onMarkRead={() => markUnread.mutate({ id: item.id, unread: false })}
              onMarkUnread={() => markUnread.mutate({ id: item.id, unread: true })}
              onMute={(duration) => muteConversation.mutate({ duration, id: item.id })}
              onOpen={(name) => openConversation(conversationLayer(String(item.id), name))}
              onPin={() => pinConversation.mutate({ id: item.id, pinned: !item.pinned_at })}
              onToggleFolder={(folderId, add) =>
                folderMembership.mutate({ add, conversationId: item.id, folderId })
              }
              selected={selectedId === String(item.id)}
              untitled={t("conversations.untitled")}
            />
          ))}
        </ListView>
      </div>
    </div>
  );
}

function LiveChatRow({
  archived,
  folders,
  item,
  locale,
  onArchive,
  onMarkRead,
  onMarkUnread,
  onMute,
  onOpen,
  onPin,
  onToggleFolder,
  selected,
  untitled,
}: {
  archived: boolean;
  folders: ConversationFolder[];
  item: Conversation;
  locale: string;
  onArchive: () => void;
  onMarkRead: () => void;
  onMarkUnread: () => void;
  onMute: (duration: number) => void;
  onOpen: (name: string) => void;
  onPin: () => void;
  onToggleFolder: (folderId: number, add: boolean) => void;
  selected: boolean;
  untitled: string;
}): ReactNode {
  const { t } = useTranslation();
  const typists = useTypingIndicators(item.id);
  const name = conversationTitle(item, untitled);
  const preview = lastActivityFromPreview(item.last_message, t("conversations.last_message_deleted"));
  const lastActivity = typists[0]
    ? { kind: "typing" as const, text: t(`conversations.activity.${typists[0].activity}`) }
    : preview;
  return (
    <ChatListItem
      archived={archived}
      folders={folders}
      folderIds={folderIdsForConversation(folders, item.id)}
      isGroup={isGroupConversation(item)}
      lastActivity={lastActivity}
      markedUnread={Boolean(item.manually_unread_at)}
      muted={isMuted(item)}
      name={name}
      onArchive={onArchive}
      onMarkRead={onMarkRead}
      onMarkUnread={onMarkUnread}
      onMute={onMute}
      onOpen={() => onOpen(name)}
      onPin={onPin}
      onToggleFolder={onToggleFolder}
      pinned={Boolean(item.pinned_at)}
      selected={selected}
      timestampLabel={formatMessageTime(item.last_activity_at, locale)}
      unreadCount={item.unread_count}
    />
  );
}
