import { render, screen } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import { afterEach, describe, expect, it, vi } from "vitest";
import { AppProviders } from "@/app/providers";
import { resetLayerStore, useLayerStore } from "@/shared/lib/navigation/layer-store";
import { AccountIdentityRow } from "@/shared/ui/account-identity-row";

const account = {
  avatar_url: "https://media.test/ada.webp",
  display_name: "Ada Lovelace",
  id: 7,
  kind: "human",
  username: "ada",
};

afterEach(resetLayerStore);

describe("AccountIdentityRow", () => {
  it("renders a noninteractive identity with optional meta and trailing content", () => {
    render(
      <AppProviders>
        <AccountIdentityRow account={account} meta="online" trailing={<span>admin</span>} />
      </AppProviders>,
    );

    expect(screen.queryByRole("button")).toBeNull();
    expect(screen.getByText("Ada Lovelace")).toBeInTheDocument();
    expect(screen.getByText("@ada")).toBeInTheDocument();
    expect(screen.getByText("online")).toBeInTheDocument();
    expect(screen.getByText("admin")).toBeInTheDocument();
  });

  it("uses the caller selection action without opening a profile", async () => {
    const user = userEvent.setup();
    const onSelect = vi.fn();
    render(
      <AppProviders>
        <AccountIdentityRow account={account} onSelect={onSelect} />
      </AppProviders>,
    );

    await user.click(screen.getByRole("button", { name: /Ada Lovelace.*@ada/ }));
    expect(onSelect).toHaveBeenCalledWith(account);
    expect(useLayerStore.getState().layers).toHaveLength(0);
  });

  it("opens the account profile and supports compact presentation", async () => {
    const user = userEvent.setup();
    render(
      <AppProviders>
        <AccountIdentityRow account={account} compact openProfile />
      </AppProviders>,
    );

    const action = screen.getByRole("button", { name: /Ada Lovelace/ });
    expect(screen.queryByText("@ada")).toBeNull();
    await user.click(action);
    expect(useLayerStore.getState().layers.at(-1)).toMatchObject({
      accountId: "7",
      id: "account:7",
      kind: "profile",
      title: "Ada Lovelace",
    });
  });
});
