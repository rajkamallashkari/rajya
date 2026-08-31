import { type ReactNode } from "react";
import { useTranslation } from "react-i18next";
import { useGlobalSearch } from "@/features/search/api/queries";
import { useDebouncedValue } from "@/features/search/hooks/use-debounced-value";
import { SEARCH_DEBOUNCE_MS, SEARCH_MIN_QUERY_LENGTH } from "@/features/search/model/constants";
import { meetsMinQueryLength } from "@/features/search/model/highlight";
import { Button } from "@/shared/ui/button";

export function GlobalSearchHits({
  query,
  onAccount,
  onConversation,
  onMessage,
}: {
  onAccount: (id: number, name: string) => void;
  onConversation: (id: number, title: string) => void;
  onMessage: (conversationId: number, messageId: number, title: string) => void;
  query: string;
}): ReactNode {
  const { t } = useTranslation();
  const debounced = useDebouncedValue(query, SEARCH_DEBOUNCE_MS);
  const search = useGlobalSearch(debounced);
  if (!meetsMinQueryLength(debounced, SEARCH_MIN_QUERY_LENGTH)) {
    return null;
  }
  const accounts = search.data?.accounts ?? [];
  const conversations = search.data?.conversations ?? [];
  const messages = search.data?.messages ?? [];
  if (accounts.length === 0 && conversations.length === 0 && messages.length === 0) {
    return null;
  }
  return (
    <div className="border-t border-[var(--border-subtle)] px-[var(--space-list-x)] py-[var(--space-list-y)]">
      {accounts.length > 0 ? (
        <section>
          <p className="text-[length:var(--text-xs)] text-[var(--text-secondary)]">{t("search.people")}</p>
          {accounts.map((account) => (
            <Button
              className="w-full justify-start"
              key={account.id}
              onClick={() => onAccount(account.id, account.display_name)}
              type="button"
              variant="ghost"
            >
              {account.display_name}
            </Button>
          ))}
        </section>
      ) : null}
      {conversations.length > 0 ? (
        <section>
          <p className="text-[length:var(--text-xs)] text-[var(--text-secondary)]">{t("search.conversations")}</p>
          {conversations.map((hit) => (
            <Button
              className="w-full justify-start"
              key={hit.id}
              onClick={() => onConversation(hit.id, hit.title)}
              type="button"
              variant="ghost"
            >
              {hit.title}
            </Button>
          ))}
        </section>
      ) : null}
      {messages.length > 0 ? (
        <section>
          <p className="text-[length:var(--text-xs)] text-[var(--text-secondary)]">{t("search.messages")}</p>
          {messages.map((hit) => (
            <Button
              className="w-full justify-start"
              key={hit.message_id}
              onClick={() => onMessage(hit.conversation_id, hit.message_id, hit.snippet)}
              type="button"
              variant="ghost"
            >
              {hit.snippet}
            </Button>
          ))}
        </section>
      ) : null}
    </div>
  );
}
