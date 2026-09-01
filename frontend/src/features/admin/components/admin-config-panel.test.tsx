import { type ReactNode } from "react";
import { render, screen, waitFor, within } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import { http, HttpResponse } from "msw";
import { describe, expect, it } from "vitest";
import { AdminConfigPanel } from "./admin-config-panel";
import { AppProviders } from "@/app/providers";
import { setAccessSession } from "@/features/auth/model/access-session";
import { en } from "@/shared/lib/i18n/catalog";
import { SEMANTIC_DEFAULTS } from "@/shared/lib/theme/constants";
import { testSession } from "@/test/access-session";
import { server } from "@/test/msw";

function wrap(ui: ReactNode) {
  return <AppProviders>{ui}</AppProviders>;
}

describe("AdminConfigPanel", () => {
  it("edits settings, flags, strings, and colours", async () => {
    const user = userEvent.setup({ pointerEventsCheck: 0 });
    setAccessSession(testSession());
    render(wrap(<AdminConfigPanel />));
    const editWindow = await screen.findByRole("textbox", { name: "message_edit_window" });
    expect(
      screen.getByText(en.admin.category.replace("{{name}}", "messaging")),
    ).toBeInTheDocument();
    expect(screen.getByText(en.admin.category.replace("{{name}}", "general"))).toBeInTheDocument();
    await user.clear(editWindow);
    await user.type(editWindow, "60");
    await user.click(
      within(editWindow.closest("form")!).getByRole("button", { name: en.admin.current }),
    );
    await user.click(
      within(editWindow.closest("form")!).getByRole("button", { name: en.admin.reset }),
    );
    const providers = screen.getByRole("textbox", { name: "gif_providers" });
    await user.click(
      within(providers.closest("form")!).getByRole("button", { name: en.admin.current }),
    );

    await user.click(screen.getByRole("button", { name: en.admin.flags }));
    const flagSwitch = await screen.findByRole("switch", { name: "webrtc_calls" });
    await user.click(flagSwitch);
    await waitFor(() => {
      expect(flagSwitch).toBeChecked();
    });
    await user.type(screen.getByRole("textbox", { name: en.admin.account_ids }), "1, 2");
    await user.type(screen.getByRole("textbox", { name: en.admin.percentage }), "25");
    await user.click(screen.getByRole("button", { name: en.admin.current }));
    await user.clear(screen.getByRole("textbox", { name: en.admin.percentage }));
    await user.click(screen.getByRole("button", { name: en.admin.current }));
    await user.type(screen.getByRole("textbox", { name: en.admin.percentage }), "x");
    await user.click(screen.getByRole("button", { name: en.admin.current }));

    await user.click(screen.getByRole("button", { name: en.admin.strings }));
    const search = await screen.findByRole("textbox", { name: en.admin.search });
    await user.type(search, "not_found");
    expect(await screen.findByRole("textbox", { name: "errors.not_found" })).toBeInTheDocument();
    await user.click(screen.getByRole("combobox", { name: en.admin.surface }));
    await user.click(await screen.findByRole("option", { name: "errors" }));
    await user.click(screen.getByRole("button", { name: en.admin.used_on_screen }));
    const stringField = screen.getByRole("textbox", { name: "errors.not_found" });
    await user.clear(stringField);
    await user.type(stringField, "Gone");
    await user.click(
      within(stringField.closest("form")!).getByRole("button", { name: en.admin.current }),
    );
    await user.click(
      within(stringField.closest("form")!).getByRole("button", { name: en.admin.reset_string }),
    );
    await user.click(screen.getByRole("combobox", { name: en.admin.surface }));
    await user.click(await screen.findByRole("option", { name: en.admin.surface_all }));

    await user.click(screen.getByRole("button", { name: en.admin.colours }));
    const light = await screen.findByRole("textbox", { name: "light --text-primary" });
    await user.clear(light);
    await user.type(light, SEMANTIC_DEFAULTS.light["--text-secondary"]);
    await user.click(
      within(light.closest("form")!).getByRole("button", { name: en.admin.current }),
    );
    await user.click(within(light.closest("form")!).getByRole("button", { name: en.admin.reset }));
    const dark = screen.getByRole("textbox", { name: "dark --text-primary" });
    await user.clear(dark);
    await user.type(dark, SEMANTIC_DEFAULTS.dark["--text-secondary"]);
    await user.click(within(dark.closest("form")!).getByRole("button", { name: en.admin.current }));
    await user.clear(light);
    await user.type(light, SEMANTIC_DEFAULTS.light["--surface-app"]);
    await user.click(
      within(light.closest("form")!).getByRole("button", { name: en.admin.current }),
    );
    expect(
      await screen.findByText(
        en.admin.contrast_failed
          .replace("{{token}}", "--text-primary")
          .replace("{{against}}", "--surface-app"),
      ),
    ).toBeInTheDocument();
    await user.click(screen.getByRole("button", { name: en.admin.reset_all }));
  });

  it("hydrates flag rollout fields from the server", async () => {
    server.use(
      http.get("*/api/v1/admin/feature_flags", () =>
        HttpResponse.json({
          feature_flags: [
            {
              key: "webrtc_calls",
              description: "P2P",
              default: false,
              enabled: true,
              overridden: true,
              rollout: { account_ids: [1], percentage: 10 },
            },
          ],
          unregistered_keys: [],
        }),
      ),
    );
    const user = userEvent.setup({ pointerEventsCheck: 0 });
    render(wrap(<AdminConfigPanel />));
    await user.click(screen.getByRole("button", { name: en.admin.flags }));
    expect(await screen.findByRole("textbox", { name: en.admin.account_ids })).toHaveValue("1");
    expect(screen.getByRole("textbox", { name: en.admin.percentage })).toHaveValue("10");
    await user.click(screen.getByRole("switch", { name: "webrtc_calls" }));
  });

  it("toggles a flag when rollout is missing", async () => {
    server.use(
      http.get("*/api/v1/admin/feature_flags", () =>
        HttpResponse.json({
          feature_flags: [
            {
              key: "webrtc_calls",
              description: "P2P",
              default: false,
              enabled: false,
              overridden: false,
            },
          ],
          unregistered_keys: [],
        }),
      ),
    );
    const user = userEvent.setup({ pointerEventsCheck: 0 });
    render(wrap(<AdminConfigPanel />));
    await user.click(screen.getByRole("button", { name: en.admin.flags }));
    await user.click(await screen.findByRole("switch", { name: "webrtc_calls" }));
  });

  it("renders empty configuration lists", async () => {
    server.use(
      http.get("*/api/v1/admin/settings", () =>
        HttpResponse.json({
          settings: [
            {
              key: "plain",
              category: "messaging",
              default: "a",
              description: "plain",
              value: true,
              overridden: false,
            },
          ],
          unregistered_keys: [],
        }),
      ),
      http.get("*/api/v1/admin/feature_flags", () =>
        HttpResponse.json({ feature_flags: [], unregistered_keys: [] }),
      ),
      http.get("*/api/v1/admin/translation_strings", () =>
        HttpResponse.json({
          translation_strings: [
            { surface: null, key: "x", locale: "en", value: "y", overridden: false },
          ],
        }),
      ),
      http.get("*/api/v1/admin/theme_overrides", () =>
        HttpResponse.json({ themes: { light: null } }),
      ),
    );
    const user = userEvent.setup({ pointerEventsCheck: 0 });
    render(wrap(<AdminConfigPanel />));
    await waitFor(() => {
      expect(screen.queryByRole("textbox", { name: "message_edit_window" })).toBeNull();
    });
    const plain = await screen.findByRole("textbox", { name: "plain" });
    await user.click(
      within(plain.closest("form")!).getByRole("button", { name: en.admin.current }),
    );
    await user.click(screen.getByRole("button", { name: en.admin.flags }));
    expect(screen.queryByRole("switch")).toBeNull();
    await user.click(screen.getByRole("button", { name: en.admin.strings }));
    await user.click(await screen.findByRole("button", { name: en.admin.used_on_screen }));
    await user.click(screen.getByRole("button", { name: en.admin.colours }));
    expect(await screen.findByRole("button", { name: en.admin.reset_all })).toBeInTheDocument();
  });
});
