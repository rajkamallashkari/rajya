import { type ReactNode } from "react";
import { render, screen, waitFor } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import { http, HttpResponse } from "msw";
import { describe, expect, it } from "vitest";
import { AppProviders } from "@/app/providers";
import { setAccessSession } from "@/features/auth/model/access-session";
import { SettingsPanel } from "./settings-panel";
import { StickersPanel } from "./stickers-panel";
import { en } from "@/shared/lib/i18n/catalog";
import { server } from "@/test/msw";
import { testSession } from "@/test/access-session";

function wrap(ui: ReactNode) {
  return <AppProviders>{ui}</AppProviders>;
}

const ownedPack = {
  created_at: "2026-01-01T12:00:00.000Z",
  id: 1,
  kind: "sticker" as const,
  name: "Waves",
  owner_account_id: 1,
  position: 0,
  published_at: null,
  slug: "waves",
  stickers: [
    {
      id: 1,
      position: 0,
      shortcode: "wave",
      sticker_pack_id: 1,
      url: "https://media.test/sticker.png",
    },
    {
      id: 2,
      position: 1,
      shortcode: "plain",
      sticker_pack_id: 1,
      url: null,
    },
  ],
  updated_at: "2026-01-01T12:00:00.000Z",
};

describe("StickersPanel", () => {
  it("manages owned packs and stickers", async () => {
    const user = userEvent.setup({ pointerEventsCheck: 0 });
    setAccessSession(testSession());
    server.use(http.get("*/api/v1/sticker_packs", () => HttpResponse.json({ sticker_packs: [ownedPack] })));
    render(wrap(<StickersPanel />));
    expect(await screen.findByText("Waves")).toBeInTheDocument();
    expect(screen.getByText("plain")).toBeInTheDocument();
    await user.click(screen.getByRole("button", { name: en.settings.sticker_packs.create }));
    await user.type(screen.getByPlaceholderText(en.settings.sticker_packs.name), "Cats");
    await user.click(screen.getByRole("combobox", { name: en.settings.sticker_packs.kind }));
    await user.click(await screen.findByRole("option", { name: en.settings.sticker_packs.kind_emoji }));
    await user.click(screen.getByRole("button", { name: en.settings.sticker_packs.create }));
    const file = new File(["x"], "wave.png", { type: "image/png" });
    await user.upload(screen.getByLabelText(en.settings.sticker_packs.add), file);
    await user.type(screen.getByPlaceholderText(en.settings.sticker_packs.shortcode), "wave2");
    await user.upload(screen.getByLabelText(en.settings.sticker_packs.add), file);
    await user.click(screen.getAllByRole("button", { name: en.settings.sticker_packs.remove_sticker })[0]!);
    await user.click(screen.getByRole("button", { name: en.settings.sticker_packs.delete }));
  });

  it("hides owner actions on published packs", async () => {
    setAccessSession(testSession());
    render(wrap(<StickersPanel />));
    expect(await screen.findByText("Waves")).toBeInTheDocument();
    expect(screen.queryByRole("button", { name: en.settings.sticker_packs.delete })).toBeNull();
  });

  it("retries after a list error", async () => {
    const user = userEvent.setup({ pointerEventsCheck: 0 });
    let fail = true;
    server.use(
      http.get("*/api/v1/sticker_packs", () => {
        if (fail) {
          return HttpResponse.json(
            { error: { code: "fail", message: "fail", details: {} } },
            { status: 500 },
          );
        }
        return HttpResponse.json({ sticker_packs: [] });
      }),
    );
    render(wrap(<StickersPanel />));
    expect(await screen.findByText(en.lists.error_title)).toBeInTheDocument();
    fail = false;
    await user.click(screen.getByRole("button", { name: en.lists.error_retry }));
    expect(await screen.findByText(en.lists.empty_title)).toBeInTheDocument();
  });
});

describe("SettingsPanel stickers", () => {
  it("opens stickers from the hub", async () => {
    const user = userEvent.setup({ pointerEventsCheck: 0 });
    render(wrap(<SettingsPanel />));
    await user.click(screen.getByRole("button", { name: en.settings.stickers }));
    expect(document.querySelector("[data-stickers-panel]")).not.toBeNull();
    await waitFor(() => {
      expect(screen.getByText("Waves")).toBeInTheDocument();
    });
  });
});
