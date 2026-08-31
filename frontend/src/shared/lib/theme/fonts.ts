export const FONT_LINK_ID = "rajya-font";
export const FONT_FAMILY_VAR = "--app-font-family";
export const DEFAULT_FONT_FAMILY = "inherit";

export function withFontDisplaySwap(url: string): string {
  if (/(?:[?&])display=/.test(url)) {
    return url;
  }
  return `${url}${url.includes("?") ? "&" : "?"}display=swap`;
}

export function applyFont(
  doc: Document,
  family: string,
  url: string | null | undefined,
): void {
  doc.documentElement.style.setProperty(FONT_FAMILY_VAR, family);
  if (typeof doc.getElementById !== "function" || !doc.head) {
    return;
  }
  const existing = doc.getElementById(FONT_LINK_ID);
  if (!url) {
    existing?.remove();
    return;
  }
  const href = withFontDisplaySwap(url);
  let link = existing instanceof HTMLLinkElement ? existing : null;
  if (!link) {
    existing?.remove();
    link = doc.createElement("link");
    link.id = FONT_LINK_ID;
    link.rel = "stylesheet";
    doc.head.append(link);
  }
  if (link.getAttribute("href") !== href) {
    link.setAttribute("href", href);
  }
}
