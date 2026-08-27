import en from "./en.json";

export const DEFAULT_LOCALE = "en";
export const CATALOG_STORAGE_PREFIX = "rajya:i18n";

export type Catalog = typeof en;

export interface CatalogLoadOptions {
  version: string;
  locale?: string;
  fetcher?: (url: string) => Promise<Response>;
  storage?: Pick<Storage, "getItem" | "setItem">;
  bundled?: Catalog;
}

function storageKey(version: string, locale: string): string {
  return `${CATALOG_STORAGE_PREFIX}:${version}:${locale}`;
}

function isCatalog(value: unknown): value is Catalog {
  if (value === null || typeof value !== "object" || Array.isArray(value)) {
    return false;
  }
  const record = value as Record<string, unknown>;
  return (
    typeof record.brand === "object" &&
    record.brand !== null &&
    typeof record.app === "object" &&
    record.app !== null &&
    typeof record.errors === "object" &&
    record.errors !== null
  );
}

function readCached(storage: Pick<Storage, "getItem"> | undefined, key: string): Catalog | null {
  if (!storage) {
    return null;
  }
  const raw = storage.getItem(key);
  if (raw === null) {
    return null;
  }
  try {
    const parsed: unknown = JSON.parse(raw);
    return isCatalog(parsed) ? parsed : null;
  } catch {
    return null;
  }
}

export async function loadCatalog(options: CatalogLoadOptions): Promise<Catalog> {
  const locale = options.locale ?? DEFAULT_LOCALE;
  const bundled = options.bundled ?? en;
  const key = storageKey(options.version, locale);
  const cached = readCached(options.storage, key);
  if (cached) {
    return cached;
  }

  const fetcher = options.fetcher;
  if (!fetcher) {
    return bundled;
  }

  try {
    const response = await fetcher(`/i18n/${locale}.json?v=${encodeURIComponent(options.version)}`);
    if (!response.ok) {
      return bundled;
    }
    const parsed: unknown = await response.json();
    if (!isCatalog(parsed)) {
      return bundled;
    }
    options.storage?.setItem(key, JSON.stringify(parsed));
    return parsed;
  } catch {
    return bundled;
  }
}

export { en };
