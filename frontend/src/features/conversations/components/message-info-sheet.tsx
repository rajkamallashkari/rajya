import { useTranslation } from "react-i18next";
import type { Conversation, MessageInfo } from "@/features/conversations/api/http";
import { TickIndicator } from "@/features/messages";
import { useDateTimeFormatter } from "@/shared/hooks/use-date-time-formatter";
import { AccountIdentityRow } from "@/shared/ui/account-identity-row";
import {
  ResponsiveOverlay as BottomSheet,
  ResponsiveOverlayContent as BottomSheetContent,
  ResponsiveOverlayTitle as BottomSheetTitle,
} from "@/shared/ui/responsive-overlay";
import { EmptyState } from "@/shared/ui/empty-state";

export function MessageInfoSheet({
  conversationKind,
  info,
  onOpenChange,
  open,
}: {
  conversationKind: Conversation["kind"];
  info: MessageInfo | undefined;
  onOpenChange: (open: boolean) => void;
  open: boolean;
}) {
  const { t } = useTranslation();
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
            direct={conversationKind === "direct"}
            receipts={delivered}
            status="delivered"
            title={t("messages.info.delivered")}
          />
        ) : null}
        {read.length > 0 ? (
          <ReceiptList
            direct={conversationKind === "direct"}
            receipts={read}
            status="read"
            title={t("messages.info.read")}
          />
        ) : null}
      </BottomSheetContent>
    </BottomSheet>
  );
}

function ReceiptList({
  direct,
  receipts,
  status,
  title,
}: {
  direct: boolean;
  receipts: NonNullable<MessageInfo["delivered"]>;
  status: "delivered" | "read";
  title: string;
}) {
  const formatDateTime = useDateTimeFormatter();
  if (direct) {
    return (
      <section className="py-[var(--space-2)]">
        <ul className="flex flex-col">
          {receipts.map((receipt) => (
            <li
              className="flex min-h-[var(--control-height)] min-w-0 items-center justify-between gap-[var(--control-gap)]"
              key={receipt.account.id}
            >
              <span className="inline-flex items-center gap-[var(--control-gap-tight)] [font-weight:var(--font-weight-emphasis)]">
                <span aria-hidden>
                  <TickIndicator status={status} />
                </span>
                {title}
              </span>
              {receipt.at ? (
                <time
                  className="shrink-0 text-[length:var(--text-sm)] text-[var(--text-secondary)]"
                  dateTime={receipt.at}
                >
                  {formatDateTime.dateTime(receipt.at)}
                </time>
              ) : null}
            </li>
          ))}
        </ul>
      </section>
    );
  }

  return (
    <section className="py-[var(--space-2)]">
      <p className="text-[length:var(--text-sm)] text-[var(--text-secondary)]">{title}</p>
      <ul className="flex flex-col">
        {receipts.map((receipt) => (
          <li key={receipt.account.id}>
            <AccountIdentityRow
              account={receipt.account}
              openProfile
              trailing={
                receipt.at ? (
                  <time
                    className="shrink-0 text-[length:var(--text-sm)] text-[var(--text-secondary)]"
                    dateTime={receipt.at}
                  >
                    {formatDateTime.dateTime(receipt.at)}
                  </time>
                ) : null
              }
            />
          </li>
        ))}
      </ul>
    </section>
  );
}
