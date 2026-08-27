import { Check, Copy } from "lucide-react";
import { useEffect, useState } from "react";
import { useTranslation } from "react-i18next";
import { copyText } from "@/features/messages/model/copy-text";
import { COPY_FEEDBACK_MS } from "@/features/messages/model/constants";
import { highlightCode } from "@/features/messages/model/highlight";
import { IconButton } from "@/shared/ui";
import { ICON_CLASS } from "@/shared/ui/metrics";

export function CodeBlock({ code, lang }: { code: string; lang: string }) {
  const { t } = useTranslation();
  const [html, setHtml] = useState<string | null>(null);
  const [copied, setCopied] = useState(false);

  useEffect(() => {
    let cancelled = false;
    setHtml(null);
    setCopied(false);
    void highlightCode(code, lang).then((result) => {
      if (!cancelled && result) {
        setHtml(result);
      }
    });
    return () => {
      cancelled = true;
    };
  }, [code, lang]);

  useEffect(() => {
    if (!copied) {
      return undefined;
    }
    const timer = window.setTimeout(() => setCopied(false), COPY_FEEDBACK_MS);
    return () => window.clearTimeout(timer);
  }, [copied]);

  return (
    <div className="message-code relative overflow-hidden rounded-[var(--radius-md)]">
      <IconButton
        aria-label={copied ? t("messages.code.copied") : t("messages.code.copy")}
        className="absolute top-[var(--space-1)] right-[var(--space-1)] z-[var(--z-base)]"
        onClick={() => {
          void copyText(code).then((ok) => {
            if (ok) {
              setCopied(true);
            }
          });
        }}
        variant="ghost"
      >
        {copied ? <Check className={ICON_CLASS} /> : <Copy className={ICON_CLASS} />}
      </IconButton>
      {html ? (
        <div dangerouslySetInnerHTML={{ __html: html }} />
      ) : (
        <pre>
          <code>{code}</code>
        </pre>
      )}
    </div>
  );
}
