import { render, screen } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import { describe, expect, it, vi } from "vitest";
import { StreamingBubble } from "./streaming-bubble";
import { en } from "@/shared/lib/i18n/catalog";

describe("StreamingBubble", () => {
  it("shows dots until text arrives, then markdown and cancel", async () => {
    const user = userEvent.setup();
    const onCancel = vi.fn();
    const { rerender } = render(
      <StreamingBubble onCancel={onCancel} senderName={en.gallery.messages.sender} text="" />,
    );
    expect(
      screen.getByRole("status", { name: en.messages.generation.streaming }),
    ).toBeInTheDocument();
    expect(document.querySelectorAll(".typing-dot")).toHaveLength(3);
    rerender(
      <StreamingBubble
        onCancel={onCancel}
        senderName={en.gallery.messages.sender}
        text="Hello **bot**"
      />,
    );
    expect(screen.getByText("bot")).toBeInTheDocument();
    await user.click(screen.getByRole("button", { name: en.messages.generation.cancel }));
    expect(onCancel).toHaveBeenCalled();
  });
});
