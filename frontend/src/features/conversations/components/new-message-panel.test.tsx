import { render, screen, waitFor } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import { delay, http, HttpResponse } from "msw";
import { describe, expect, it } from "vitest";
import { NewMessagePanel } from "./new-message-panel";
import { AppProviders } from "@/app/providers";
import { SEARCH_DEBOUNCE_MS } from "@/features/search/model/constants";
import { messagingStore } from "@/shared/lib/api/msw/messaging-store";
import { COMPOSE_AT } from "@/features/conversations/model/compose";
import { en } from "@/shared/lib/i18n/catalog";
import { useLayerStore } from "@/shared/lib/navigation/layer-store";
import { server } from "@/test/msw";

describe("NewMessagePanel", () => {
  it("lists bots, searches people, and opens a DM from either row", async () => {
    const user = userEvent.setup({ pointerEventsCheck: 0 });
    render(
      <AppProviders>
        <NewMessagePanel />
      </AppProviders>,
    );
    expect(await screen.findByText("Nimbus")).toBeInTheDocument();
    await user.type(screen.getByLabelText(en.compose.search), "zzz");
    expect(
      await screen.findByText(en.compose.no_bots.replace("{{query}}", "zzz")),
    ).toBeInTheDocument();
    await user.click(screen.getByRole("button", { name: en.compose.clear_search }));
    expect(screen.getByLabelText(en.compose.search)).toHaveValue("");
    await user.type(screen.getByLabelText(en.compose.search), "@nim");
    expect(screen.getByText("Nimbus")).toBeInTheDocument();
    await user.click(screen.getByRole("button", { name: en.compose.clear_search }));
    await user.click(screen.getByText("Nimbus"));
    await waitFor(() => {
      expect(useLayerStore.getState().layers[0]?.kind).toBe("conversation");
    });
  });

  it("hints until the minimum query, then shows empty or people hits", async () => {
    const user = userEvent.setup({ pointerEventsCheck: 0 });
    render(
      <AppProviders>
        <NewMessagePanel />
      </AppProviders>,
    );
    expect(screen.getByText(en.compose.people_hint.replace("{{count}}", "2"))).toBeInTheDocument();
    await user.type(screen.getByLabelText(en.compose.search), "Adele");
    expect(
      await screen.findByText("Adele Goldberg", {}, { timeout: SEARCH_DEBOUNCE_MS + 500 }),
    ).toBeInTheDocument();
    await user.click(screen.getByText("Adele Goldberg"));
    await waitFor(() => {
      expect(useLayerStore.getState().layers[0]?.kind).toBe("conversation");
    });
  });

  it("shows a people spinner and an empty people section", async () => {
    const user = userEvent.setup({ pointerEventsCheck: 0 });
    server.use(
      http.get("*/api/v1/accounts/search", async () => {
        await delay(80);
        return HttpResponse.json({ accounts: [] });
      }),
    );
    render(
      <AppProviders>
        <NewMessagePanel />
      </AppProviders>,
    );
    await user.type(screen.getByLabelText(en.compose.search), "zz");
    expect(await screen.findByRole("status", { name: en.compose.searching })).toBeInTheDocument();
    expect(
      await screen.findByText(en.compose.no_people.replace("{{query}}", "zz")),
    ).toBeInTheDocument();
  });

  it("shows empty bots when the directory has none", async () => {
    server.use(http.get("*/api/v1/bots", () => HttpResponse.json({ bots: [] })));
    render(
      <AppProviders>
        <NewMessagePanel />
      </AppProviders>,
    );
    expect(await screen.findByText(en.bots.empty)).toBeInTheDocument();
  });

  it("omits an empty username and disables a row while a DM is opening", async () => {
    const user = userEvent.setup({ pointerEventsCheck: 0 });
    server.use(
      http.get("*/api/v1/bots", () =>
        HttpResponse.json({
          bots: [
            {
              id: 2,
              memory_enabled: false,
              account: { id: 7, username: "", display_name: "Ghost", kind: "bot" },
            },
          ],
        }),
      ),
      http.post("*/api/v1/conversations", async () => {
        await delay(80);
        return HttpResponse.json(messagingStore().conversations[0], { status: 201 });
      }),
    );
    render(
      <AppProviders>
        <NewMessagePanel />
      </AppProviders>,
    );
    expect(await screen.findByText("Ghost")).toBeInTheDocument();
    expect(screen.queryByText(`${COMPOSE_AT}`)).toBeNull();
    await user.click(screen.getByText("Ghost"));
    expect(screen.getByRole("button", { name: /Ghost/ })).toBeDisabled();
    await waitFor(() => {
      expect(useLayerStore.getState().layers[0]?.kind).toBe("conversation");
    });
  });
});
