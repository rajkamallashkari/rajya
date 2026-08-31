import { type ReactNode } from "react";
import { render, screen, waitFor } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import { http, HttpResponse } from "msw";
import { describe, expect, it } from "vitest";
import { AppProviders } from "@/app/providers";
import { DevicesPanel } from "./devices-panel";
import { SettingsPanel } from "./settings-panel";
import { en } from "@/shared/lib/i18n/catalog";
import { server } from "@/test/msw";

function wrap(ui: ReactNode) {
  return <AppProviders>{ui}</AppProviders>;
}

describe("DevicesPanel", () => {
  it("revokes another device and other sessions", async () => {
    const user = userEvent.setup({ pointerEventsCheck: 0 });
    render(wrap(<DevicesPanel />));
    expect(await screen.findByText("Laptop")).toBeInTheDocument();
    expect(screen.getByText(en.sessions.current)).toBeInTheDocument();
    await user.click(screen.getByRole("button", { name: en.sessions.revoke }));
    await user.click(screen.getByRole("button", { name: en.sessions.revoke_others }));
  });

  it("retries after a list error", async () => {
    const user = userEvent.setup({ pointerEventsCheck: 0 });
    let fail = true;
    server.use(
      http.get("*/api/v1/sessions", () => {
        if (fail) {
          return HttpResponse.json(
            { error: { code: "fail", message: "fail", details: {} } },
            { status: 500 },
          );
        }
        return HttpResponse.json({ sessions: [] });
      }),
    );
    render(wrap(<DevicesPanel />));
    expect(await screen.findByText(en.lists.error_title)).toBeInTheDocument();
    fail = false;
    await user.click(screen.getByRole("button", { name: en.lists.error_retry }));
    expect(await screen.findByText(en.lists.empty_title)).toBeInTheDocument();
  });
});

describe("SettingsPanel devices", () => {
  it("opens devices from the hub", async () => {
    const user = userEvent.setup({ pointerEventsCheck: 0 });
    render(wrap(<SettingsPanel />));
    await user.click(screen.getByRole("button", { name: en.settings.devices }));
    expect(document.querySelector("[data-devices-panel]")).not.toBeNull();
    await waitFor(() => {
      expect(screen.getByText("Laptop")).toBeInTheDocument();
    });
  });
});
