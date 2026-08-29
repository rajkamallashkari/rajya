import { useTranslation } from "react-i18next";
import { qrModules } from "@/features/conversations/model/qr";
import { Button } from "@/shared/ui";
import { BottomSheet, BottomSheetContent, BottomSheetTitle } from "@/shared/ui/bottom-sheet";

export function QrSheet({
  onCopy,
  onOpenChange,
  open,
  payload,
}: {
  onCopy?: () => void;
  onOpenChange: (open: boolean) => void;
  open: boolean;
  payload: string;
}) {
  const { t } = useTranslation();
  const modules = qrModules(payload);
  return (
    <BottomSheet onOpenChange={onOpenChange} open={open}>
      <BottomSheetContent>
        <BottomSheetTitle>{t("qr.title")}</BottomSheetTitle>
        <div
          aria-hidden="true"
          className="mx-auto grid w-max gap-[var(--hairline)] bg-[var(--text-inverse)] p-[var(--space-3)]"
          data-qr-grid=""
          style={{ gridTemplateColumns: `repeat(${modules.length}, var(--space-2))` }}
        >
          {modules.flatMap((row, y) =>
            row.map((on, x) => (
              <span
                className={on ? "bg-[var(--text-primary)]" : "bg-[var(--text-inverse)]"}
                data-qr-on={on ? "true" : "false"}
                key={`${y}-${x}`}
              />
            )),
          )}
        </div>
        {onCopy ? (
          <Button className="mt-[var(--space-4)]" onClick={onCopy} type="button">
            {t("qr.copy")}
          </Button>
        ) : null}
      </BottomSheetContent>
    </BottomSheet>
  );
}
