import { type ReactNode } from "react";
import { MemoryRouter } from "react-router";
import { render, screen, waitFor } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import { http, HttpResponse } from "msw";
import { describe, expect, it } from "vitest";
import { AppProviders } from "@/app/providers";
import { AdminPacksPanel } from "./admin-packs-panel";
import { setAccessSession } from "@/features/auth/model/access-session";
import { en } from "@/shared/lib/i18n/catalog";
import { server } from "@/test/msw";
import { testSession } from "@/test/access-session";

function wrap(ui: ReactNode) {
  return (
    <AppProviders>
      <MemoryRouter>{ui}</MemoryRouter>
    </AppProviders>
  );
}

describe("AdminPacksPanel", () => {
  it("creates, publishes, reorders, and manages stickers", async () => {
    const user = userEvent.setup({ pointerEventsCheck: 0 });
    setAccessSession(testSession());
    render(wrap(<AdminPacksPanel />));
    expect(await screen.findByText("Waves")).toBeInTheDocument();
    expect(screen.getByText("Cats")).toBeInTheDocument();
    await user.click(screen.getByRole("button", { name: en.settings.sticker_packs.create }));
    await user.type(screen.getByPlaceholderText(en.settings.sticker_packs.name), "Dogs");
    await user.click(screen.getByRole("combobox", { name: en.settings.sticker_packs.kind }));
    await user.click(
      await screen.findByRole("option", { name: en.settings.sticker_packs.kind_emoji }),
    );
    await user.click(screen.getByRole("button", { name: en.settings.sticker_packs.create }));
    await user.click(screen.getAllByRole("button", { name: en.admin.move_up })[0]!);
    await user.click(screen.getAllByRole("button", { name: en.admin.move_down })[1]!);
    await user.click(screen.getAllByRole("button", { name: en.admin.move_down })[0]!);
    await user.click(screen.getByRole("button", { name: en.admin.unpublish }));
    await user.click(screen.getByRole("button", { name: en.admin.publish }));
    const file = new File(["x"], "wave.png", { type: "image/png" });
    await user.upload(screen.getAllByLabelText(en.settings.sticker_packs.add)[0]!, file);
    await user.type(
      screen.getAllByPlaceholderText(en.settings.sticker_packs.shortcode)[0]!,
      "wave2",
    );
    await user.upload(screen.getAllByLabelText(en.settings.sticker_packs.add)[0]!, file);
    await user.click(
      screen.getByRole("button", { name: en.settings.sticker_packs.remove_sticker }),
    );
    await user.click(screen.getAllByRole("button", { name: en.settings.sticker_packs.delete })[0]!);
    await waitFor(() => {
      expect(screen.getByText("Waves")).toBeInTheDocument();
    });
  });

  it("retries after a list error", async () => {
    const user = userEvent.setup({ pointerEventsCheck: 0 });
    let fail = true;
    server.use(
      http.get("*/api/v1/admin/sticker_packs", () => {
        if (fail) {
          return HttpResponse.json({}, { status: 500 });
        }
        return HttpResponse.json({ sticker_packs: [] });
      }),
    );
    setAccessSession(testSession());
    render(wrap(<AdminPacksPanel />));
    expect(await screen.findByText(en.lists.error_title)).toBeInTheDocument();
    fail = false;
    await user.click(screen.getByRole("button", { name: en.lists.error_retry }));
    expect(await screen.findByText(en.lists.empty_title)).toBeInTheDocument();
  });
});
