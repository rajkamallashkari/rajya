import { useState, type ReactNode } from "react";
import Markdown from "react-markdown";
import remarkBreaks from "remark-breaks";
import rehypeSanitize from "rehype-sanitize";
import { useTranslation } from "react-i18next";
import { CodeBlock } from "@/features/messages/components/code-block";
import { getJumboInfo, jumboSizeToken } from "@/features/messages/model/jumbo-emoji";
import {
  messageRehypeHandlers,
  remarkMessageMarkdown,
} from "@/features/messages/model/remark-message";
import { messageSanitizeSchema } from "@/features/messages/model/sanitize-schema";
import { cn } from "@/shared/lib/cn";
import { Button } from "@/shared/ui";
import { FOCUS_RING, WEIGHT_EMPHASIS } from "@/shared/ui/metrics";

const INLINE_CODE_CLASS =
  "rounded-[var(--radius-sm)] bg-[var(--surface-input)] px-[var(--space-1)] py-[var(--space-0_5)] font-mono text-[length:var(--text-sm)]";

function Spoiler({ children }: { children: ReactNode }) {
  const { t } = useTranslation();
  const [revealed, setRevealed] = useState(false);
  return (
    <Button
      aria-expanded={revealed}
      aria-label={revealed ? t("messages.spoiler.revealed") : t("messages.spoiler.hidden")}
      className={cn(
        "inline h-auto min-h-0 min-w-0 rounded-[var(--radius-sm)] px-[var(--space-1)] py-0 align-baseline text-[length:var(--text-md)]",
        FOCUS_RING,
        revealed
          ? "bg-[var(--surface-hover)]"
          : "select-none bg-[var(--text-tertiary)] text-transparent blur-[length:var(--spoiler-blur)]",
      )}
      data-spoiler={revealed ? "revealed" : "hidden"}
      onClick={() => setRevealed((value) => !value)}
      type="button"
      variant="ghost"
    >
      {children}
    </Button>
  );
}

function MentionChip({
  handle,
  onMentionClick,
}: {
  handle: string;
  onMentionClick?: (handle: string) => void;
}) {
  const { t } = useTranslation();
  const label = t("messages.mention", { handle });
  if (!onMentionClick) {
    return <span className={cn("text-[var(--accent)]", WEIGHT_EMPHASIS)}>{label}</span>;
  }
  return (
    <Button
      className={cn(
        "inline h-auto min-h-0 min-w-0 px-[var(--space-0_5)] py-0 text-[var(--accent)]",
        WEIGHT_EMPHASIS,
      )}
      onClick={() => onMentionClick(handle)}
      type="button"
      variant="ghost"
    >
      {label}
    </Button>
  );
}

function spoilerFlag(props: Record<string, unknown>): boolean {
  return props.dataSpoiler !== undefined || props["data-spoiler"] !== undefined;
}

function mentionHandle(props: Record<string, unknown>): string | null {
  const value = props.dataMention ?? props["data-mention"];
  return typeof value === "string" && value.length > 0 ? value : null;
}

export function MessageSpan({
  children,
  onMentionClick,
  ...props
}: {
  children?: ReactNode;
  onMentionClick?: (handle: string) => void;
  [key: string]: unknown;
}) {
  const record = props as Record<string, unknown>;
  if (spoilerFlag(record)) {
    return <Spoiler>{children}</Spoiler>;
  }
  const handle = mentionHandle(record);
  if (handle) {
    return <MentionChip handle={handle} onMentionClick={onMentionClick} />;
  }
  return <span>{children}</span>;
}

export function MessageContent({
  body,
  onMentionClick,
  resetKey,
}: {
  body: string;
  onMentionClick?: (handle: string) => void;
  resetKey?: string | number;
}) {
  const jumbo = getJumboInfo(body);
  if (jumbo) {
    return (
      <p
        className="leading-none select-none"
        data-jumbo={jumbo}
        data-message-content=""
        style={{ fontSize: jumboSizeToken(jumbo) }}
      >
        {body.trim()}
      </p>
    );
  }

  return (
    <div
      className="text-[length:var(--text-md)] leading-[var(--app-line-height)] break-words"
      data-message-content=""
    >
      <Markdown
        key={resetKey ?? "content"}
        components={{
          a: ({ children, href }) => (
            <a
              className="text-[var(--accent)] underline"
              href={href}
              onClick={(event) => event.stopPropagation()}
              rel="noopener noreferrer"
              target="_blank"
            >
              {children}
            </a>
          ),
          blockquote: ({ children }) => (
            <blockquote className="my-[var(--space-1)] border-l-[length:var(--space-1)] border-[var(--accent)] pl-[var(--space-3)] text-[var(--text-secondary)]">
              {children}
            </blockquote>
          ),
          code: ({ className, children }) => {
            const language = /language-(\S+)/.exec(className ?? "")?.[1];
            if (language) {
              return <CodeBlock code={String(children).replace(/\n$/, "")} lang={language} />;
            }
            return <code className={INLINE_CODE_CLASS}>{children}</code>;
          },
          li: ({ children }) => <li className="ml-[var(--space-4)]">{children}</li>,
          ol: ({ children }) => <ol className="my-[var(--space-1)] list-decimal">{children}</ol>,
          p: ({ children }) => <p className="my-[var(--space-1)]">{children}</p>,
          pre: ({ children }) => <>{children}</>,
          span: ({ children, ...props }) => (
            <MessageSpan onMentionClick={onMentionClick} {...props}>
              {children}
            </MessageSpan>
          ),
          ul: ({ children }) => <ul className="my-[var(--space-1)] list-disc">{children}</ul>,
        }}
        rehypePlugins={[[rehypeSanitize, messageSanitizeSchema]]}
        remarkPlugins={[remarkMessageMarkdown, remarkBreaks]}
        remarkRehypeOptions={{ handlers: messageRehypeHandlers as never }}
      >
        {body}
      </Markdown>
    </div>
  );
}
