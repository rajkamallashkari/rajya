import { type ReactNode } from "react";
import { useTranslation } from "react-i18next";
import {
  BottomSheet,
  BottomSheetContent,
  BottomSheetDescription,
  BottomSheetTitle,
} from "@/shared/ui/bottom-sheet";
import { Button } from "@/shared/ui/button";
import { Input } from "@/shared/ui/input";
import { jumpDateIso, startOfDayIso } from "@/features/search/model/jump-dates";
import { useSearchStore } from "@/features/search/store/search-store";

export function JumpDateSheet({ onJump }: { onJump: (iso: string) => void }): ReactNode {
  const { t } = useTranslation();
  const open = useSearchStore((state) => state.dateOpen);
  const setDateOpen = useSearchStore((state) => state.setDateOpen);
  return (
    <BottomSheet onOpenChange={setDateOpen} open={open}>
      <BottomSheetContent>
        <BottomSheetTitle>{t("search.jump_date")}</BottomSheetTitle>
        <BottomSheetDescription className="sr-only">{t("search.pick_date")}</BottomSheetDescription>
        <div className="flex flex-col gap-[var(--space-2)]">
          <Button
            onClick={() => onJump(jumpDateIso("today", Date.now()))}
            type="button"
            variant="secondary"
          >
            {t("search.jump_today")}
          </Button>
          <Button
            onClick={() => onJump(jumpDateIso("yesterday", Date.now()))}
            type="button"
            variant="secondary"
          >
            {t("search.jump_yesterday")}
          </Button>
          <Button
            onClick={() => onJump(jumpDateIso("week", Date.now()))}
            type="button"
            variant="secondary"
          >
            {t("search.jump_week")}
          </Button>
          <Input
            aria-label={t("search.pick_date")}
            onChange={(event) => {
              const iso = startOfDayIso(event.target.value);
              if (iso) {
                onJump(iso);
              }
            }}
            type="date"
          />
        </div>
      </BottomSheetContent>
    </BottomSheet>
  );
}
