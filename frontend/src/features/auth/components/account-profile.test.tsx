import { render, screen } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import { beforeEach, describe, expect, it, vi } from "vitest";
import { AccountProfile } from "./account-profile";
import { en } from "@/shared/lib/i18n/catalog";

const fetchAccount = vi.fn();
const createBlock = vi.fn();
const destroyBlock = vi.fn();

vi.mock("@/features/auth/api/identity", () => ({
  fetchAccount: (...args: unknown[]) => fetchAccount(...args),
}));

vi.mock("@/features/auth/api/blocks", () => ({
  createBlock: (...args: unknown[]) => createBlock(...args),
  destroyBlock: (...args: unknown[]) => destroyBlock(...args),
}));

describe("AccountProfile", () => {
  beforeEach(() => {
    fetchAccount.mockReset();
    createBlock.mockReset();
    destroyBlock.mockReset();
  });

  it("renders a missing profile", async () => {
    fetchAccount.mockResolvedValue({ missing: true, account: null });
    render(<AccountProfile accountId={9} />);
    expect(await screen.findByText(en.auth.profile.missing)).toBeInTheDocument();
  });

  it("blocks and unblocks a visible profile", async () => {
    const user = userEvent.setup();
    fetchAccount.mockResolvedValue({
      missing: false,
      account: { id: 2, display_name: "Grace", username: "grace", kind: "human" },
    });
    createBlock.mockResolvedValue({});
    destroyBlock.mockResolvedValue({});
    render(<AccountProfile accountId={2} />);
    expect(await screen.findByText("Grace")).toBeInTheDocument();
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
      account: { id: 2, display_name: "Grace", username: "grace", kind: "human" },
    });
    createBlock.mockRejectedValue(new Error("nope"));
    const created = render(<AccountProfile accountId={2} />);
    expect(await screen.findByText("Grace")).toBeInTheDocument();
    await user.click(screen.getByRole("button", { name: en.auth.profile.block }));
    expect(screen.getByRole("button", { name: en.auth.profile.block })).toBeInTheDocument();
    created.unmount();
    destroyBlock.mockRejectedValue(new Error("nope"));
    render(<AccountProfile accountId={2} initiallyBlocked />);
    expect(await screen.findByText("Grace")).toBeInTheDocument();
    destroyBlock.mockRejectedValue(new Error("nope"));
    await user.click(screen.getByRole("button", { name: en.auth.profile.unblock }));
    expect(screen.getByRole("button", { name: en.auth.profile.unblock })).toBeInTheDocument();
  });
});
