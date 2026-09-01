import { useTranslation } from "react-i18next";
import { Spinner } from "@/shared/ui/spinner";

export function ChunkFallback() {
  const { t } = useTranslation();
  return (
    <div className="flex justify-center p-[var(--space-4)]" data-chunk-fallback="">
      <Spinner label={t("app.loading")} />
    </div>
  );
}
