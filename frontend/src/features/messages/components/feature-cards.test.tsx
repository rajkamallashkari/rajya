import { render, screen } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import { describe, expect, it, vi } from "vitest";
import { ReactionDetailsSheet } from "./reaction-details-sheet";
import { SelectionToolbar } from "./selection-toolbar";
import { LocationCard } from "./location-card";
import { ContactCard } from "./contact-card";
import { TranscriptBlock } from "./transcript-block";
import { en } from "@/shared/lib/i18n/catalog";

describe("ReactionDetailsSheet", () => {
  it("groups reactions and falls back when the tab disappears", async () => {
    const user = userEvent.setup({ pointerEventsCheck: 0 });
    const { rerender } = render(
      <ReactionDetailsSheet
        onOpenChange={vi.fn()}
        open
        reactions={[
          { accountId: "1", emoji: "👍", name: "Ada" },
          { accountId: "2", emoji: "❤️", name: "Priya" },
        ]}
      />,
    );
    await user.click(
      screen.getByRole("tab", {
        name: en.reactions.count.replace("{{emoji}}", "❤️").replace("{{count}}", "1"),
      }),
    );
    rerender(
      <ReactionDetailsSheet
        onOpenChange={vi.fn()}
        open
        reactions={[{ accountId: "1", emoji: "🎉", name: "Ada" }]}
      />,
    );
    expect(screen.getByText("Ada")).toBeInTheDocument();
    rerender(<ReactionDetailsSheet onOpenChange={vi.fn()} open reactions={[]} />);
    expect(screen.getByText(en.reactions.empty)).toBeInTheDocument();
  });
});

describe("SelectionToolbar", () => {
  it("hides when empty and fires bulk actions", async () => {
    const user = userEvent.setup({ pointerEventsCheck: 0 });
    const handlers = {
      onClear: vi.fn(),
      onCopy: vi.fn(),
      onDelete: vi.fn(),
      onForward: vi.fn(),
      onSave: vi.fn(),
      onSelectAll: vi.fn(),
    };
    const { rerender } = render(<SelectionToolbar count={0} {...handlers} />);
    expect(screen.queryByRole("toolbar")).toBeNull();
    rerender(<SelectionToolbar count={2} {...handlers} />);
    await user.click(screen.getByRole("button", { name: en.selection.clear }));
    await user.click(screen.getByRole("button", { name: en.selection.copy }));
    await user.click(screen.getByRole("button", { name: en.selection.forward }));
    await user.click(screen.getByRole("button", { name: en.selection.save }));
    await user.click(screen.getByRole("button", { name: en.selection.delete }));
    await user.click(screen.getByRole("button", { name: en.selection.select_all }));
    expect(handlers.onSelectAll).toHaveBeenCalled();
    rerender(<SelectionToolbar count={2} restrictForwarding {...handlers} />);
    expect(screen.queryByRole("button", { name: en.selection.copy })).toBeNull();
    expect(screen.queryByRole("button", { name: en.selection.forward })).toBeNull();
  });
});

describe("cards", () => {
  it("renders location, contact, and transcript states", async () => {
    const user = userEvent.setup({ pointerEventsCheck: 0 });
    const onOpen = vi.fn();
    const { rerender } = render(
      <LocationCard
        location={{ accuracyM: 8, label: "Gate", latitude: 1, longitude: 2 }}
        onOpen={onOpen}
      />,
    );
    await user.click(screen.getByRole("button", { name: en.location.open }));
    expect(onOpen).toHaveBeenCalled();
    rerender(
      <LocationCard location={{ accuracyM: null, label: null, latitude: 0, longitude: 0 }} />,
    );
    expect(screen.getByText(en.location.attribution)).toBeInTheDocument();

    const onMessage = vi.fn();
    const onProfile = vi.fn();
    rerender(
      <ContactCard
        contact={{
          contactAccountId: "9",
          displayName: "Ada",
          email: "a@b.c",
          phone: "1",
        }}
        onMessage={onMessage}
        onOpenProfile={onProfile}
      />,
    );
    await user.click(screen.getByRole("button", { name: en.contact.open_profile }));
    await user.click(screen.getByRole("button", { name: en.contact.message }));
    rerender(
      <ContactCard
        contact={{ contactAccountId: null, displayName: "Ext", email: null, phone: null }}
      />,
    );
    expect(screen.queryByRole("button", { name: en.contact.open_profile })).toBeNull();

    rerender(<TranscriptBlock language={null} status="pending" text={null} />);
    expect(screen.getByText(en.transcript.pending)).toBeInTheDocument();
    rerender(<TranscriptBlock language="en" status="ready" text="hi" />);
    expect(
      screen.getByText(en.transcript.ready_language.replace("{{language}}", "en")),
    ).toBeInTheDocument();
    rerender(<TranscriptBlock language={null} status="ready" text={null} />);
    expect(screen.getByText(en.transcript.ready)).toBeInTheDocument();
    rerender(<TranscriptBlock language={null} status="failed" text={null} />);
    expect(screen.getByText(en.transcript.failed)).toBeInTheDocument();
  });
});
