import { render, screen, waitFor } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import { delay, http, HttpResponse } from "msw";
import { describe, expect, it } from "vitest";
import { NewGroupPanel } from "./new-group-panel";
import { AppProviders } from "@/app/providers";
import { SEARCH_DEBOUNCE_MS } from "@/features/search/model/constants";
import { messagingStore } from "@/shared/lib/api/msw/messaging-store";
import { en } from "@/shared/lib/i18n/catalog";
import { useLayerStore } from "@/shared/lib/navigation/layer-store";
import { server } from "@/test/msw";

describe("NewGroupPanel", () => {
  it("creates a group after picking a person and keeps create disabled until then", async () => {
    const user = userEvent.setup({ pointerEventsCheck: 0 });
    render(
      <AppProviders>
        <NewGroupPanel />
      </AppProviders>,
    );
    expect(screen.getByRole("button", { name: en.compose.create_group })).toBeDisabled();
    await user.type(screen.getByLabelText(en.compose.group_name), "Crew");
    await user.click(await screen.findByText("Nimbus"));
    expect(screen.getByRole("button", { name: en.compose.create_group })).toBeEnabled();
    await user.click(screen.getByText("Nimbus"));
    expect(screen.getByRole("button", { name: en.compose.create_group })).toBeDisabled();
    await user.click(screen.getByText("Nimbus"));
    await user.type(screen.getByLabelText(en.compose.search), "Adele");
    expect(
      await screen.findByText("Adele Goldberg", {}, { timeout: SEARCH_DEBOUNCE_MS + 500 }),
    ).toBeInTheDocument();
    await user.click(screen.getByText("Adele Goldberg"));
    await user.click(screen.getByRole("button", { name: en.compose.create_group }));
    await waitFor(() => {
      expect(useLayerStore.getState().layers[0]?.kind).toBe("conversation");
    });
  });

  it("creates a group with a blank title", async () => {
    const user = userEvent.setup({ pointerEventsCheck: 0 });
    server.use(
      http.post("*/api/v1/conversations", async () => {
        await delay(80);
        return HttpResponse.json(
          { ...messagingStore().conversations[0], title: null },
          { status: 201 },
        );
      }),
    );
    render(
      <AppProviders>
        <NewGroupPanel />
      </AppProviders>,
    );
    await user.click(await screen.findByText("Nimbus"));
    await user.click(screen.getByRole("button", { name: en.compose.create_group }));
    expect(screen.getByRole("button", { name: en.compose.create_group })).toBeDisabled();
    await waitFor(() => {
      expect(useLayerStore.getState().layers[0]?.kind).toBe("conversation");
    });
  });
});
