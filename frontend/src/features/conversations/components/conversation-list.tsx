import { useMemo, useRef, useState, type ReactNode, type RefObject } from "react";
import { useTranslation } from "react-i18next";
import { Link } from "react-router";
import { formatMessageTime } from "@/features/messages";
import { ChatListItem } from "@/features/conversations/components/chat-list-item";
import { useConversations } from "@/features/conversations/api/queries";
import { lastActivityFromPreview } from "@/features/conversations/model/preview";
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
  const localRef = useRef<HTMLInputElement>(null);
  const inputRef = searchRef ?? localRef;
  const selectedId = layers.find((layer) => layer.kind === "conversation")?.conversationId;
  const conversations = useConversations();
  const filtered = useMemo(() => {
    const rows = conversations.data?.conversations ?? [];
    const needle = query.trim().toLowerCase();
    if (!needle) {
      return rows;
    }
    return rows.filter((item) =>
      conversationTitle(item, t("conversations.untitled")).toLowerCase().includes(needle),
    );
  }, [conversations.data, query, t]);
  const listStatus: ListViewStatus = conversations.isPending
    ? "loading"
    : conversations.isError
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
      <div className="min-h-0 flex-1 overflow-y-auto" data-layer-scroll="base">
        <ListView
          action={
            <Button onClick={() => setQuery("")} type="button">
              {t("lists.empty_action")}
            </Button>
          }
          onRetry={() => void conversations.refetch()}
          status={listStatus}
        >
          {filtered.map((item) => {
            const name = conversationTitle(item, t("conversations.untitled"));
            return (
              <ChatListItem
                isGroup={isGroupConversation(item)}
                key={item.id}
                lastActivity={lastActivityFromPreview(
                  item.last_message,
                  t("conversations.last_message_deleted"),
                )}
                muted={isMuted(item)}
                name={name}
                onOpen={() => openConversation(conversationLayer(String(item.id), name))}
                selected={selectedId === String(item.id)}
                timestampLabel={formatMessageTime(item.last_activity_at, i18n.language)}
                unreadCount={item.unread_count}
              />
            );
          })}
        </ListView>
      </div>
    </div>
  );
}
