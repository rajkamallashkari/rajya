import { act, render, screen, waitFor } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import { MemoryRouter, Route, Routes } from "react-router";
import { afterEach, beforeEach, describe, expect, it } from "vitest";
import { AppProviders } from "@/app/providers";
import { AppShell } from "@/app/shell";
import { useAccountsStore } from "@/features/auth/store/accounts-store";
import { resetShellStore, useShellStore } from "@/features/settings/store/shell-store";
import { ADA_DEMO } from "@/features/conversations/model/demo";
import { messagingStore } from "@/shared/lib/api/msw/messaging-store";
import { en } from "@/shared/lib/i18n/catalog";
import { SHORTCUTS } from "@/shared/lib/shortcuts/constants";
import { settingsLayer, useLayerStore } from "@/shared/lib/navigation/layer-store";
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
    resetShellStore();
  });
  it("renders the chat list, impersonation banner, shortcuts, and profile tab", async () => {
    const user = userEvent.setup();
    Object.defineProperty(window, "innerWidth", {
      configurable: true,
      writable: true,
      value: 1280,
    });
    useShellStore.setState({ impersonatingName: "Ada" });
    renderShell();
    await waitFor(() => {
      expect(document.querySelector("[data-conversation-thread]")).not.toBeNull();
    });
    expect(screen.getByAltText(en.brand.logo_alt)).toBeInTheDocument();
    expect(screen.queryByRole("link", { name: en.app.gallery })).toBeNull();
    expect(screen.queryByRole("link", { name: en.app.accounts })).toBeNull();
    expect(screen.getByRole("alert")).toHaveTextContent("Ada");
    expect(screen.queryByRole("dialog")).toBeNull();
    await user.click(screen.getByRole("button", { name: en.shell.profile }));
    await user.click(screen.getByRole("button", { name: en.shell.settings }));
    await waitFor(() => {
      expect(document.querySelector("[data-settings-panel]")).not.toBeNull();
    });
    await user.click(screen.getByRole("button", { name: en.shell.back }));
    await waitFor(() => {
      expect(useShellStore.getState().profileSettingsOpen).toBe(false);
    });
    await user.click(screen.getByRole("button", { name: en.shell.chats }));
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
    expect(await screen.findByRole("navigation", { name: en.shell.tabs_aria })).toBeInTheDocument();
    await waitFor(() => {
      expect(useLayerStore.getState().layers).toEqual([]);
    });
  });

  it("hides primary tabs until the account is signed in and onboarded", () => {
    useAccountsStore.getState().removeAll();
    renderShell();
    expect(screen.getByRole("dialog", { name: en.auth.gate.aria })).toBeInTheDocument();
    expect(screen.queryByRole("navigation", { name: en.shell.tabs_aria })).toBeNull();
  });

  it("shows onboarding when the active account is not onboarded", () => {
    seedAccount(false);
    renderShell();
    expect(screen.getByRole("dialog", { name: en.auth.onboarding.aria })).toBeInTheDocument();
    expect(screen.queryByRole("navigation", { name: en.shell.tabs_aria })).toBeNull();
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

  it("keeps destinations exclusive on the desktop rail", async () => {
    const user = userEvent.setup();
    Object.defineProperty(window, "innerWidth", {
      configurable: true,
      writable: true,
      value: 1280,
    });
    renderShell();
    expect(screen.getByRole("navigation", { name: en.shell.tabs_aria })).toHaveAttribute(
      "data-primary-nav",
      "rail",
    );
    expect(document.querySelector("[data-conversation-list]")).not.toBeNull();
    await user.click(screen.getByRole("button", { name: en.shell.calls }));
    expect(screen.getByRole("region", { name: en.shell.calls })).toBeInTheDocument();
    expect(document.querySelector("[data-conversation-list]")).toBeNull();
    expect(screen.queryByRole("region", { name: en.shell.profile })).toBeNull();
    await user.click(screen.getByRole("button", { name: en.shell.profile }));
    expect(screen.getByRole("region", { name: en.shell.profile })).toBeInTheDocument();
    expect(screen.queryByRole("region", { name: en.shell.calls })).toBeNull();
    expect(document.querySelector("[data-conversation-list]")).toBeNull();
    await user.click(screen.getByRole("button", { name: en.shell.chats }));
    expect(document.querySelector("[data-conversation-list]")).not.toBeNull();
  });

  it("shows a full-width mobile bar only on the tab root", async () => {
    const user = userEvent.setup();
    Object.defineProperty(window, "innerWidth", {
      configurable: true,
      writable: true,
      value: 390,
    });
    renderShell();
    expect(screen.getByRole("navigation", { name: en.shell.tabs_aria })).toHaveAttribute(
      "data-primary-nav",
      "bar",
    );
    expect(document.querySelector("[data-primary-nav='rail']")).toBeNull();
    await user.click(await screen.findByText(ADA_DEMO.name));
    expect(useLayerStore.getState().layers).toHaveLength(1);
    expect(screen.queryByRole("navigation", { name: en.shell.tabs_aria })).toBeNull();
    act(() => {
      useLayerStore.getState().popLayer();
    });
    expect(useLayerStore.getState().layers).toHaveLength(0);
    expect(screen.getByRole("navigation", { name: en.shell.tabs_aria })).toHaveAttribute(
      "data-primary-nav",
      "bar",
    );
    await user.click(await screen.findByText(ADA_DEMO.name));
    expect(screen.queryByRole("navigation", { name: en.shell.tabs_aria })).toBeNull();
    act(() => {
      useShellStore.getState().setDestination("calls");
    });
    expect(screen.getByRole("navigation", { name: en.shell.tabs_aria })).toHaveAttribute(
      "data-primary-nav",
      "bar",
    );
    expect(screen.queryByRole("region", { name: en.shell.profile })).toBeNull();
    expect(document.querySelector("[data-conversation-list]")).toBeNull();
    await user.click(screen.getByRole("button", { name: en.shell.profile }));
    expect(await screen.findByRole("region", { name: en.shell.profile })).toBeInTheDocument();
    await user.click(screen.getByRole("button", { name: en.shell.settings }));
    expect(screen.queryByRole("navigation", { name: en.shell.tabs_aria })).toBeNull();
    window.dispatchEvent(new KeyboardEvent("keydown", { key: SHORTCUTS.popLayer, bubbles: true }));
    await waitFor(() => {
      expect(screen.getByRole("navigation", { name: en.shell.tabs_aria })).toBeInTheDocument();
    });
  });

  it("does not auto-open a chat while another destination is showing", async () => {
    Object.defineProperty(window, "innerWidth", {
      configurable: true,
      writable: true,
      value: 1280,
    });
    useShellStore.setState({ destination: "calls" });
    renderShell();
    expect(await screen.findByRole("region", { name: en.shell.calls })).toBeInTheDocument();
    expect(document.querySelector("[data-call-overlays]")).not.toBeNull();
    await waitFor(() => {
      expect(useLayerStore.getState().layers).toEqual([]);
    });
  });

  it("pops the Calls contact overlay without opening self profile", async () => {
    useShellStore.setState({
      callsContact: { accountId: "2", conversationId: "1" },
      destination: "calls",
    });
    renderShell();
    expect(await screen.findByRole("region", { name: en.shell.calls })).toBeInTheDocument();
    await waitFor(() => {
      expect(document.querySelector("[data-account-profile]")).not.toBeNull();
    });
    expect(document.querySelector("[data-profile-pane]")).toBeNull();
    window.dispatchEvent(new KeyboardEvent("keydown", { key: SHORTCUTS.popLayer, bubbles: true }));
    await waitFor(() => {
      expect(useShellStore.getState().callsContact).toBeNull();
    });
  });

  it("keeps list plus empty welcome and overlays settings on Profile", async () => {
    const user = userEvent.setup();
    messagingStore().conversations.splice(0);
    Object.defineProperty(window, "innerWidth", {
      configurable: true,
      writable: true,
      value: 1280,
    });
    renderShell();
    expect(await screen.findByText(en.shell.welcome_title)).toBeInTheDocument();
    expect(document.querySelector("[data-conversation-list]")).not.toBeNull();
    expect(document.querySelector("[data-conversation-thread]")).toBeNull();
    act(() => {
      useLayerStore.getState().pushLayer(settingsLayer(en.shell.settings));
    });
    expect(await screen.findByText(en.settings.appearance)).toBeInTheDocument();
    act(() => {
      useLayerStore.getState().popLayer();
    });
    await user.click(screen.getByRole("button", { name: en.shell.profile }));
    expect(await screen.findByRole("region", { name: en.shell.profile })).toHaveAttribute(
      "data-profile-pane",
      "",
    );
    await user.click(screen.getByRole("button", { name: en.shell.settings }));
    await waitFor(() => {
      expect(document.querySelector("[data-settings-panel]")).not.toBeNull();
    });
    expect(document.querySelector("[data-profile-pane]")).not.toBeNull();
    expect(document.querySelector("[data-layer-column='overlay']")).not.toBeNull();
    expect(document.querySelector("[data-conversation-list]")).toBeNull();
  });

  it("opens New message and New group layers from the compose menu", async () => {
    const user = userEvent.setup({ pointerEventsCheck: 0 });
    Object.defineProperty(window, "innerWidth", {
      configurable: true,
      writable: true,
      value: 1280,
    });
    renderShell();
    await user.click(screen.getByRole("button", { name: en.compose.new_conversation }));
    await user.click(await screen.findByRole("menuitem", { name: en.compose.message }));
    expect(await screen.findByLabelText(en.compose.search)).toBeInTheDocument();
    expect(document.querySelector("[data-compose-panel='message']")).not.toBeNull();
    await user.click(screen.getByRole("button", { name: en.shell.back }));
    await user.click(screen.getByRole("button", { name: en.compose.new_conversation }));
    await user.click(await screen.findByRole("menuitem", { name: en.compose.group }));
    expect(document.querySelector("[data-compose-panel='group']")).not.toBeNull();
  });

  it("restores the last conversation when returning from Calls", async () => {
    const user = userEvent.setup();
    Object.defineProperty(window, "innerWidth", {
      configurable: true,
      writable: true,
      value: 1280,
    });
    renderShell();
    await waitFor(() => {
      expect(useLayerStore.getState().layers).toEqual([
        expect.objectContaining({ conversationId: "1", kind: "conversation" }),
      ]);
    });
    await user.click(screen.getByRole("button", { name: en.shell.calls }));
    expect(document.querySelector("[data-conversation-list]")).toBeNull();
    expect(useLayerStore.getState().layers).toEqual([
      expect.objectContaining({ conversationId: "1", kind: "conversation" }),
    ]);
    await user.click(screen.getByRole("button", { name: en.shell.chats }));
    expect(document.querySelector("[data-conversation-list]")).not.toBeNull();
    expect(document.querySelector("[data-conversation-thread]")).not.toBeNull();
    expect(useLayerStore.getState().layers).toEqual([
      expect.objectContaining({ conversationId: "1", kind: "conversation" }),
    ]);
  });
});
