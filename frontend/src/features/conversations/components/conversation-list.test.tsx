import { fireEvent, render, screen, within } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import { useQueryClient } from "@tanstack/react-query";
import { http, HttpResponse } from "msw";
import { useEffect, type ReactNode } from "react";
import { MemoryRouter } from "react-router";
import { describe, expect, it } from "vitest";
import { ConversationList } from "./conversation-list";
import { AppProviders } from "@/app/providers";
import {
  ADA_DEMO,
  conversationById,
  latestDemoConversation,
} from "@/features/conversations/model/demo";
import { TYPING_KEY_TTL_MS } from "@/features/conversations/model/typing";
import { en } from "@/shared/lib/i18n/catalog";
import { useLayerStore } from "@/shared/lib/navigation/layer-store";
import { realtimeKeys } from "@/shared/lib/realtime/keys";
import { server } from "@/test/msw";

function SeedTyping({ children }: { children: ReactNode }): ReactNode {
  const client = useQueryClient();
  useEffect(() => {
    client.setQueryData(realtimeKeys.typing(1), [
      {
        accountId: 9,
        activity: "recording_audio",
        displayName: "Priya",
        expiresAt: Date.now() + TYPING_KEY_TTL_MS,
      },
    ]);
  }, [client]);
  return children;
}

describe("ConversationList", () => {
  it("keeps demo helpers for the gallery path", () => {
    expect(conversationById("ada")).toEqual(ADA_DEMO);
    expect(latestDemoConversation()).toBe(ADA_DEMO);
    expect(conversationById("missing")).toBeUndefined();
    expect(conversationById("sent-only")?.name).toBe("Solo");
  });

  it("filters, opens a conversation, and shows empty when nothing matches", async () => {
    const user = userEvent.setup();
    render(
      <AppProviders>
        <MemoryRouter>
          <ConversationList />
        </MemoryRouter>
      </AppProviders>,
    );
    expect(screen.getByText(en.shell.chats)).toBeInTheDocument();
    await user.click(screen.getByRole("button", { name: en.search.filters }));
    expect(screen.getByText(en.search.filters_clear)).toBeInTheDocument();
    await user.keyboard("{Escape}");
    await user.click(await screen.findByText(ADA_DEMO.name));
    expect(useLayerStore.getState().layers[0]).toEqual(
      expect.objectContaining({ conversationId: "1", kind: "conversation" }),
    );
    useLayerStore.getState().pushLayer({
      conversationId: "1",
      id: "profile:1",
      kind: "profile",
      title: "Ada",
    });
    await user.click(screen.getByText("Team"));
    expect(useLayerStore.getState().layers).toEqual([
      expect.objectContaining({ conversationId: "2", kind: "conversation" }),
    ]);
    await user.type(screen.getByLabelText(en.search.label), "zzz");
    expect(screen.getByText(en.lists.empty_title)).toBeInTheDocument();
    await user.click(screen.getByRole("button", { name: en.lists.empty_action }));
  });

  it("pins and marks a conversation unread from the row menu", async () => {
    const user = userEvent.setup({ pointerEventsCheck: 0 });
    render(
      <AppProviders>
        <MemoryRouter>
          <ConversationList />
        </MemoryRouter>
      </AppProviders>,
    );
    const row = (await screen.findByText("Team")).closest("[data-chat-list-item]") as HTMLElement;
    const surface = row.querySelector("[style]") as HTMLElement;
    fireEvent.contextMenu(surface);
    await user.click(screen.getByRole("menuitem", { name: en.conversations.pin }));
    const rowAfter = (await screen.findByText("Team")).closest("[data-chat-list-item]") as HTMLElement;
    fireEvent.contextMenu(rowAfter.querySelector("[style]") as HTMLElement);
    await user.click(screen.getByRole("menuitem", { name: en.conversations.mark_unread }));
    const ada = (await screen.findByText(ADA_DEMO.name)).closest("[data-chat-list-item]") as HTMLElement;
    fireEvent.contextMenu(ada.querySelector("[style]") as HTMLElement);
    await user.click(screen.getByRole("menuitem", { name: en.conversations.mark_read }));
  });

  it("renders loading then error with retry", async () => {
    const user = userEvent.setup();
    server.use(
      http.get("*/api/v1/conversations", () =>
        HttpResponse.json(
          { error: { code: "server", message: "fail", details: {} } },
          { status: 500 },
        ),
      ),
    );
    render(
      <AppProviders>
        <MemoryRouter>
          <ConversationList />
        </MemoryRouter>
      </AppProviders>,
    );
    expect(await screen.findByText(en.lists.error_title)).toBeInTheDocument();
    server.resetHandlers();
    await user.click(screen.getByRole("button", { name: en.lists.error_retry }));
    expect(await screen.findByText(ADA_DEMO.name)).toBeInTheDocument();
  });

  it("overlays live activity on the chat list preview", async () => {
    render(
      <AppProviders>
        <MemoryRouter>
          <SeedTyping>
            <ConversationList />
          </SeedTyping>
        </MemoryRouter>
      </AppProviders>,
    );
    expect(await screen.findByText(en.conversations.activity.recording_audio)).toBeInTheDocument();
  });

  it("filters by folder tabs, archives, and creates a folder", async () => {
    const user = userEvent.setup({ pointerEventsCheck: 0 });
    render(
      <AppProviders>
        <MemoryRouter>
          <ConversationList />
        </MemoryRouter>
      </AppProviders>,
    );
    expect(await screen.findByText(ADA_DEMO.name)).toBeInTheDocument();
    await user.click(screen.getByRole("tab", { name: en.conversations.folders.unread }));
    expect(screen.getByText(ADA_DEMO.name)).toBeInTheDocument();
    expect(screen.queryByText("Team")).toBeNull();
    await user.click(screen.getByRole("tab", { name: "Work" }));
    expect(await screen.findByText("Team")).toBeInTheDocument();
    expect(screen.queryByText(ADA_DEMO.name)).toBeNull();
    await user.click(screen.getByRole("tab", { name: en.conversations.folders.all }));
    const team = (await screen.findByText("Team")).closest("[data-chat-list-item]") as HTMLElement;
    fireEvent.contextMenu(team.querySelector("[style]") as HTMLElement);
    await user.click(screen.getByRole("menuitem", { name: en.conversations.archive }));
    await user.click(screen.getByRole("tab", { name: en.conversations.folders.archived }));
    expect(await screen.findByText("Team")).toBeInTheDocument();
    const archivedRow = (await screen.findByText("Team")).closest("[data-chat-list-item]") as HTMLElement;
    fireEvent.contextMenu(archivedRow.querySelector("[style]") as HTMLElement);
    await user.click(screen.getByRole("menuitem", { name: en.conversations.unarchive }));
    await user.click(screen.getByRole("tab", { name: en.conversations.folders.all }));
    expect(await screen.findByText("Team")).toBeInTheDocument();
    await user.click(screen.getByRole("button", { name: en.conversations.folders.create }));
    await user.type(screen.getByLabelText(en.conversations.folders.name), "Home");
    await user.click(screen.getByRole("button", { name: en.conversations.folders.save }));
    expect(await screen.findByRole("tab", { name: "Home" })).toBeInTheDocument();
    const workTab = screen.getByRole("tab", { name: "Work" });
    const homeTab = screen.getByRole("tab", { name: "Home" });
    const data = {
      getData: () => "1",
      setData: () => undefined,
    };
    fireEvent.dragStart(workTab, { dataTransfer: data });
    fireEvent.drop(homeTab, { dataTransfer: data });
    const ada = (await screen.findByText(ADA_DEMO.name)).closest("[data-chat-list-item]") as HTMLElement;
    fireEvent.contextMenu(ada.querySelector("[style]") as HTMLElement);
    await user.click(screen.getByRole("menuitem", { name: en.conversations.mute_1h }));
    fireEvent.contextMenu(
      (await screen.findByText(ADA_DEMO.name)).closest("[data-chat-list-item]")!.querySelector("[style]") as HTMLElement,
    );
    await user.click(screen.getByRole("menuitem", { name: "Work" }));
    await user.click(screen.getByRole("tab", { name: "Work" }));
    await user.click(screen.getByRole("button", { name: en.conversations.folders.delete }));
    expect(await screen.findByRole("tab", { name: en.conversations.folders.all })).toHaveAttribute(
      "aria-selected",
      "true",
    );
  });

  it("opens people and message hits from global search", async () => {
    const user = userEvent.setup({ pointerEventsCheck: 0 });
    render(
      <AppProviders>
        <MemoryRouter>
          <ConversationList />
        </MemoryRouter>
      </AppProviders>,
    );
    const field = screen.getByLabelText(en.search.label);
    await user.type(field, "Adele");
    expect(await screen.findByText(en.search.people)).toBeInTheDocument();
    const people = screen.getByText(en.search.people).closest("section");
    await user.click(within(people as HTMLElement).getByRole("button", { name: "Adele Goldberg" }));
    expect(useLayerStore.getState().layers.some((layer) => layer.kind === "profile")).toBe(true);
    const chats = screen.getByText(en.search.conversations).closest("section");
    await user.click(within(chats as HTMLElement).getByRole("button", { name: "Adele Goldberg" }));
    expect(useLayerStore.getState().layers[0]).toEqual(
      expect.objectContaining({ conversationId: "15", kind: "conversation" }),
    );
    await user.click(within(people as HTMLElement).getByRole("button", { name: "Adele Goldberg" }));
    await user.clear(field);
    await user.type(field, "memento");
    expect(await screen.findByText(en.search.messages)).toBeInTheDocument();
    await user.click(screen.getByRole("button", { name: /unique/i }));
    expect(useLayerStore.getState().layers[0]).toEqual(
      expect.objectContaining({ conversationId: "15", focusMessageId: expect.any(String) }),
    );
  });
});
