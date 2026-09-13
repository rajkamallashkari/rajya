import { useEffect, useState } from "react";
import { useTranslation } from "react-i18next";
import type { components } from "@/shared/lib/api/schema";
import {
  Button,
  Input,
  ResponsiveOverlay,
  ResponsiveOverlayContent,
  ResponsiveOverlayTitle,
  Textarea,
} from "@/shared/ui";

type ScheduledMessage = components["schemas"]["ScheduledMessage"];
export type ScheduledEditorMode = "edit" | "reschedule";

function toLocalInput(iso: string): string {
  const date = new Date(iso);
  const pad = (value: number) => String(value).padStart(2, "0");
  return `${String(date.getFullYear())}-${pad(date.getMonth() + 1)}-${pad(date.getDate())}T${pad(date.getHours())}:${pad(date.getMinutes())}`;
}

export function ScheduledMessageEditor({
  message,
  mode,
  onOpenChange,
  onSave,
}: {
  message: ScheduledMessage | null;
  mode: ScheduledEditorMode;
  onOpenChange: (open: boolean) => void;
  onSave: (id: number, changes: { body?: string; scheduled_at?: string }) => void;
}) {
  const { t } = useTranslation();
  const [value, setValue] = useState("");

  useEffect(() => {
    if (!message) {
      return;
    }
    setValue(mode === "edit" ? message.body : toLocalInput(message.scheduled_at));
  }, [message, mode]);

  const editingText = mode === "edit";
  return (
    <ResponsiveOverlay onOpenChange={onOpenChange} open={message !== null}>
      <ResponsiveOverlayContent>
        <ResponsiveOverlayTitle>
          {t(editingText ? "settings.scheduled_edit" : "settings.scheduled_reschedule")}
        </ResponsiveOverlayTitle>
        <form
          className="flex flex-col gap-[var(--space-3)] py-[var(--space-2)]"
          onSubmit={(event) => {
            event.preventDefault();
            if (!message) {
              return;
            }
            onSave(
              message.id,
              editingText
                ? { body: value.trim() }
                : { scheduled_at: new Date(value).toISOString() },
            );
          }}
        >
          {editingText ? (
            <Textarea
              aria-label={t("settings.scheduled_message_text")}
              onChange={(event) => setValue(event.target.value)}
              required
              value={value}
            />
          ) : (
            <Input
              aria-label={t("settings.scheduled_send_at")}
              min={toLocalInput(new Date().toISOString())}
              onChange={(event) => setValue(event.target.value)}
              required
              type="datetime-local"
              value={value}
            />
          )}
          <div className="flex gap-[var(--control-gap)]">
            <Button className="flex-1" onClick={() => onOpenChange(false)} type="button">
              {t("settings.scheduled_close_editor")}
            </Button>
            <Button className="flex-1" type="submit" variant="primary">
              {t("settings.scheduled_save")}
            </Button>
          </div>
        </form>
      </ResponsiveOverlayContent>
    </ResponsiveOverlay>
  );
}
