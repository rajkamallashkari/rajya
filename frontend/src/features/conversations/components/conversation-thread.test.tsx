import { fireEvent, render, screen } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import { describe, expect, it } from "vitest";
import { ConversationThread } from "./conversation-thread";
import { ProfilePanel } from "./profile-panel";
import { AppProviders } from "@/app/providers";
import { ADA_DEMO } from "@/features/conversations/model/demo";
import { en } from "@/shared/lib/i18n/catalog";
import { SHORTCUTS } from "@/shared/lib/shortcuts/constants";
import { useLayerStore } from "@/shared/lib/navigation/layer-store";

describe("conversation layers", () => {
  it("sends, edits the last message, and opens the profile", async () => {
    const user = userEvent.setup();
    render(
      <AppProviders>
        <ConversationThread conversationId="ada" />
      </AppProviders>,
    );
    const field = screen.getByRole("textbox");
    await user.type(field, "hello");
    await user.keyboard("{Enter}");
    expect(screen.getByText("hello")).toBeInTheDocument();
    fireEvent.keyDown(field, { key: SHORTCUTS.editLast });
    expect(screen.getByText(en.composer.editing)).toBeInTheDocument();
    await user.click(screen.getByRole("button", { name: en.composer.dismiss_edit }));
    fireEvent.keyDown(field, { key: SHORTCUTS.editLast });
    await user.clear(field);
    await user.type(field, "edited");
    await user.keyboard("{Enter}");
    expect(screen.getByText("edited")).toBeInTheDocument();
    await user.click(screen.getByRole("button", { name: en.shell.open_profile }));
    expect(useLayerStore.getState().layers.some((layer) => layer.kind === "profile")).toBe(true);
  });

  it("returns nothing for unknown ids and skips edit when the draft is dirty", async () => {
    const { rerender } = render(
      <AppProviders>
        <ConversationThread conversationId="missing" />
      </AppProviders>,
    );
    expect(document.querySelector("[data-conversation-thread]")).toBeNull();
    rerender(
      <AppProviders>
        <ConversationThread conversationId="ada" />
      </AppProviders>,
    );
    rerender(
      <AppProviders>
        <ConversationThread conversationId="notes" />
      </AppProviders>,
    );
    fireEvent.keyDown(screen.getByRole("textbox"), { key: SHORTCUTS.editLast });
    expect(screen.queryByText(en.composer.editing)).toBeNull();
    rerender(
      <AppProviders>
        <ProfilePanel conversationId="missing" />
      </AppProviders>,
    );
    expect(document.querySelector("[data-profile-panel]")).toBeNull();
    rerender(
      <AppProviders>
        <ProfilePanel conversationId={ADA_DEMO.id} />
      </AppProviders>,
    );
    expect(screen.getByText(en.shell.profile_subtitle)).toBeInTheDocument();
  });
});
