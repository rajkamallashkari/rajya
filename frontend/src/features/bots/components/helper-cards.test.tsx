import { render, screen } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import { describe, expect, it, vi } from "vitest";
import { SmartReplyChips, SummarizeCard, TranslationCard } from "./helper-cards";
import { en } from "@/shared/lib/i18n/catalog";

describe("AI helper cards", () => {
  it("returns nothing without suggestions and picks a chip", async () => {
    const user = userEvent.setup();
    const onPick = vi.fn();
    const { rerender } = render(<SmartReplyChips onPick={onPick} suggestions={[]} />);
    expect(document.querySelector("[data-smart-reply-chips]")).toBeNull();
    rerender(<SmartReplyChips onPick={onPick} suggestions={["On my way"]} />);
    await user.click(screen.getByRole("button", { name: "On my way" }));
    expect(onPick).toHaveBeenCalledWith("On my way");
  });

  it("shows a translation and summarizes unread", async () => {
    const user = userEvent.setup();
    const onSummarize = vi.fn();
    render(<TranslationCard text="Hello" />);
    expect(screen.getByText("Hello")).toBeInTheDocument();
    const pending = render(<SummarizeCard onSummarize={onSummarize} pending text="Ship Friday" />);
    expect(screen.getByText("Ship Friday")).toBeInTheDocument();
    expect(screen.getByRole("button", { name: en.ai.summarize })).toBeDisabled();
    pending.unmount();
    render(<SummarizeCard onSummarize={onSummarize} />);
    await user.click(screen.getByRole("button", { name: en.ai.summarize }));
    expect(onSummarize).toHaveBeenCalled();
  });
});
