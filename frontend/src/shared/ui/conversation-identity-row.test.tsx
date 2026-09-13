import { render, screen } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import { afterEach, describe, expect, it, vi } from "vitest";
import { AppProviders } from "@/app/providers";
import { resetLayerStore, useLayerStore } from "@/shared/lib/navigation/layer-store";
import {
  ConversationIdentityRow,
  type ConversationIdentity,
} from "@/shared/ui/conversation-identity-row";

const group: ConversationIdentity = {
  avatar_url: null,
  id: 9,
  kind: "group",
  member_count: 3,
  title: "Launch team",
};

afterEach(resetLayerStore);

describe("ConversationIdentityRow", () => {
  it("renders static group identity with metadata and fallback avatar", () => {
    render(
      <AppProviders>
        <ConversationIdentityRow
          conversation={group}
          meta="Tomorrow"
          trailing={<span>owner</span>}
        />
      </AppProviders>,
    );

    expect(screen.queryByRole("button")).toBeNull();
    expect(screen.getByText("Launch team")).toBeInTheDocument();
    expect(screen.getByText("3 members")).toBeInTheDocument();
    expect(screen.getByText("Tomorrow")).toBeInTheDocument();
    expect(screen.getByText("owner")).toBeInTheDocument();
  });

  it("opens a group conversation from a compact row", async () => {
    const user = userEvent.setup();
    render(
      <AppProviders>
        <ConversationIdentityRow compact conversation={group} openConversation />
      </AppProviders>,
    );

    await user.click(screen.getByRole("button", { name: "Launch team, 3 members" }));
    expect(useLayerStore.getState().layers.at(-1)).toMatchObject({
      conversationId: "9",
      kind: "conversation",
      title: "Launch team",
    });
  });

  it("delegates direct peer presentation and selection to the account row", async () => {
    const user = userEvent.setup();
    const onSelect = vi.fn();
    const direct: ConversationIdentity = {
      id: 4,
      kind: "direct",
      member_count: 2,
      peer: { display_name: "Ada", id: 7, kind: "human", username: "ada" },
    };
    const { rerender } = render(
      <AppProviders>
        <ConversationIdentityRow conversation={direct} onSelect={onSelect} />
      </AppProviders>,
    );

    await user.click(screen.getByRole("button", { name: /Ada.*@ada/ }));
    expect(onSelect).toHaveBeenCalledWith(direct);

    rerender(
      <AppProviders>
        <ConversationIdentityRow compact conversation={direct} />
      </AppProviders>,
    );
    expect(screen.queryByRole("button")).toBeNull();
  });
});
