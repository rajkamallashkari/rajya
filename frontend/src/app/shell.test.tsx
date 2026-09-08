import { render, screen, waitFor } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import { MemoryRouter, Route, Routes } from "react-router";
import { afterEach, beforeEach, describe, expect, it } from "vitest";
import { AppProviders } from "@/app/providers";
import { AppShell } from "@/app/shell";
import { useAccountsStore } from "@/features/auth/store/accounts-store";
import { useShellStore } from "@/features/settings/store/shell-store";
import { ADA_DEMO } from "@/features/conversations/model/demo";
import { en } from "@/shared/lib/i18n/catalog";
import { SHORTCUTS } from "@/shared/lib/shortcuts/constants";
import { useLayerStore } from "@/shared/lib/navigation/layer-store";
import { resetSearchStore, useSearchStore } from "@/features/search/store/search-store";

function liveToken(): string {
  const encoded = btoa(JSON.stringify({ exp: Math.floor(Date.now() / 1000) + 3_600 }))
    .replace(/\+/g, "-")
    .replace(/\//g, "_")
    .replace(/=/g, "");
  return `hdr.${encoded}.sig`;
}

function seedAccount(onboarded = true, id = 1, activate = true): void {
  useAccountsStore.getState().upsertAccount(
    {
      displayName: id === 1 ? "Ada" : "Bob",
      hasPasskey: false,
      hasPassword: true,
      id,
      onboarded,
      token: liveToken(),
      username: id === 1 ? "ada" : "bob",
    },
    activate,
  );
}

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
  beforeEach(() => {
    seedAccount();
  });

  afterEach(() => {
    useLayerStore.getState().clearLayers();
    useShellStore.setState({ impersonatingName: null });
    resetSearchStore();
  });
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
    await user.click(screen.getByRole("button", { name: en.shell.settings }));
    await waitFor(() => {
      expect(document.querySelector("[data-settings-panel]")).not.toBeNull();
    });
    window.dispatchEvent(new KeyboardEvent("keydown", { key: SHORTCUTS.popLayer, bubbles: true }));
    await user.click(screen.getByRole("button", { name: en.impersonation.exit }));
    await waitFor(() => {
      expect(useShellStore.getState().impersonatingName).toBeNull();
    });
    expect(await screen.findByRole("button", { name: en.shell.open_profile })).toBeInTheDocument();
    expect(useLayerStore.getState().layers).toEqual([
      expect.objectContaining({ conversationId: "1", kind: "conversation" }),
    ]);
    window.dispatchEvent(new KeyboardEvent("keydown", { key: SHORTCUTS.popLayer, bubbles: true }));
    expect(useLayerStore.getState().layers).toHaveLength(1);
    await user.click(screen.getByRole("button", { name: en.shell.open_profile }));
    expect(useLayerStore.getState().layers.some((layer) => layer.kind === "profile")).toBe(true);
    await user.click(await screen.findByRole("button", { name: en.media.gallery_title }));
    expect(useLayerStore.getState().layers.some((layer) => layer.kind === "gallery")).toBe(true);
    expect(document.querySelector("[data-media-gallery]")).not.toBeNull();
    window.dispatchEvent(new KeyboardEvent("keydown", { key: SHORTCUTS.popLayer, bubbles: true }));
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

  it("opens a conversation focused on a permalink message", async () => {
    render(
      <AppProviders>
        <MemoryRouter initialEntries={["/c/1/m/101"]}>
          <Routes>
            <Route element={<AppShell />} path="/c/:conversationId/m/:messageId" />
          </Routes>
        </MemoryRouter>
      </AppProviders>,
    );
    await waitFor(() => {
      expect(useLayerStore.getState().layers[0]).toEqual(
        expect.objectContaining({ conversationId: "1", focusMessageId: "101" }),
      );
    });
  });

  it("resolves a message permalink without a conversation id", { timeout: 10_000 }, async () => {
    render(
      <AppProviders>
        <MemoryRouter initialEntries={["/m/101"]}>
          <Routes>
            <Route element={<AppShell />} path="/m/:messageId" />
            <Route element={<AppShell />} path="/c/:conversationId/m/:messageId" />
          </Routes>
        </MemoryRouter>
      </AppProviders>,
    );
    await waitFor(
      () => {
        expect(useLayerStore.getState().layers[0]).toEqual(
          expect.objectContaining({ conversationId: "1", focusMessageId: "101" }),
        );
      },
      { timeout: 8_000 },
    );
  });

  it("ignores a missing message permalink", async () => {
    render(
      <AppProviders>
        <MemoryRouter initialEntries={["/m/0"]}>
          <Routes>
            <Route element={<AppShell />} path="/m/:messageId" />
          </Routes>
        </MemoryRouter>
      </AppProviders>,
    );
    expect(await screen.findByText(en.shell.chats)).toBeInTheDocument();
    await waitFor(() => {
      expect(useLayerStore.getState().layers).toEqual([]);
    });
  });

  it("shows the sign-in gate when no account is stored", () => {
    useAccountsStore.getState().removeAll();
    renderShell();
    expect(screen.getByRole("dialog", { name: en.auth.gate.aria })).toBeInTheDocument();
  });

  it("shows onboarding when the active account is not onboarded", () => {
    seedAccount(false);
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

  it("lets Escape close in-chat search before popping a layer", async () => {
    const user = userEvent.setup();
    Object.defineProperty(window, "innerWidth", {
      configurable: true,
      writable: true,
      value: 390,
    });
    renderShell();
    await user.click(await screen.findByText(ADA_DEMO.name));
    useSearchStore.getState().openChatSearch();
    expect(useSearchStore.getState().chatOpen).toBe(true);
    window.dispatchEvent(new KeyboardEvent("keydown", { key: SHORTCUTS.popLayer, bubbles: true }));
    expect(useSearchStore.getState().chatOpen).toBe(false);
    expect(useLayerStore.getState().layers).toHaveLength(1);
  });

  it("activates the account from a push deep-link query", async () => {
    seedAccount();
    seedAccount(true, 2, false);
    render(
      <AppProviders>
        <MemoryRouter initialEntries={["/c/1?account=2"]}>
          <Routes>
            <Route element={<AppShell />} path="/c/:conversationId" />
          </Routes>
        </MemoryRouter>
      </AppProviders>,
    );
    await waitFor(() => {
      expect(useAccountsStore.getState().activeAccountId).toBe(2);
    });
  });

  it("ignores a missing or invalid account query", () => {
    render(
      <AppProviders>
        <MemoryRouter initialEntries={["/c/1?account=nope"]}>
          <Routes>
            <Route element={<AppShell />} path="/c/:conversationId" />
          </Routes>
        </MemoryRouter>
      </AppProviders>,
    );
    expect(Number.isFinite(Number("nope"))).toBe(false);
  });
});
