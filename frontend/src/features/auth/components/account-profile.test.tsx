import { act, render, renderHook, screen } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import { beforeEach, describe, expect, it, vi } from "vitest";
import { AccountProfile, useAccountProfile } from "./account-profile";
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

function wrapper({ children }: { children: React.ReactNode }) {
  return <AppProviders>{children}</AppProviders>;
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

  it("ignores a profile response after unmounting", async () => {
    let resolveAccount!: (value: {
      missing: false;
      account: {
        blocked_by_viewer: false;
        display_name: string;
        id: number;
        kind: "human";
        username: string;
      };
    }) => void;
    fetchAccount.mockReturnValue(
      new Promise((resolve) => {
        resolveAccount = resolve;
      }),
    );
    const profile = renderProfile(2);

    profile.unmount();
    await act(async () => {
      resolveAccount({
        missing: false,
        account: {
          blocked_by_viewer: false,
          display_name: "Late",
          id: 2,
          kind: "human",
          username: "late",
        },
      });
      await Promise.resolve();
    });

    expect(screen.queryByText("Late")).toBeNull();
  });

  it("does not issue block requests without an account", async () => {
    const { result } = renderHook(() => useAccountProfile(null), { wrapper });

    await act(() => result.current.onToggle());

    expect(createBlock).not.toHaveBeenCalled();
    expect(destroyBlock).not.toHaveBeenCalled();
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
        bio: "Read https://example.com/about",
        blocked_by_viewer: false,
        email: "grace@example.com",
        phone: "+12025550147",
      },
    });
    createBlock.mockResolvedValue({});
    destroyBlock.mockResolvedValue({});
    renderProfile(2);
    expect(await screen.findByText("Grace")).toBeInTheDocument();
    expect(screen.getByText("@grace")).toBeInTheDocument();
    expect(screen.getByRole("link", { name: "https://example.com/about" })).toHaveAttribute(
      "target",
      "_blank",
    );
    expect(screen.getByText("grace@example.com")).toBeInTheDocument();
    expect(screen.getByText("+12025550147")).toBeInTheDocument();
    const identity = document.querySelector("[data-account-identity]");
    expect(identity).toHaveClass("items-center", "text-center", "min-w-0");
    expect(screen.getByText("@grace")).toHaveClass("break-words");
    expect(screen.getByText("grace@example.com").closest("p")).toHaveClass("break-words");
    expect(
      screen.getByRole("link", { name: "https://example.com/about" }).closest("p"),
    ).toHaveClass("break-words");
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
