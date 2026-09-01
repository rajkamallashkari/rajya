import { render, screen } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import { describe, expect, it, vi } from "vitest";
import { JumpToLatestPill } from "./jump-to-latest-pill";
import { en } from "@/shared/lib/i18n/catalog";

describe("JumpToLatestPill", () => {
  it("shows the unread cap and jumps on click", async () => {
    const user = userEvent.setup();
    const onJump = vi.fn();
    render(<JumpToLatestPill count={12} onJump={onJump} />);
    await user.click(screen.getByRole("button", { name: en.conversations.jump_to_latest }));
    expect(onJump).toHaveBeenCalled();
    expect(screen.getByText("9+")).toBeInTheDocument();
  });
});
