import { render, screen } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import { MemoryRouter } from "react-router";
import { describe, expect, it } from "vitest";
import { ConversationList } from "./conversation-list";
import { AppProviders } from "@/app/providers";
import { ADA_DEMO, conversationById } from "@/features/conversations/model/demo";
import { en } from "@/shared/lib/i18n/catalog";
import { useLayerStore } from "@/shared/lib/navigation/layer-store";

describe("ConversationList", () => {
  it("filters, opens a conversation, and shows empty when nothing matches", async () => {
    const user = userEvent.setup();
    expect(conversationById("ada")).toEqual(ADA_DEMO);
    expect(conversationById("missing")).toBeUndefined();
    render(
      <AppProviders>
        <MemoryRouter>
          <ConversationList />
        </MemoryRouter>
      </AppProviders>,
    );
    expect(screen.getByText(en.shell.chats)).toBeInTheDocument();
    await user.click(screen.getByText(ADA_DEMO.name));
    expect(useLayerStore.getState().layers[0]?.kind).toBe("conversation");
    await user.type(screen.getByLabelText(en.search.label), "zzz");
    expect(screen.getByText(en.lists.empty_title)).toBeInTheDocument();
    await user.click(screen.getByRole("button", { name: en.lists.empty_action }));
  });

  it("renders loading and error statuses", () => {
    const { rerender } = render(
      <AppProviders>
        <MemoryRouter>
          <ConversationList status="loading" />
        </MemoryRouter>
      </AppProviders>,
    );
    expect(screen.getByRole("status")).toBeInTheDocument();
    rerender(
      <AppProviders>
        <MemoryRouter>
          <ConversationList onRetry={() => undefined} status="error" />
        </MemoryRouter>
      </AppProviders>,
    );
    expect(screen.getByText(en.lists.error_title)).toBeInTheDocument();
  });
});
