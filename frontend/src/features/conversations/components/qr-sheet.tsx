import { useEffect, useState } from "react";
import { useTranslation } from "react-i18next";
import { qrImageDataUrl } from "@/features/conversations/model/qr";
import { Button, Spinner } from "@/shared/ui";
import {
  ResponsiveOverlay,
  ResponsiveOverlayContent,
  ResponsiveOverlayTitle,
} from "@/shared/ui/responsive-overlay";

type QrState = { status: "error" } | { status: "loading" } | { status: "ready"; url: string };

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
  const [qr, setQr] = useState<QrState>({ status: "loading" });

  useEffect(() => {
    if (!open || !payload) {
      return undefined;
    }
    let cancelled = false;
    setQr({ status: "loading" });
    void qrImageDataUrl(payload).then((url) => {
      if (!cancelled) {
        setQr(url == null ? { status: "error" } : { status: "ready", url });
      }
    });
    return () => {
      cancelled = true;
    };
  }, [open, payload]);

  return (
    <ResponsiveOverlay onOpenChange={onOpenChange} open={open}>
      <ResponsiveOverlayContent>
        <ResponsiveOverlayTitle>{t("qr.title")}</ResponsiveOverlayTitle>
        <div
          className="mx-auto mt-[var(--space-4)] flex aspect-square w-full max-w-[16rem] items-center justify-center rounded-[var(--radius-md)] bg-white p-[var(--space-3)]"
          data-qr-code=""
        >
          {qr.status === "ready" ? (
            <img alt={t("qr.image")} className="block h-auto w-full" src={qr.url} />
          ) : qr.status === "error" ? (
            <p className="text-center text-[var(--danger)]">{t("qr.error")}</p>
          ) : (
            <Spinner label={t("qr.loading")} />
          )}
        </div>
        {onCopy ? (
          <Button className="mt-[var(--space-4)]" onClick={onCopy} type="button">
            {t("qr.copy")}
          </Button>
        ) : null}
      </ResponsiveOverlayContent>
    </ResponsiveOverlay>
  );
}
