import { JUMBO_EMOJI_MAX, JUMBO_EMOJI_MIN } from "./constants";

/* ZWJ, VS-16 and Fitzpatrick modifiers are parts of one emoji grapheme, not standalone matches. */
/* eslint-disable no-misleading-character-class */
const EMOJI_CLUSTER_RE = /[\p{Extended_Pictographic}\u{1F3FB}-\u{1F3FF}\u200d\ufe0f]/u;
const EMOJI_SEQUENCE_RE = /^[\p{Extended_Pictographic}\u{1F3FB}-\u{1F3FF}\u200d\ufe0f]+$/u;
/* eslint-enable no-misleading-character-class */

export type JumboSize = 1 | 2 | 3;

export function jumboSizeToken(count: JumboSize): string {
  if (count === 1) {
    return "var(--text-jumbo-1)";
  }
  if (count === 2) {
    return "var(--text-jumbo-2)";
  }
  return "var(--text-jumbo-3)";
}

function countFromSegmenter(clean: string): number | null {
  const Segmenter = globalThis.Intl?.Segmenter;
  if (typeof Segmenter !== "function") {
    return null;
  }
  const segments = Array.from(new Segmenter("en", { granularity: "grapheme" }).segment(clean));
  if (!segments.every(({ segment }) => EMOJI_CLUSTER_RE.test(segment))) {
    return 0;
  }
  return segments.length;
}

function countFromRegex(clean: string): number {
  const fallbackGateRe = EMOJI_SEQUENCE_RE;
  if (!fallbackGateRe.test(clean)) {
    return 0;
  }
  return (clean.match(/\p{Extended_Pictographic}/gu) ?? []).length;
}

export function getJumboInfo(text: string | null | undefined): JumboSize | null {
  if (!text?.trim()) {
    return null;
  }
  const clean = text.replace(/\s/g, "");
  const count = countFromSegmenter(clean) ?? countFromRegex(clean);
  if (count < JUMBO_EMOJI_MIN || count > JUMBO_EMOJI_MAX) {
    return null;
  }
  return count as JumboSize;
}
