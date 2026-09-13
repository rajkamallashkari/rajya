import { render, screen } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import { describe, expect, it, vi } from "vitest";
import { PinnedMessageBanner } from "./pinned-message-banner";

const message = {
  body: "Keep this",
  client_nonce: null,
  conversation_id: 1,
  created_at: "2026-09-13T00:00:00Z",
  deleted: false,
  id: 10,
  kind: "text",
  position: 1,
  revision: 1,
  sender: { display_name: "Ada", id: 2, kind: "human", username: "ada" },
  silent: false,
};

describe("PinnedMessageBanner", () => {
  it("jumps, cycles multiple pins, and unpins when authorized", async () => {
    const user = userEvent.setup();
    const onJump = vi.fn();
    const onUnpin = vi.fn();
    const { rerender } = render(
      <PinnedMessageBanner
        canUnpin
        onJump={onJump}
        onUnpin={onUnpin}
        pins={[
          { message, message_id: 10 },
          { message: { ...message, body: "Latest", id: 11 }, message_id: 11 },
        ]}
        viewerId={2}
      />,
    );
    expect(screen.getByText("Pinned message 2/2")).toHaveClass("sr-only");
    expect(document.querySelector("[data-pinned-message-banner]")).toHaveAttribute(
      "data-side",
      "sent",
    );
    expect(document.querySelector("time")).toHaveAttribute("datetime", message.created_at);
    await user.click(screen.getByRole("button", { name: "Jump to pinned message" }));
    expect(onJump).toHaveBeenCalledWith(11);
    await user.click(screen.getByRole("button", { name: "Previous pinned message" }));
    expect(screen.getByText("Pinned message 1/2")).toBeInTheDocument();
    await user.click(screen.getByRole("button", { name: "Unpin message" }));
    expect(onUnpin).toHaveBeenCalledWith(10);
    expect(onJump).toHaveBeenCalledTimes(1);
    await user.click(screen.getByRole("button", { name: "Next pinned message" }));
    expect(screen.getByText("Pinned message 2/2")).toBeInTheDocument();

    rerender(
      <PinnedMessageBanner
        canUnpin={false}
        onJump={onJump}
        onUnpin={onUnpin}
        pins={[{ message: { ...message, body: "", sender: undefined }, message_id: 10 }]}
        viewerId={2}
      />,
    );
    expect(screen.getByText("Attachment")).toBeInTheDocument();
    expect(screen.queryByRole("button", { name: "Unpin message" })).toBeNull();

    rerender(<PinnedMessageBanner canUnpin onJump={onJump} onUnpin={onUnpin} pins={[]} />);
    expect(document.querySelector("[data-pinned-message-banner]")).toBeNull();
  });
});
