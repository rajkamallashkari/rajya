import { type ReactNode } from "react";
import { useTranslation } from "react-i18next";
import type { SearchMessageHit } from "@/features/search/api/http";
import { useConversationSearch } from "@/features/search/api/queries";
import { useDebouncedValue } from "@/features/search/hooks/use-debounced-value";
import { SEARCH_DEBOUNCE_MS, SEARCH_MIN_QUERY_LENGTH } from "@/features/search/model/constants";
import { filtersActive } from "@/features/search/model/filters";
import { splitHighlight, meetsMinQueryLength } from "@/features/search/model/highlight";
import { useSearchStore } from "@/features/search/store/search-store";
import { Button } from "@/shared/ui/button";

export function SearchResultsPanel({
  conversationId,
  onJump,
}: {
  conversationId: number;
  onJump: (hit: SearchMessageHit, index: number) => void;
}): ReactNode {
  const { t } = useTranslation();
  const query = useSearchStore((state) => state.query);
  const mode = useSearchStore((state) => state.mode);
  const filters = useSearchStore((state) => state.filters);
  const debounced = useDebouncedValue(query, SEARCH_DEBOUNCE_MS);
  const search = useConversationSearch(conversationId, debounced, filters);
  if (mode !== "list") {
    return null;
  }
  if (
    !meetsMinQueryLength(debounced, SEARCH_MIN_QUERY_LENGTH) &&
    !filtersActive(filters)
  ) {
    return (
      <p className="px-[var(--space-list-x)] py-[var(--space-list-y)] text-[length:var(--text-sm)] text-[var(--text-secondary)]">
        {t("search.type_to_search")}
      </p>
    );
  }
  const messages = search.data?.messages ?? [];
  if (messages.length === 0) {
    return (
      <p className="px-[var(--space-list-x)] py-[var(--space-list-y)] text-[length:var(--text-sm)] text-[var(--text-secondary)]">
        {t("search.no_results")}
      </p>
    );
  }
  return (
    <div className="max-h-[var(--sheet-min-height)] overflow-y-auto border-b border-[var(--border-subtle)]">
      {messages.map((hit, index) => (
        <Button
          className="flex h-auto w-full flex-col items-start gap-[var(--space-1)] px-[var(--space-list-x)] py-[var(--space-3)] text-left"
          key={hit.message_id}
          onClick={() => onJump(hit, index)}
          type="button"
          variant="ghost"
        >
          <span className="text-[length:var(--text-xs)] text-[var(--accent)]">
            {hit.sender_name ?? t("conversations.untitled")}
          </span>
          <span className="line-clamp-1 text-[length:var(--text-sm)] text-[var(--text-primary)]">
            {splitHighlight(hit.snippet, debounced).map((part, partIndex) =>
              part.highlight ? (
                <mark className="rounded-[var(--radius-sm)] bg-[var(--accent-subtle)]" key={`${String(hit.message_id)}-${String(partIndex)}`}>
                  {part.text}
                </mark>
              ) : (
                <span key={`${hit.message_id}-${partIndex}`}>{part.text}</span>
              ),
            )}
          </span>
        </Button>
      ))}
    </div>
  );
}
