import { render, screen } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import { MemoryRouter } from "react-router";
import { describe, expect, it } from "vitest";
import { AppProviders } from "@/app/providers";
import { AppShell } from "@/app/shell";
import { useShellStore } from "@/features/settings/store/shell-store";
import { ADA_DEMO } from "@/features/conversations/model/demo";
import { en } from "@/shared/lib/i18n/catalog";
import { SHORTCUTS } from "@/shared/lib/shortcuts/constants";
import { useLayerStore } from "@/shared/lib/navigation/layer-store";

describe("AppShell", () => {
  it("renders the chat list, impersonation banner, shortcuts, and gallery link", async () => {
    const user = userEvent.setup();
    useShellStore.setState({ impersonatingName: "Ada" });
    render(
      <AppProviders>
        <MemoryRouter>
          <AppShell />
        </MemoryRouter>
      </AppProviders>,
    );
    expect(screen.getByAltText(en.brand.logo_alt)).toBeInTheDocument();
    expect(screen.getByRole("link", { name: en.app.gallery })).toHaveAttribute(
      "href",
      "/dev/gallery",
    );
    expect(screen.getByRole("alert")).toHaveTextContent("Ada");
    await user.click(screen.getByRole("button", { name: en.impersonation.exit }));
    expect(useShellStore.getState().impersonatingName).toBeNull();
    await user.click(screen.getByText(ADA_DEMO.name));
    expect(useLayerStore.getState().layers).toHaveLength(1);
    await user.click(screen.getByRole("button", { name: en.shell.open_profile }));
    expect(useLayerStore.getState().layers.some((layer) => layer.kind === "profile")).toBe(true);
    window.dispatchEvent(new KeyboardEvent("keydown", { key: SHORTCUTS.popLayer, bubbles: true }));
    expect(useLayerStore.getState().layers).toHaveLength(1);
    window.dispatchEvent(new KeyboardEvent("keydown", { key: SHORTCUTS.popLayer, bubbles: true }));
    expect(useLayerStore.getState().layers).toHaveLength(0);
    window.dispatchEvent(
      new KeyboardEvent("keydown", { key: SHORTCUTS.focusSearch, bubbles: true }),
    );
    expect(screen.getByLabelText(en.search.label)).toHaveFocus();
    window.dispatchEvent(new KeyboardEvent("keydown", { key: SHORTCUTS.popLayer, bubbles: true }));
  });
});
