import { render, screen } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import { MemoryRouter } from "react-router";
import { describe, expect, it } from "vitest";
import { AppProviders } from "@/app/providers";
import { AppShell } from "@/app/shell";
import { useAccountsStore } from "@/features/auth/store/accounts-store";
import { useShellStore } from "@/features/settings/store/shell-store";
import { ADA_DEMO } from "@/features/conversations/model/demo";
import { en } from "@/shared/lib/i18n/catalog";
import { SHORTCUTS } from "@/shared/lib/shortcuts/constants";
import { useLayerStore } from "@/shared/lib/navigation/layer-store";

function renderShell(): void {
  render(
    <AppProviders>
      <MemoryRouter>
        <AppShell />
      </MemoryRouter>
    </AppProviders>,
  );
}

describe("AppShell", () => {
  it("renders the chat list, impersonation banner, shortcuts, and gallery link", async () => {
    const user = userEvent.setup();
    Object.defineProperty(window, "innerWidth", {
      configurable: true,
      writable: true,
      value: 1280,
    });
    useShellStore.setState({ impersonatingName: "Ada" });
    renderShell();
    expect(screen.getByAltText(en.brand.logo_alt)).toBeInTheDocument();
    expect(screen.getByRole("link", { name: en.app.gallery })).toHaveAttribute(
      "href",
      "/dev/gallery",
    );
    expect(screen.getByRole("link", { name: en.app.accounts })).toHaveAttribute(
      "href",
      "/dev/accounts",
    );
    expect(screen.getByRole("alert")).toHaveTextContent("Ada");
    expect(screen.queryByRole("dialog")).toBeNull();
    await user.click(screen.getByRole("button", { name: en.impersonation.exit }));
    expect(useShellStore.getState().impersonatingName).toBeNull();
    expect(await screen.findByRole("button", { name: en.shell.open_profile })).toBeInTheDocument();
    expect(useLayerStore.getState().layers).toEqual([
      expect.objectContaining({ conversationId: "1", kind: "conversation" }),
    ]);
    window.dispatchEvent(new KeyboardEvent("keydown", { key: SHORTCUTS.popLayer, bubbles: true }));
    expect(useLayerStore.getState().layers).toHaveLength(1);
    await user.click(screen.getByRole("button", { name: en.shell.open_profile }));
    expect(useLayerStore.getState().layers.some((layer) => layer.kind === "profile")).toBe(true);
    window.dispatchEvent(new KeyboardEvent("keydown", { key: SHORTCUTS.popLayer, bubbles: true }));
    expect(useLayerStore.getState().layers).toEqual([
      expect.objectContaining({ conversationId: "1", kind: "conversation" }),
    ]);
    await user.click(await screen.findByText("Team"));
    expect(useLayerStore.getState().layers).toEqual([
      expect.objectContaining({ conversationId: "2", kind: "conversation" }),
    ]);
    window.dispatchEvent(
      new KeyboardEvent("keydown", { key: SHORTCUTS.focusSearch, bubbles: true }),
    );
    expect(screen.getByLabelText(en.search.label)).toHaveFocus();
    window.dispatchEvent(new KeyboardEvent("keydown", { key: SHORTCUTS.popLayer, bubbles: true }));
  });

  it("shows onboarding when the active account is not onboarded", () => {
    useAccountsStore.getState().upsertAccount({
      displayName: "Ada",
      hasPasskey: false,
      hasPassword: true,
      id: 1,
      onboarded: false,
      token: "tok",
      username: "ada",
    });
    renderShell();
    expect(screen.getByRole("dialog", { name: en.auth.onboarding.aria })).toBeInTheDocument();
  });

  it("lets mobile close the conversation back to the list", async () => {
    const user = userEvent.setup();
    Object.defineProperty(window, "innerWidth", {
      configurable: true,
      writable: true,
      value: 390,
    });
    renderShell();
    expect(useLayerStore.getState().layers).toHaveLength(0);
    window.dispatchEvent(new KeyboardEvent("keydown", { key: SHORTCUTS.popLayer, bubbles: true }));
    expect(useLayerStore.getState().layers).toHaveLength(0);
    await user.click(await screen.findByText(ADA_DEMO.name));
    expect(useLayerStore.getState().layers).toHaveLength(1);
    window.dispatchEvent(new KeyboardEvent("keydown", { key: SHORTCUTS.popLayer, bubbles: true }));
    expect(useLayerStore.getState().layers).toHaveLength(0);
  });
});
