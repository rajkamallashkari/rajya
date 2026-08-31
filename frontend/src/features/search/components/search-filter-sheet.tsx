import { type ReactNode } from "react";
import { useTranslation } from "react-i18next";
import {
  dateInputValue,
  SEARCH_MESSAGE_KINDS,
  type SearchMessageKind,
} from "@/features/search/model/filters";
import { endOfDayIso, startOfDayIso } from "@/features/search/model/jump-dates";
import { useSearchStore } from "@/features/search/store/search-store";
import {
  BottomSheet,
  BottomSheetContent,
  BottomSheetDescription,
  BottomSheetTitle,
} from "@/shared/ui/bottom-sheet";
import { Button } from "@/shared/ui/button";
import { Checkbox } from "@/shared/ui/checkbox";
import { Input } from "@/shared/ui/input";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/shared/ui/select";

const KIND_ALL = "all";
const SENDER_ALL = "all";

export function SearchFilterSheet(): ReactNode {
  const { t } = useTranslation();
  const open = useSearchStore((state) => state.filtersOpen);
  const setFiltersOpen = useSearchStore((state) => state.setFiltersOpen);
  const filters = useSearchStore((state) => state.filters);
  const members = useSearchStore((state) => state.members);
  const patchFilters = useSearchStore((state) => state.patchFilters);
  const resetFilters = useSearchStore((state) => state.resetFilters);
  return (
    <BottomSheet onOpenChange={setFiltersOpen} open={open}>
      <BottomSheetContent>
        <BottomSheetTitle>{t("search.filters")}</BottomSheetTitle>
        <BottomSheetDescription className="sr-only">{t("search.filters")}</BottomSheetDescription>
        <div className="flex flex-col gap-[var(--space-3)]">
          {members.length > 0 ? (
            <Select
              onValueChange={(value) =>
                patchFilters({
                  senderAccountId: value === SENDER_ALL ? undefined : Number(value),
                })
              }
              value={filters.senderAccountId != null ? String(filters.senderAccountId) : SENDER_ALL}
            >
              <SelectTrigger aria-label={t("search.filters_sender")}>
                <SelectValue placeholder={t("search.filters_sender_any")} />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value={SENDER_ALL}>{t("search.filters_sender_any")}</SelectItem>
                {members.map((member) => (
                  <SelectItem key={member.account.id} value={String(member.account.id)}>
                    {member.account.display_name}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
          ) : null}
          <Select
            onValueChange={(value) =>
              patchFilters({ kind: value === KIND_ALL ? undefined : (value as SearchMessageKind) })
            }
            value={filters.kind ?? KIND_ALL}
          >
            <SelectTrigger aria-label={t("search.filters_kind")}>
              <SelectValue placeholder={t("search.filters_kind_any")} />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value={KIND_ALL}>{t("search.filters_kind_any")}</SelectItem>
              {SEARCH_MESSAGE_KINDS.map((kind) => (
                <SelectItem key={kind} value={kind}>
                  {t(`search.kind.${kind}`)}
                </SelectItem>
              ))}
            </SelectContent>
          </Select>
          <Input
            aria-label={t("search.filters_from")}
            onChange={(event) => {
              const iso = startOfDayIso(event.target.value);
              patchFilters({ createdAfter: iso ?? undefined });
            }}
            type="date"
            value={dateInputValue(filters.createdAfter)}
          />
          <Input
            aria-label={t("search.filters_to")}
            onChange={(event) => {
              const iso = endOfDayIso(event.target.value);
              patchFilters({ createdBefore: iso ?? undefined });
            }}
            type="date"
            value={dateInputValue(filters.createdBefore)}
          />
          <label className="flex items-center gap-[var(--space-2)] text-[length:var(--text-sm)] text-[var(--text-primary)]">
            <Checkbox
              aria-label={t("search.filters_attachment")}
              checked={filters.hasAttachment === true}
              onCheckedChange={(checked) =>
                patchFilters({ hasAttachment: checked === true ? true : undefined })
              }
            />
            {t("search.filters_attachment")}
          </label>
          <label className="flex items-center gap-[var(--space-2)] text-[length:var(--text-sm)] text-[var(--text-primary)]">
            <Checkbox
              aria-label={t("search.filters_link")}
              checked={filters.hasLink === true}
              onCheckedChange={(checked) =>
                patchFilters({ hasLink: checked === true ? true : undefined })
              }
            />
            {t("search.filters_link")}
          </label>
          <Button onClick={resetFilters} type="button" variant="secondary">
            {t("search.filters_clear")}
          </Button>
        </div>
      </BottomSheetContent>
    </BottomSheet>
  );
}
