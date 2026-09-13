import { CalendarDays, ChevronRight, ChevronsUp } from "lucide-react";
import { useEffect, useState, type FormEvent, type ReactNode } from "react";
import { useTranslation } from "react-i18next";
import {
  ResponsiveOverlay as BottomSheet,
  ResponsiveOverlayContent as BottomSheetContent,
  ResponsiveOverlayDescription as BottomSheetDescription,
  ResponsiveOverlayTitle as BottomSheetTitle,
} from "@/shared/ui/responsive-overlay";
import { Button } from "@/shared/ui/button";
import { Input } from "@/shared/ui/input";
import {
  localDateInputValue,
  localDateOffset,
  startOfDayIso,
} from "@/features/search/model/jump-dates";
import { useSearchStore } from "@/features/search/store/search-store";
import { useDateTimeFormatter } from "@/shared/hooks/use-date-time-formatter";
import { ICON_CLASS } from "@/shared/ui/metrics";

export function JumpDateSheet({ onJump }: { onJump: (iso: string) => void }): ReactNode {
  const { t } = useTranslation();
  const formatDateTime = useDateTimeFormatter();
  const open = useSearchStore((state) => state.dateOpen);
  const setDateOpen = useSearchStore((state) => state.setDateOpen);
  const today = localDateInputValue();
  const [value, setValue] = useState(today);

  useEffect(() => {
    if (open) {
      setValue(today);
    }
  }, [open, today]);

  const submit = (event: FormEvent) => {
    event.preventDefault();
    const iso = startOfDayIso(value);
    if (iso) {
      onJump(iso);
    }
  };

  const selectedDate = startOfDayIso(value);
  const shortcuts = [
    { label: t("search.jump_today"), value: localDateOffset(0) },
    { label: t("search.jump_yesterday"), value: localDateOffset(-1) },
    { label: t("search.jump_week"), value: localDateOffset(-7) },
    { label: t("search.jump_month"), value: localDateOffset(-30) },
  ];

  return (
    <BottomSheet onOpenChange={setDateOpen} open={open}>
      <BottomSheetContent>
        <div className="flex items-center gap-[var(--space-3)]">
          <CalendarDays aria-hidden="true" className={ICON_CLASS} />
          <div>
            <BottomSheetTitle>{t("search.jump_date")}</BottomSheetTitle>
            <BottomSheetDescription>
              {selectedDate ? formatDateTime.date(selectedDate) : t("search.pick_date")}
            </BottomSheetDescription>
          </div>
        </div>
        <form className="mt-[var(--space-4)] flex flex-col gap-[var(--space-4)]" onSubmit={submit}>
          <Input
            aria-label={t("search.pick_date")}
            autoFocus
            max={today}
            onChange={(event) => setValue(event.target.value)}
            type="date"
            value={value}
          />
          <div>
            <p className="mb-[var(--space-2)] text-[length:var(--text-sm)] text-[var(--text-secondary)]">
              {t("search.quick_jump")}
            </p>
            <div className="grid grid-cols-2 gap-[var(--space-2)]">
              {shortcuts.map((shortcut) => (
                <Button
                  aria-pressed={value === shortcut.value}
                  className="justify-between"
                  key={shortcut.label}
                  onClick={() => setValue(shortcut.value)}
                  type="button"
                  variant={value === shortcut.value ? "primary" : "secondary"}
                >
                  {shortcut.label}
                  <ChevronRight aria-hidden="true" className={ICON_CLASS} />
                </Button>
              ))}
            </div>
          </div>
          <div className="flex flex-col gap-[var(--space-2)]">
            <Button
              onClick={() => onJump("1970-01-01T00:00:00.000Z")}
              type="button"
              variant="secondary"
            >
              <ChevronsUp aria-hidden="true" className={ICON_CLASS} />
              {t("search.jump_beginning")}
            </Button>
            <Button disabled={!selectedDate || value > today} type="submit">
              {t("search.jump")}
            </Button>
          </div>
        </form>
      </BottomSheetContent>
    </BottomSheet>
  );
}
