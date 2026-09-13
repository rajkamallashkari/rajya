import { Fragment, type ReactNode } from "react";

const URL_PATTERN = /(https?:\/\/[^\s]+)/g;
const TRAILING_PUNCTUATION = /[),.!?:;]+$/;

function linkedPart(part: string, key: number): ReactNode {
  if (!part.match(/^https?:\/\//)) {
    return <Fragment key={key}>{part}</Fragment>;
  }
  const punctuation = part.match(TRAILING_PUNCTUATION)?.[0] ?? "";
  const href = punctuation ? part.slice(0, -punctuation.length) : part;
  return (
    <Fragment key={key}>
      <a
        className="text-[var(--accent)] underline"
        href={href}
        rel="noopener noreferrer"
        target="_blank"
      >
        {href}
      </a>
      {punctuation}
    </Fragment>
  );
}

export function BioContent({ children }: { children: string }): ReactNode {
  return (
    <span className="whitespace-pre-wrap break-words" data-bio-content="">
      {children.split(URL_PATTERN).map(linkedPart)}
    </span>
  );
}
