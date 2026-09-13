import { fireEvent, render, screen, waitFor } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import { http, HttpResponse } from "msw";
import { MemoryRouter } from "react-router";
import { describe, expect, it } from "vitest";
import { AppProviders } from "@/app/providers";
import { declineAdminBotRequest } from "@/features/admin/api/http";
import { BotsPanel } from "@/features/settings/components/bots-panel";
import { setAccessSession } from "@/features/auth/model/access-session";
import { listBotRequests } from "@/features/bots/api/http";
import { en } from "@/shared/lib/i18n/catalog";
import { testSession } from "@/test/access-session";
import { server } from "@/test/msw";

function renderPanel() {
  setAccessSession(testSession());
  return render(
    <AppProviders>
      <MemoryRouter>
        <BotsPanel />
      </MemoryRouter>
    </AppProviders>,
  );
}

describe("BotsPanel", () => {
  it("creates a request with an uploaded avatar from the nested form", async () => {
    const user = userEvent.setup({ pointerEventsCheck: 0 });
    const view = renderPanel();

    await user.click(await screen.findByRole("button", { name: en.bots.add }));
    await user.type(await screen.findByRole("textbox", { name: en.bots.name }), "Cloud");
    await user.type(screen.getByRole("textbox", { name: en.bots.username }), "cloud_bot");
    await user.type(screen.getByRole("textbox", { name: en.bots.bio }), "Weather helper");
    await user.type(screen.getByRole("textbox", { name: en.bots.persona_prompt }), "A".repeat(80));
    fireEvent.change(view.container.querySelector('input[type="file"]')!, {
      target: { files: [new File(["avatar"], "avatar.webp", { type: "image/webp" })] },
    });
    await user.click(screen.getByRole("button", { name: en.bots.builder_submit }));

    expect(await screen.findByText("Cloud")).toBeInTheDocument();
  });

  it("updates and withdraws requests, then deactivates an owned bot", async () => {
    const user = userEvent.setup({ pointerEventsCheck: 0 });
    renderPanel();

    const editBot = await screen.findByRole("button", {
      name: en.bots.edit_named.replace("{{name}}", "Nimbus"),
    });
    expect(editBot).toBeDisabled();
    await user.click(screen.getAllByRole("button", { name: en.bots.edit_request })[0]!);
    const name = screen.getByRole("textbox", { name: en.bots.name });
    await user.clear(name);
    await user.type(name, "Nimbus request");
    await user.click(screen.getByRole("button", { name: en.bots.update_request }));
    expect(await screen.findByText("Nimbus request")).toBeInTheDocument();

    await user.click(screen.getAllByRole("button", { name: en.bots.withdraw })[1]!);
    await waitFor(() =>
      expect(
        screen.getByRole("button", {
          name: en.bots.edit_named.replace("{{name}}", "Nimbus"),
        }),
      ).toBeEnabled(),
    );
    await user.click(
      screen.getByRole("button", {
        name: en.bots.edit_named.replace("{{name}}", "Nimbus"),
      }),
    );
    expect(screen.getByText(en.bots.edit)).toBeInTheDocument();
    await user.click(screen.getByRole("button", { name: en.bots.cancel }));
    await user.click(
      screen.getByRole("button", { name: en.bots.deactivate_named.replace("{{name}}", "Nimbus") }),
    );
    await user.click(screen.getByRole("button", { name: en.bots.deactivate_confirm }));
    await waitFor(() => expect(screen.queryByText("@nimbus")).toBeNull());
  });

  it("keeps a declined request when re-request editing is cancelled", async () => {
    const user = userEvent.setup({ pointerEventsCheck: 0 });
    setAccessSession(testSession());
    await declineAdminBotRequest(2, "Needs more detail");
    renderPanel();

    await user.click(await screen.findByRole("button", { name: en.bots.re_request }));
    const name = screen.getByRole("textbox", { name: en.bots.name });
    await user.clear(name);
    await user.type(name, "Discarded local edit");
    await user.click(screen.getByRole("button", { name: en.bots.cancel }));

    expect(await screen.findByText(/Declined · Needs more detail/)).toBeInTheDocument();
    expect(screen.getByRole("button", { name: en.bots.re_request })).toBeInTheDocument();
    await expect(listBotRequests()).resolves.toEqual(
      expect.objectContaining({
        bot_requests: expect.arrayContaining([
          expect.objectContaining({ id: 2, status: "declined" }),
        ]),
      }),
    );
  });

  it("retries failed lists and renders the empty state", async () => {
    const user = userEvent.setup();
    server.use(
      http.get("*/api/v1/bots", () => HttpResponse.json({}, { status: 500 })),
      http.get("*/api/v1/bot_requests", () => HttpResponse.json({}, { status: 500 })),
    );
    const view = renderPanel();
    await user.click(await screen.findByRole("button", { name: en.lists.error_retry }));

    server.use(
      http.get("*/api/v1/bots", () => HttpResponse.json({ bots: [] })),
      http.get("*/api/v1/bot_requests", () => HttpResponse.json({ bot_requests: [] })),
    );
    view.rerender(
      <AppProviders>
        <MemoryRouter>
          <BotsPanel />
        </MemoryRouter>
      </AppProviders>,
    );
    await user.click(screen.getByRole("button", { name: en.lists.error_retry }));
    expect(await screen.findByText(en.bots.manage_empty)).toBeInTheDocument();
  });

  it("renders owned bots without a requests section", async () => {
    server.use(http.get("*/api/v1/bot_requests", () => HttpResponse.json({ bot_requests: [] })));
    renderPanel();

    expect(await screen.findByText("@nimbus")).toBeInTheDocument();
    expect(screen.queryByRole("heading", { name: en.bots.requests })).toBeNull();
  });
});
