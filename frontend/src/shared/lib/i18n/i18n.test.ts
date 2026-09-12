import i18n from "i18next";
import { describe, expect, it } from "vitest";
import { initI18n, resolveAppVersion } from "./index";
import { en } from "./catalog";

describe("i18n", () => {
  it("resolves the app version", () => {
    expect(resolveAppVersion(undefined)).toBe("1.2.1");
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

  it("keeps polish chrome copy in the catalog", () => {
    expect(en.calls.return_to_call).toBe("Return to call");
    expect(en.conversations.blocked_banner).toBe(
      "You blocked this account. Open their profile to unblock them.",
    );
    expect(en.auth.profile.username_checking).toBe("Checking username…");
    expect(en.auth.profile.avatar_change).toBe("Change profile photo");
    expect(en.search.jump_date).toBe("Jump to date");
    expect(en.composer.send_voice).toBe("Send voice note");
  });
});
