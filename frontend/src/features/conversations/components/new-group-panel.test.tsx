import { render, screen, waitFor, within } from "@testing-library/react";
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
    await user.click(await screen.findByRole("button", { name: /Nimbus.*@nimbus/ }));
    expect(screen.getByRole("button", { name: en.compose.create_group })).toBeEnabled();
    expect(useLayerStore.getState().layers).toHaveLength(0);
    await user.click(
      screen.getByRole("button", { name: en.compose.remove_member.replace("{{name}}", "Nimbus") }),
    );
    expect(screen.getByRole("button", { name: en.compose.create_group })).toBeDisabled();
    await user.click(screen.getByRole("button", { name: /Nimbus.*@nimbus/ }));
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
    await user.click(await screen.findByRole("button", { name: /Nimbus.*@nimbus/ }));
    await user.click(screen.getByRole("button", { name: en.compose.create_group }));
    expect(screen.getByRole("button", { name: en.compose.create_group })).toBeDisabled();
    await waitFor(() => {
      expect(useLayerStore.getState().layers[0]?.kind).toBe("conversation");
    });
  });

  it("expands selected member details before removing them on mobile", async () => {
    const originalWidth = window.innerWidth;
    Object.defineProperty(window, "innerWidth", { configurable: true, value: 390 });
    const user = userEvent.setup({ pointerEventsCheck: 0 });
    render(
      <AppProviders>
        <NewGroupPanel />
      </AppProviders>,
    );
    await user.click(await screen.findByRole("button", { name: /Nimbus.*@nimbus/ }));
    const showLabel = en.compose.show_member.replace("{{name}}", "Nimbus");
    const hideLabel = en.compose.hide_member.replace("{{name}}", "Nimbus");
    const removeLabel = en.compose.remove_member.replace("{{name}}", "Nimbus");
    await user.click(screen.getByRole("button", { name: showLabel }));
    expect(screen.getByRole("button", { name: hideLabel })).toHaveAttribute(
      "aria-expanded",
      "true",
    );
    expect(
      within(screen.getByRole("button", { name: hideLabel })).getByText("@nimbus"),
    ).toBeInTheDocument();
    await user.click(screen.getByRole("button", { name: hideLabel }));
    expect(screen.getByRole("button", { name: showLabel })).toHaveAttribute(
      "aria-expanded",
      "false",
    );
    await user.click(screen.getByRole("button", { name: showLabel }));
    await user.click(screen.getByRole("button", { name: removeLabel }));
    expect(screen.queryByRole("button", { name: hideLabel })).toBeNull();
    Object.defineProperty(window, "innerWidth", { configurable: true, value: originalWidth });
  });

  it("renders a selected member without a username", async () => {
    server.use(
      http.get("*/api/v1/bots", () =>
        HttpResponse.json({
          bots: [
            {
              account: { display_name: "Ghost", id: 7, kind: "bot", username: "" },
              id: 2,
              memory_enabled: false,
            },
          ],
        }),
      ),
    );
    const user = userEvent.setup({ pointerEventsCheck: 0 });
    render(
      <AppProviders>
        <NewGroupPanel />
      </AppProviders>,
    );
    await user.click(await screen.findByRole("button", { name: /Ghost/ }));
    expect(
      screen.getByRole("button", {
        name: en.compose.remove_member.replace("{{name}}", "Ghost"),
      }),
    ).toBeInTheDocument();
  });
});
