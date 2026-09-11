import { useEffect, useState } from "react";
import { useTranslation } from "react-i18next";
import { BottomSheet, BottomSheetContent, BottomSheetTitle, Button, Input } from "@/shared/ui";
import { MS_PER_SECOND, SECONDS_PER_HOUR } from "@/features/composer/model/constants";

function toLocalInput(iso: string): string {
  const date = new Date(iso);
  const pad = (value: number) => String(value).padStart(2, "0");
  return `${String(date.getFullYear())}-${pad(date.getMonth() + 1)}-${pad(date.getDate())}T${pad(date.getHours())}:${pad(date.getMinutes())}`;
}

function defaultScheduledAt(): string {
  return new Date(Date.now() + SECONDS_PER_HOUR * MS_PER_SECOND).toISOString();
}

export function ScheduleSheet({
  onConfirm,
  onOpenChange,
  open,
}: {
  onConfirm: (scheduledAt: string) => void;
  onOpenChange: (open: boolean) => void;
  open: boolean;
}) {
  const { t } = useTranslation();
  const [value, setValue] = useState(() => toLocalInput(defaultScheduledAt()));

  useEffect(() => {
    if (open) {
      setValue(toLocalInput(defaultScheduledAt()));
    }
  }, [open]);

  return (
    <BottomSheet onOpenChange={onOpenChange} open={open}>
      <BottomSheetContent>
        <BottomSheetTitle>{t("composer.schedule")}</BottomSheetTitle>
        <form
          className="flex flex-col gap-[var(--space-3)] py-[var(--space-2)]"
          onSubmit={(event) => {
            event.preventDefault();
            onConfirm(new Date(value).toISOString());
          }}
        >
          <Input
            aria-label={t("composer.schedule_when")}
            min={toLocalInput(new Date().toISOString())}
            onChange={(event) => setValue(event.target.value)}
            required
            type="datetime-local"
            value={value}
          />
          <div className="flex gap-[var(--control-gap)]">
            <Button className="flex-1" onClick={() => onOpenChange(false)} type="button">
              {t("composer.cancel_schedule")}
            </Button>
            <Button className="flex-1" type="submit" variant="primary">
              {t("composer.confirm_schedule")}
            </Button>
          </div>
        </form>
      </BottomSheetContent>
    </BottomSheet>
  );
}
