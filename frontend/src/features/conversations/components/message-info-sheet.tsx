import { useTranslation } from "react-i18next";
import type { MessageInfo } from "@/features/conversations/api/http";
import { formatMessageTime } from "@/features/messages";
import { Avatar } from "@/shared/ui";
import { BottomSheet, BottomSheetContent, BottomSheetTitle } from "@/shared/ui/bottom-sheet";
import { EmptyState } from "@/shared/ui/empty-state";

export function MessageInfoSheet({
  info,
  onOpenChange,
  open,
}: {
  info: MessageInfo | undefined;
  onOpenChange: (open: boolean) => void;
  open: boolean;
}) {
  const { t, i18n } = useTranslation();
  const delivered = info?.delivered ?? [];
  const read = info?.read ?? [];
  const empty = delivered.length === 0 && read.length === 0;

  return (
    <BottomSheet onOpenChange={onOpenChange} open={open}>
      <BottomSheetContent>
        <BottomSheetTitle>{t("messages.info.title")}</BottomSheetTitle>
        {empty ? <EmptyState title={t("messages.info.empty")} /> : null}
        {delivered.length > 0 ? (
          <ReceiptList
            locale={i18n.language}
            receipts={delivered}
            title={t("messages.info.delivered")}
          />
        ) : null}
        {read.length > 0 ? (
          <ReceiptList locale={i18n.language} receipts={read} title={t("messages.info.read")} />
        ) : null}
      </BottomSheetContent>
    </BottomSheet>
  );
}

function ReceiptList({
  locale,
  receipts,
  title,
}: {
  locale: string;
  receipts: NonNullable<MessageInfo["delivered"]>;
  title: string;
}) {
  return (
    <section className="py-[var(--space-2)]">
      <p className="text-[length:var(--text-sm)] text-[var(--text-secondary)]">{title}</p>
      <ul className="flex flex-col">
        {receipts.map((receipt) => (
          <li
            className="flex min-h-[var(--control-height)] items-center justify-between gap-[var(--control-gap-tight)]"
            key={receipt.account.id}
          >
            <span className="flex items-center gap-[var(--control-gap-tight)]">
              <Avatar name={receipt.account.display_name} />
              <span>{receipt.account.display_name}</span>
            </span>
            {receipt.at ? (
              <time dateTime={receipt.at}>{formatMessageTime(receipt.at, locale)}</time>
            ) : null}
          </li>
        ))}
      </ul>
    </section>
  );
}
