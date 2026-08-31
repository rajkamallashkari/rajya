export interface HighlightPart {
  highlight: boolean;
  text: string;
}

export function splitHighlight(text: string, query: string): HighlightPart[] {
  const needle = query.trim();
  if (!needle) {
    return [{ highlight: false, text }];
  }
  const escaped = needle.replace(/[.*+?^${}()|[\]\\]/g, "\\$&");
  const chunks = text.split(new RegExp(`(${escaped})`, "gi"));
  return chunks.filter(Boolean).map((chunk) => ({
    highlight: chunk.toLowerCase() === needle.toLowerCase(),
    text: chunk,
  }));
}

export function wrapMatchIndex(index: number, total: number, delta: 1 | -1): number {
  if (total < 1) {
    return 0;
  }
  return (index + delta + total) % total;
}

export function meetsMinQueryLength(query: string, min: number): boolean {
  return query.trim().length >= min;
}

