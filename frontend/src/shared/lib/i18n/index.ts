import i18n, { type i18n as I18nInstance } from "i18next";
import { initReactI18next } from "react-i18next";
import { DEFAULT_LOCALE, loadCatalog, type Catalog } from "./catalog";

export const DEFAULT_APP_VERSION = "1.1.0";

export function resolveAppVersion(value: string | undefined): string {
  return value ?? DEFAULT_APP_VERSION;
}

export const APP_VERSION = resolveAppVersion(import.meta.env.VITE_APP_VERSION);

export async function initI18n(options?: {
  locale?: string;
  catalog?: Catalog;
  fetcher?: (url: string) => Promise<Response>;
  storage?: Pick<Storage, "getItem" | "setItem">;
  instance?: I18nInstance;
}): Promise<I18nInstance> {
  const locale = options?.locale ?? DEFAULT_LOCALE;
  const instance = options?.instance ?? i18n;
  const catalog =
    options?.catalog ??
    (await loadCatalog({
      version: APP_VERSION,
      locale,
      fetcher: options?.fetcher,
      storage: options?.storage,
    }));

  if (!instance.isInitialized) {
    await instance.use(initReactI18next).init({
      lng: locale,
      fallbackLng: DEFAULT_LOCALE,
      interpolation: { escapeValue: false },
      resources: { [locale]: { translation: catalog } },
    });
    return instance;
  }

  instance.addResourceBundle(locale, "translation", catalog, true, true);
  await instance.changeLanguage(locale);
  return instance;
}

export { i18n };
export { loadCatalog } from "./catalog";
