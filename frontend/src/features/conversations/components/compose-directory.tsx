import { Check, ChevronDown, ChevronUp, X } from "lucide-react";
import { useMemo, useRef, useState, type ReactNode } from "react";
import { useTranslation } from "react-i18next";
import { useBots } from "@/features/bots/api/queries";
import {
  botMatchesComposeQuery,
  composeSearchNeedle,
} from "@/features/conversations/model/compose";
import { usePeopleSearch } from "@/features/search/api/queries";
import { useDebouncedValue } from "@/features/search/hooks/use-debounced-value";
import { SEARCH_DEBOUNCE_MS, SEARCH_MIN_QUERY_LENGTH } from "@/features/search/model/constants";
import { meetsMinQueryLength } from "@/features/search/model/highlight";
import { cn } from "@/shared/lib/cn";
import type { components } from "@/shared/lib/api/schema";
import { AccountIdentityRow } from "@/shared/ui/account-identity-row";
import { Button } from "@/shared/ui/button";
import { IconButton } from "@/shared/ui/icon-button";
import { Input } from "@/shared/ui/input";
import { ICON_CLASS } from "@/shared/ui/metrics";
import { Spinner } from "@/shared/ui/spinner";

type Account = components["schemas"]["Account"];

export function ComposeDirectory({
  busyId,
  collapsible = false,
  onSelect,
  query,
  selectedIds,
  selection,
  setQuery,
}: {
  busyId?: number | null;
  collapsible?: boolean;
  onSelect: (account: Account) => void;
  query: string;
  selectedIds?: Set<number>;
  selection: "multi" | "single";
  setQuery: (value: string) => void;
}): ReactNode {
  const { t } = useTranslation();
  const inputRef = useRef<HTMLInputElement>(null);
  const [botsOpen, setBotsOpen] = useState(true);
  const [peopleOpen, setPeopleOpen] = useState(true);
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
        <DirectorySection
          collapsible={collapsible}
          label={t("compose.bots")}
          onToggle={() => setBotsOpen((open) => !open)}
          open={botsOpen}
        >
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
        </DirectorySection>
        <DirectorySection
          collapsible={collapsible}
          label={t("compose.people")}
          onToggle={() => setPeopleOpen((open) => !open)}
          open={peopleOpen}
        >
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
        </DirectorySection>
      </div>
    </div>
  );
}

function DirectorySection({
  children,
  collapsible,
  label,
  onToggle,
  open,
}: {
  children: ReactNode;
  collapsible: boolean;
  label: string;
  onToggle: () => void;
  open: boolean;
}): ReactNode {
  return (
    <section>
      {collapsible ? (
        <Button
          aria-expanded={open}
          className="h-auto w-full justify-between rounded-none px-[var(--space-list-x)] py-[var(--space-2)] text-[length:var(--text-xs)] text-[var(--text-tertiary)]"
          onClick={onToggle}
          type="button"
          variant="ghost"
        >
          {label}
          {open ? <ChevronUp className={ICON_CLASS} /> : <ChevronDown className={ICON_CLASS} />}
        </Button>
      ) : (
        <p className="px-[var(--space-list-x)] py-[var(--space-2)] text-[length:var(--text-xs)] text-[var(--text-tertiary)]">
          {label}
        </p>
      )}
      {open ? children : null}
    </section>
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
  const selectionControl =
    selection === "multi" ? (
      <span
        aria-hidden
        className={cn(
          "flex h-[var(--control-height)] w-[var(--control-height)] shrink-0 items-center justify-center rounded-[var(--radius-sm)] border",
          selected
            ? "border-[var(--accent)] bg-[var(--accent)] text-[var(--accent-contrast)]"
            : "border-[var(--border-default)]",
        )}
      >
        {selected ? <Check className={ICON_CLASS} /> : null}
      </span>
    ) : null;

  return (
    <AccountIdentityRow
      account={account}
      className="w-full px-[var(--space-list-x)] py-[var(--space-1)]"
      disabled={busy}
      onSelect={onSelect}
      trailing={selectionControl}
    />
  );
}
