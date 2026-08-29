import { useMemo, useRef, useState, type ReactNode, type RefObject } from "react";
import { useTranslation } from "react-i18next";
import { Link } from "react-router";
import { ChatListItem } from "@/features/conversations/components/chat-list-item";
import { DEMO_CONVERSATIONS } from "@/features/conversations/model/demo";
import { conversationLayer, useLayerStore } from "@/shared/lib/navigation/layer-store";
import { Button } from "@/shared/ui/button";
import { Input } from "@/shared/ui/input";
import { ListView, type ListViewStatus } from "@/shared/ui/list-view";
import { Logo } from "@/shared/ui/logo";
import { useResolvedTheme } from "@/app/theme-provider";

export function ConversationList({
  onRetry,
  searchRef,
  status = "ready",
}: {
  onRetry?: () => void;
  searchRef?: RefObject<HTMLInputElement | null>;
  status?: ListViewStatus;
}): ReactNode {
  const { t } = useTranslation();
  const resolvedTheme = useResolvedTheme();
  const openConversation = useLayerStore((state) => state.openConversation);
  const layers = useLayerStore((state) => state.layers);
  const [query, setQuery] = useState("");
  const localRef = useRef<HTMLInputElement>(null);
  const inputRef = searchRef ?? localRef;
  const selectedId = layers.find((layer) => layer.kind === "conversation")?.conversationId;
  const filtered = useMemo(() => {
    const needle = query.trim().toLowerCase();
    if (!needle) {
      return DEMO_CONVERSATIONS;
    }
    return DEMO_CONVERSATIONS.filter((item) => item.name.toLowerCase().includes(needle));
  }, [query]);
  const listStatus: ListViewStatus = status === "ready" && filtered.length === 0 ? "empty" : status;

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
          onRetry={onRetry}
          status={listStatus}
        >
          {filtered.map((item) => (
            <ChatListItem
              isGroup={item.id === "team"}
              key={item.id}
              lastActivity={item.lastActivity}
              name={item.name}
              onOpen={() => openConversation(conversationLayer(item.id, item.name))}
              selected={selectedId === item.id}
              timestampLabel={item.timestampLabel}
              unreadCount={item.unreadCount}
            />
          ))}
        </ListView>
      </div>
    </div>
  );
}
