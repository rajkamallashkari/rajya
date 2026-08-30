import { fireEvent, render, screen } from "@testing-library/react";
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
});
