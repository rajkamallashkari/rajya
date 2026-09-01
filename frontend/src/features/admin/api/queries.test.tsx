import { render, screen, waitFor } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import { http, HttpResponse } from "msw";
import { describe, expect, it } from "vitest";
import { AppProviders } from "@/app/providers";
import { setAccessSession } from "@/features/auth/model/access-session";
import { Button } from "@/shared/ui/button";
import { testSession } from "@/test/access-session";
import { server } from "@/test/msw";
import {
  useAdminFeatureFlags,
  useAdminSettings,
  useAdminThemeOverrides,
  useAdminTranslationStrings,
  useMe,
  useResetAdminSetting,
  useResetAdminThemeOverrides,
  useResetAdminTranslationString,
  useThemeOverridePalette,
  useUpdateAdminFeatureFlag,
  useUpdateAdminSetting,
  useUpdateAdminThemeOverride,
  useUpdateAdminTranslationString,
} from "./queries";

function Harness() {
  const me = useMe();
  const settings = useAdminSettings();
  const flags = useAdminFeatureFlags();
  const strings = useAdminTranslationStrings({ q: "not_found" });
  const themes = useAdminThemeOverrides();
  const palettes = useThemeOverridePalette();
  const updateSetting = useUpdateAdminSetting();
  const resetSetting = useResetAdminSetting();
  const updateFlag = useUpdateAdminFeatureFlag();
  const updateString = useUpdateAdminTranslationString();
  const resetString = useResetAdminTranslationString();
  const updateTheme = useUpdateAdminThemeOverride();
  const resetTheme = useResetAdminThemeOverrides();
  return (
    <div>
      <p data-admin="">{String(me.data?.user.is_admin)}</p>
      <p data-settings="">{settings.data?.settings.length ?? 0}</p>
      <p data-flags="">{flags.data?.feature_flags.length ?? 0}</p>
      <p data-strings="">{strings.data?.translation_strings.length ?? 0}</p>
      <p data-themes="">{Object.keys(themes.data?.themes ?? {}).length}</p>
      <p data-palette="">{Object.keys(palettes.data?.light ?? {}).length}</p>
      <Button
        onClick={() => updateSetting.mutate({ key: "message_edit_window", value: 60 })}
        type="button"
      >
        setting
      </Button>
      <Button onClick={() => resetSetting.mutate("message_edit_window")} type="button">
        reset-setting
      </Button>
      <Button
        onClick={() => updateFlag.mutate({ enabled: true, key: "webrtc_calls", rollout: {} })}
        type="button"
      >
        flag
      </Button>
      <Button
        onClick={() => updateString.mutate({ key: "errors.not_found", value: "Gone" })}
        type="button"
      >
        string
      </Button>
      <Button onClick={() => resetString.mutate("errors.not_found")} type="button">
        reset-string
      </Button>
      <Button
        onClick={() =>
          updateTheme.mutate({
            theme: "light",
            tokenName: "--text-primary",
            value: "var(--accent)",
          })
        }
        type="button"
      >
        theme
      </Button>
      <Button
        onClick={() => resetTheme.mutate({ theme: "light", tokenName: "--text-primary" })}
        type="button"
      >
        reset-theme
      </Button>
      <Button onClick={() => resetTheme.mutate({})} type="button">
        reset-all-theme
      </Button>
    </div>
  );
}

describe("admin queries", () => {
  it("loads configuration and invalidates after writes", async () => {
    const user = userEvent.setup();
    setAccessSession(testSession());
    render(
      <AppProviders>
        <Harness />
      </AppProviders>,
    );
    await waitFor(() => {
      expect(document.querySelector("[data-settings]")?.textContent).toBe("2");
      expect(document.querySelector("[data-flags]")?.textContent).toBe("1");
      expect(document.querySelector("[data-strings]")?.textContent).toBe("1");
      expect(document.querySelector("[data-themes]")?.textContent).toBe("2");
    });
    await user.click(screen.getByRole("button", { name: "setting" }));
    await user.click(screen.getByRole("button", { name: "reset-setting" }));
    await user.click(screen.getByRole("button", { name: "flag" }));
    await user.click(screen.getByRole("button", { name: "string" }));
    await user.click(screen.getByRole("button", { name: "reset-string" }));
    await user.click(screen.getByRole("button", { name: "theme" }));
    await user.click(screen.getByRole("button", { name: "reset-theme" }));
    await user.click(screen.getByRole("button", { name: "reset-all-theme" }));
    await waitFor(() => {
      expect(document.querySelector("[data-admin]")?.textContent).toBe("false");
    });
  });

  it("applies a string override without a locale", async () => {
    const user = userEvent.setup();
    setAccessSession(testSession());
    server.use(
      http.all("*/api/v1/admin/translation_strings", async ({ request }) => {
        if (request.method === "PATCH") {
          return HttpResponse.json({
            translation_string: { key: "errors.not_found" },
          });
        }
        return HttpResponse.json({ translation_strings: [] });
      }),
    );
    render(
      <AppProviders>
        <Harness />
      </AppProviders>,
    );
    await user.click(await screen.findByRole("button", { name: "string" }));
    await waitFor(() => {
      expect(document.querySelector("[data-strings]")?.textContent).toBe("0");
    });
  });

  it("skips i18n when the patched string has no key", async () => {
    const user = userEvent.setup();
    setAccessSession(testSession());
    server.use(
      http.all("*/api/v1/admin/translation_strings", async ({ request }) => {
        if (request.method === "PATCH") {
          return HttpResponse.json({ translation_string: { value: "Gone" } });
        }
        return HttpResponse.json({ translation_strings: [] });
      }),
    );
    render(
      <AppProviders>
        <Harness />
      </AppProviders>,
    );
    await user.click(await screen.findByRole("button", { name: "string" }));
    await waitFor(() => {
      expect(document.querySelector("[data-strings]")?.textContent).toBe("0");
    });
  });
});
