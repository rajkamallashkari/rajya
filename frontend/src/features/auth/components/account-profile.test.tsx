import { render, screen } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import { beforeEach, describe, expect, it, vi } from "vitest";
import { AccountProfile } from "./account-profile";
import { AppProviders } from "@/app/providers";
import { en } from "@/shared/lib/i18n/catalog";

const fetchAccount = vi.fn();
const createBlock = vi.fn();
const destroyBlock = vi.fn();

vi.mock("@/features/auth/api/identity", () => ({
  fetchAccount: (...args: unknown[]) => fetchAccount(...args),
}));

vi.mock("@/features/auth/api/blocks", () => ({
  blockKeys: { list: () => ["blocks"] },
  createBlock: (...args: unknown[]) => createBlock(...args),
  destroyBlock: (...args: unknown[]) => destroyBlock(...args),
}));

function renderProfile(accountId: number, initiallyBlocked = false) {
  return render(
    <AppProviders>
      <AccountProfile accountId={accountId} initiallyBlocked={initiallyBlocked} />
    </AppProviders>,
  );
}

describe("AccountProfile", () => {
  beforeEach(() => {
    fetchAccount.mockReset();
    createBlock.mockReset();
    destroyBlock.mockReset();
  });

  it("renders a missing profile", async () => {
    fetchAccount.mockResolvedValue({ missing: true, account: null });
    renderProfile(9);
    expect(await screen.findByText(en.auth.profile.missing)).toBeInTheDocument();
  });

  it("blocks and unblocks a visible profile", async () => {
    const user = userEvent.setup();
    fetchAccount.mockResolvedValue({
      missing: false,
      account: {
        id: 2,
        display_name: "Grace",
        username: "grace",
        kind: "human",
        blocked_by_viewer: false,
      },
    });
    createBlock.mockResolvedValue({});
    destroyBlock.mockResolvedValue({});
    renderProfile(2);
    expect(await screen.findByText("Grace")).toBeInTheDocument();
    expect(screen.queryByText(en.bots.memory_disclosure)).toBeNull();
    await user.click(screen.getByRole("button", { name: en.auth.profile.block }));
    expect(createBlock).toHaveBeenCalledWith(2);
    expect(screen.getByText(en.auth.profile.blocked)).toBeInTheDocument();
    await user.click(screen.getByRole("button", { name: en.auth.profile.unblock }));
    expect(destroyBlock).toHaveBeenCalledWith(2);
  });

  it("swallows block failures", async () => {
    const user = userEvent.setup();
    fetchAccount.mockResolvedValue({
      missing: false,
      account: {
        id: 2,
        display_name: "Grace",
        username: "grace",
        kind: "human",
        blocked_by_viewer: false,
      },
    });
    createBlock.mockRejectedValue(new Error("nope"));
    const created = renderProfile(2);
    expect(await screen.findByText("Grace")).toBeInTheDocument();
    await user.click(screen.getByRole("button", { name: en.auth.profile.block }));
    expect(screen.getByRole("button", { name: en.auth.profile.block })).toBeInTheDocument();
    created.unmount();
    destroyBlock.mockRejectedValue(new Error("nope"));
    fetchAccount.mockResolvedValue({
      missing: false,
      account: {
        id: 2,
        display_name: "Grace",
        username: "grace",
        kind: "human",
        blocked_by_viewer: true,
      },
    });
    renderProfile(2, true);
    expect(await screen.findByText("Grace")).toBeInTheDocument();
    destroyBlock.mockRejectedValue(new Error("nope"));
    await user.click(screen.getByRole("button", { name: en.auth.profile.unblock }));
    expect(screen.getByRole("button", { name: en.auth.profile.unblock })).toBeInTheDocument();
  });

  it("shows the shared-memory line on a bot profile (DS-1)", async () => {
    fetchAccount.mockResolvedValue({
      missing: false,
      account: {
        id: 9,
        display_name: "Nimbus",
        username: "nimbus",
        kind: "bot",
        shared_memory: true,
        blocked_by_viewer: false,
      },
    });
    renderProfile(9);
    expect(await screen.findByText("Nimbus")).toBeInTheDocument();
    expect(screen.getByText(en.bots.memory_disclosure)).toBeInTheDocument();
  });
});
