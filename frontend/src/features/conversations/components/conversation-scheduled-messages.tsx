import { useMemo, useState } from "react";
import { Clock } from "lucide-react";
import { useTranslation } from "react-i18next";
import { useScheduledMessages } from "@/features/settings/api/queries";
import { BottomSheet, BottomSheetContent, BottomSheetTitle, Button, ListView } from "@/shared/ui";
import { ICON_CLASS, WEIGHT_EMPHASIS } from "@/shared/ui/metrics";

export function ConversationScheduledMessages({
  conversationId,
  locale,
}: {
  conversationId: number;
  locale: string;
}) {
  const { t } = useTranslation();
  const [open, setOpen] = useState(false);
  const query = useScheduledMessages();
  const rows = useMemo(
    () =>
      (query.data?.scheduled_messages ?? []).filter(
        (row) => row.conversation_id === conversationId,
      ),
    [conversationId, query.data?.scheduled_messages],
  );

  if (rows.length === 0) {
    return null;
  }

  return (
    <>
      <Button
        className="w-full justify-start gap-[var(--space-2)] rounded-none border-t border-[var(--border-subtle)] px-[var(--space-4)]"
        data-conversation-scheduled-count=""
        onClick={() => setOpen(true)}
        type="button"
        variant="ghost"
      >
        <Clock className={ICON_CLASS} />
        {t("composer.scheduled_count", { count: rows.length })}
      </Button>
      <BottomSheet onOpenChange={setOpen} open={open}>
        <BottomSheetContent>
          <BottomSheetTitle>{t("composer.scheduled_messages")}</BottomSheetTitle>
          <ListView status="ready">
            <ul className="flex flex-col gap-[var(--space-3)]">
              {rows.map((row) => (
                <li
                  className="flex flex-col gap-[var(--space-2)] rounded-[var(--radius-md)] bg-[var(--surface-hover)] p-[var(--space-3)]"
                  key={row.id}
                >
                  <p className={WEIGHT_EMPHASIS}>{row.body}</p>
                  <p className="text-[length:var(--text-sm)] text-[var(--text-secondary)]">
                    {new Intl.DateTimeFormat(locale, {
                      dateStyle: "medium",
                      timeStyle: "short",
                    }).format(new Date(row.scheduled_at))}
                  </p>
                </li>
              ))}
            </ul>
          </ListView>
        </BottomSheetContent>
      </BottomSheet>
    </>
  );
}
