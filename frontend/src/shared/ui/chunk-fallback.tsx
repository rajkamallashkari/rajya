import { useTranslation } from "react-i18next";
import { Spinner } from "@/shared/ui/spinner";

export function ChunkFallback({ asPage = false }: { asPage?: boolean }) {
  const { t } = useTranslation();
  const body = (
    <div className="flex justify-center p-[var(--space-4)]" data-chunk-fallback="">
      <Spinner label={t("app.loading")} />
    </div>
  );
  if (!asPage) {
    return body;
  }
  return (
    <main>
      <h1 className="sr-only">{t("app.loading")}</h1>
      {body}
    </main>
  );
}
