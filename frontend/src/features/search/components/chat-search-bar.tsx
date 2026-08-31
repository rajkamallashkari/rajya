import { AlignJustify, ArrowUpDown, X } from "lucide-react";
import { useEffect, useRef, type KeyboardEvent, type ReactNode } from "react";
import { useTranslation } from "react-i18next";
import { useConversationSearch } from "@/features/search/api/queries";
import { useDebouncedValue } from "@/features/search/hooks/use-debounced-value";
import { SEARCH_DEBOUNCE_MS, SEARCH_MIN_QUERY_LENGTH } from "@/features/search/model/constants";
import { meetsMinQueryLength } from "@/features/search/model/highlight";
import { useSearchStore } from "@/features/search/store/search-store";
import { IconButton } from "@/shared/ui/icon-button";
import { Input } from "@/shared/ui/input";

export function ChatSearchBar({
  conversationId,
  matchIndex,
  onCycle,
}: {
  conversationId: number;
  matchIndex: number;
  onCycle: (direction: 1 | -1) => void;
}): ReactNode {
  const { t } = useTranslation();
  const query = useSearchStore((state) => state.query);
  const setQuery = useSearchStore((state) => state.setQuery);
  const mode = useSearchStore((state) => state.mode);
  const toggleMode = useSearchStore((state) => state.toggleMode);
  const closeChatSearch = useSearchStore((state) => state.closeChatSearch);
  const debounced = useDebouncedValue(query, SEARCH_DEBOUNCE_MS);
  const search = useConversationSearch(conversationId, debounced);
  const inputRef = useRef<HTMLInputElement>(null);
  const total = search.data?.messages.length ?? 0;
  const ready = meetsMinQueryLength(debounced, SEARCH_MIN_QUERY_LENGTH);

  useEffect(() => {
    inputRef.current?.focus();
  }, []);

  const onKeyDown = (event: KeyboardEvent<HTMLInputElement>): void => {
    if (event.key === "Escape") {
      event.preventDefault();
      closeChatSearch();
      return;
    }
    if (mode !== "navigate") {
      return;
    }
    if (event.key === "Enter") {
      event.preventDefault();
      onCycle(event.shiftKey ? -1 : 1);
    } else if (event.key === "ArrowDown") {
      event.preventDefault();
      onCycle(1);
    } else if (event.key === "ArrowUp") {
      event.preventDefault();
      onCycle(-1);
    }
  };

  return (
    <div className="flex min-w-0 flex-1 items-center gap-[var(--control-gap)]">
      <Input
        aria-label={mode === "list" ? t("search.in_chat_list") : t("search.in_chat")}
        autoComplete="off"
        onChange={(event) => setQuery(event.target.value)}
        onKeyDown={onKeyDown}
        placeholder={mode === "list" ? t("search.in_chat_list") : t("search.in_chat")}
        ref={inputRef}
        spellCheck={false}
        type="search"
        value={query}
      />
      {query ? (
        <IconButton aria-label={t("search.clear")} onClick={() => setQuery("")} type="button">
          <X className="h-[var(--icon-size)] w-[var(--icon-size)]" />
        </IconButton>
      ) : null}
      {ready ? (
        <span className="w-[var(--space-10)] text-center text-[length:var(--text-xs)] text-[var(--text-secondary)] tabular-nums">
          {mode === "list"
            ? String(total)
            : t("search.match_count", { current: total > 0 ? matchIndex + 1 : 0, total })}
        </span>
      ) : null}
      <IconButton
        aria-label={mode === "list" ? t("search.mode_navigate") : t("search.mode_list")}
        onClick={toggleMode}
        type="button"
      >
        {mode === "list" ? (
          <ArrowUpDown className="h-[var(--icon-size)] w-[var(--icon-size)]" />
        ) : (
          <AlignJustify className="h-[var(--icon-size)] w-[var(--icon-size)]" />
        )}
      </IconButton>
    </div>
  );
}
