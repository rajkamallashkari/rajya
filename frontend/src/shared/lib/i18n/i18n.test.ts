import i18n from "i18next";
import { describe, expect, it } from "vitest";
import { initI18n, resolveAppVersion } from "./index";
import { en } from "./catalog";

describe("i18n", () => {
  it("resolves the app version", () => {
    expect(resolveAppVersion(undefined)).toBe("1.1.0");
    expect(resolveAppVersion("9.9.9")).toBe("9.9.9");
  });

  it("initializes a fresh instance and hydrates an existing one", async () => {
    const fresh = i18n.createInstance();
    const first = await initI18n({ instance: fresh, catalog: en });
    expect(first.isInitialized).toBe(true);
    expect(first.t("brand.logo_alt")).toBe("Rajya");

    const second = await initI18n({ instance: first, catalog: en, locale: "en" });
    expect(second.t("app.tagline")).toBe("Chat");
  });

  it("loads the bundled catalog when none is provided", async () => {
    const fresh = i18n.createInstance();
    const instance = await initI18n({ instance: fresh });
    expect(instance.t("errors.app.retry")).toBe("Try again");
  });
});
