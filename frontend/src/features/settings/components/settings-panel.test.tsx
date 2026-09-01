import { type ReactNode } from "react";
import { render, screen, waitFor } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import { http, HttpResponse } from "msw";
import { describe, expect, it } from "vitest";
import { SettingsPanel } from "./settings-panel";
import { AppProviders } from "@/app/providers";
import { en } from "@/shared/lib/i18n/catalog";
import { server } from "@/test/msw";

function wrap(ui: ReactNode) {
  return <AppProviders>{ui}</AppProviders>;
}

const adminMe = {
  account: { id: 1, username: "ada", display_name: "Ada", kind: "human" },
  user: {
    id: 1,
    email: "ada@example.com",
    onboarded: true,
    has_password: true,
    has_passkey: false,
    phone_verified: false,
    is_admin: true,
  },
};

describe("SettingsPanel admin", () => {
  it("hides the admin row unless the session user is an admin", async () => {
    render(wrap(<SettingsPanel />));
    await waitFor(() => {
      expect(screen.getByRole("button", { name: en.settings.appearance })).toBeInTheDocument();
    });
    expect(screen.queryByRole("button", { name: en.admin.title })).toBeNull();
  });

  it("opens the configuration editors for admins", async () => {
    const user = userEvent.setup({ pointerEventsCheck: 0 });
    server.use(http.all("*/api/v1/users/me", () => HttpResponse.json(adminMe)));
    render(wrap(<SettingsPanel />));
    await user.click(await screen.findByRole("button", { name: en.admin.title }));
    expect(document.querySelector("[data-admin-config]")).not.toBeNull();
    expect(
      document.querySelector("[data-settings-section]")?.getAttribute("data-settings-section"),
    ).toBe("admin");
    await user.click(screen.getByRole("button", { name: en.shell.back }));
    expect(
      document.querySelector("[data-settings-section]")?.getAttribute("data-settings-section"),
    ).toBe("hub");
  });
});
