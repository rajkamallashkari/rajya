import { Check, X } from "lucide-react";
import { useMemo, useRef, type ReactNode } from "react";
import { useTranslation } from "react-i18next";
import { useBots } from "@/features/bots/api/queries";
import {
  botMatchesComposeQuery,
  COMPOSE_AT,
  composeSearchNeedle,
} from "@/features/conversations/model/compose";
import { usePeopleSearch } from "@/features/search/api/queries";
import { useDebouncedValue } from "@/features/search/hooks/use-debounced-value";
import { SEARCH_DEBOUNCE_MS, SEARCH_MIN_QUERY_LENGTH } from "@/features/search/model/constants";
import { meetsMinQueryLength } from "@/features/search/model/highlight";
import { cn } from "@/shared/lib/cn";
import type { components } from "@/shared/lib/api/schema";
import { Avatar } from "@/shared/ui/avatar";
import { Button } from "@/shared/ui/button";
import { IconButton } from "@/shared/ui/icon-button";
import { Input } from "@/shared/ui/input";
import { ICON_CLASS } from "@/shared/ui/metrics";
import { Spinner } from "@/shared/ui/spinner";

type Account = components["schemas"]["Account"];

export function ComposeDirectory({
  busyId,
  onSelect,
  query,
  selectedIds,
  selection,
  setQuery,
}: {
  busyId?: number | null;
  onSelect: (account: Account) => void;
  query: string;
  selectedIds?: Set<number>;
  selection: "multi" | "single";
  setQuery: (value: string) => void;
}): ReactNode {
  const { t } = useTranslation();
  const inputRef = useRef<HTMLInputElement>(null);
  const bots = useBots();
  const debounced = useDebouncedValue(query, SEARCH_DEBOUNCE_MS);
  const needle = composeSearchNeedle(debounced);
  const peopleEnabled = meetsMinQueryLength(needle, SEARCH_MIN_QUERY_LENGTH);
  const people = usePeopleSearch(needle);
  const peopleRows = people.data?.accounts ?? [];
  const botRows = useMemo(
    () => (bots.data?.bots ?? []).filter((bot) => botMatchesComposeQuery(bot, query)),
    [bots.data, query],
  );

  return (
    <div className="flex min-h-0 flex-1 flex-col" data-compose-directory={selection}>
      <div className="flex items-center gap-[var(--control-gap)] px-[var(--space-list-x)] pb-[var(--space-list-y)]">
        <Input
          aria-label={t("compose.search")}
          autoComplete="off"
          onChange={(event) => setQuery(event.target.value)}
          placeholder={t("compose.search_placeholder")}
          ref={inputRef}
          value={query}
        />
        {query ? (
          <IconButton
            aria-label={t("compose.clear_search")}
            onClick={() => {
              setQuery("");
              inputRef.current?.focus();
            }}
            type="button"
          >
            <X className={ICON_CLASS} />
          </IconButton>
        ) : null}
      </div>
      <div className="min-h-0 flex-1 overflow-y-auto">
        <p className="px-[var(--space-list-x)] py-[var(--space-2)] text-[length:var(--text-xs)] text-[var(--text-tertiary)]">
          {t("compose.bots")}
        </p>
        {botRows.length === 0 ? (
          <p className="px-[var(--space-list-x)] py-[var(--space-4)] text-[length:var(--text-sm)] text-[var(--text-secondary)]">
            {query.trim() ? t("compose.no_bots", { query }) : t("bots.empty")}
          </p>
        ) : (
          botRows.map((bot) => (
            <DirectoryRow
              account={bot.account}
              busy={busyId === bot.account.id}
              key={`bot:${String(bot.account.id)}`}
              onSelect={onSelect}
              selected={selectedIds?.has(bot.account.id) === true}
              selection={selection}
            />
          ))
        )}
        <p className="px-[var(--space-list-x)] py-[var(--space-2)] text-[length:var(--text-xs)] text-[var(--text-tertiary)]">
          {t("compose.people")}
        </p>
        {!peopleEnabled ? (
          <p className="px-[var(--space-list-x)] py-[var(--space-4)] text-[length:var(--text-sm)] text-[var(--text-secondary)]">
            {t("compose.people_hint", { count: SEARCH_MIN_QUERY_LENGTH })}
          </p>
        ) : null}
        {peopleEnabled && people.isFetching ? (
          <div className="flex justify-center py-[var(--space-6)]">
            <Spinner label={t("compose.searching")} />
          </div>
        ) : null}
        {peopleEnabled && !people.isFetching && peopleRows.length === 0 ? (
          <p className="px-[var(--space-list-x)] py-[var(--space-4)] text-[length:var(--text-sm)] text-[var(--text-secondary)]">
            {t("compose.no_people", { query: debounced })}
          </p>
        ) : null}
        {peopleEnabled && !people.isFetching
          ? peopleRows.map((account) => (
              <DirectoryRow
                account={account}
                busy={busyId === account.id}
                key={`person:${String(account.id)}`}
                onSelect={onSelect}
                selected={selectedIds?.has(account.id) === true}
                selection={selection}
              />
            ))
          : null}
      </div>
    </div>
  );
}

function DirectoryRow({
  account,
  busy,
  onSelect,
  selected,
  selection,
}: {
  account: Account;
  busy: boolean;
  onSelect: (account: Account) => void;
  selected: boolean;
  selection: "multi" | "single";
}): ReactNode {
  return (
    <Button
      className="h-auto w-full justify-start gap-[var(--control-gap)] px-[var(--space-list-x)] py-[var(--space-3)]"
      disabled={busy}
      onClick={() => onSelect(account)}
      type="button"
      variant="ghost"
    >
      {selection === "multi" ? (
        <span
          className={cn(
            "flex h-[var(--control-height)] w-[var(--control-height)] items-center justify-center rounded-[var(--radius-sm)] border",
            selected
              ? "border-[var(--accent)] bg-[var(--accent)] text-[var(--accent-contrast)]"
              : "border-[var(--border-default)]",
          )}
        >
          {selected ? <Check className={ICON_CLASS} /> : null}
        </span>
      ) : null}
      <Avatar name={account.display_name} />
      <span className="min-w-0 flex-1 text-left">
        <span className="block truncate">{account.display_name}</span>
        {account.username ? (
          <span className="block truncate text-[length:var(--text-sm)] text-[var(--text-secondary)]">
            {`${COMPOSE_AT}${account.username}`}
          </span>
        ) : null}
      </span>
    </Button>
  );
}
