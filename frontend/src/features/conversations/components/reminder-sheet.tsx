import { useState } from "react";
import { useTranslation } from "react-i18next";
import { BottomSheet, BottomSheetContent, BottomSheetTitle } from "@/shared/ui/bottom-sheet";
import { Button, Input } from "@/shared/ui";

function toLocalInput(iso: string): string {
  const date = new Date(iso);
  const pad = (value: number) => String(value).padStart(2, "0");
  return `${date.getFullYear()}-${pad(date.getMonth() + 1)}-${pad(date.getDate())}T${pad(date.getHours())}:${pad(date.getMinutes())}`;
}

function defaultRemindAt(): string {
  const date = new Date();
  date.setHours(date.getHours() + 1, 0, 0, 0);
  return date.toISOString();
}

export function ReminderSheet({
  onOpenChange,
  onSubmit,
  open,
}: {
  onOpenChange: (open: boolean) => void;
  onSubmit: (input: { note: string; remindAt: string }) => void;
  open: boolean;
}) {
  const { t } = useTranslation();
  const [remindAt, setRemindAt] = useState(toLocalInput(defaultRemindAt()));
  const [note, setNote] = useState("");

  return (
    <BottomSheet onOpenChange={onOpenChange} open={open}>
      <BottomSheetContent>
        <BottomSheetTitle>{t("reminders.title")}</BottomSheetTitle>
        <form
          className="flex flex-col gap-[var(--space-3)] py-[var(--space-2)]"
          onSubmit={(event) => {
            event.preventDefault();
            onSubmit({ note, remindAt: new Date(remindAt).toISOString() });
            onOpenChange(false);
          }}
        >
          <Input
            aria-label={t("reminders.when")}
            onChange={(event) => setRemindAt(event.target.value)}
            required
            type="datetime-local"
            value={remindAt}
          />
          <Input
            aria-label={t("reminders.note")}
            onChange={(event) => setNote(event.target.value)}
            value={note}
          />
          <Button type="submit">{t("reminders.save")}</Button>
        </form>
      </BottomSheetContent>
    </BottomSheet>
  );
}
