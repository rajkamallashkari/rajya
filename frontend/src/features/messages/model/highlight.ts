import { createCssVariablesTheme } from "shiki/core";
import { createHighlighter, type Highlighter } from "shiki";
import { HIGHLIGHT_LANGS, PLAIN_HIGHLIGHT_LANG, resolveHighlightLang } from "./constants";

export const HIGHLIGHT_THEME_NAME = "rajya";

const theme = createCssVariablesTheme({
  name: HIGHLIGHT_THEME_NAME,
  variablePrefix: "--shiki-",
});

type HighlighterFactory = () => Promise<Highlighter>;

let highlighterPromise: Promise<Highlighter> | null = null;

export function createMessageHighlighter(): Promise<Highlighter> {
  highlighterPromise ??= createHighlighter({
    langs: [...HIGHLIGHT_LANGS],
    themes: [theme],
  });
  return highlighterPromise;
}

export function resetMessageHighlighter(): void {
  highlighterPromise = null;
}

export async function highlightCode(
  code: string,
  lang: string,
  factory: HighlighterFactory = createMessageHighlighter,
): Promise<string | null> {
  try {
    const highlighter = await factory();
    const resolved = resolveHighlightLang(lang);
    const loaded = highlighter.getLoadedLanguages();
    const useLang = loaded.includes(resolved) ? resolved : PLAIN_HIGHLIGHT_LANG;
    return highlighter.codeToHtml(code, { lang: useLang, theme: HIGHLIGHT_THEME_NAME });
  } catch {
    return null;
  }
}
