import { render, screen } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import { describe, expect, it, vi } from "vitest";
import { MessageContextMenu } from "./message-context-menu";
import { en } from "@/shared/lib/i18n/catalog";

describe("MessageContextMenu", () => {
  it("runs the full action set and the failed set", async () => {
    const user = userEvent.setup({ pointerEventsCheck: 0 });
    const actions = {
      canEdit: true,
      hasText: true,
      isMine: true,
      isPinned: false,
      isSaved: false,
      onCopy: vi.fn(),
      onEdit: vi.fn(),
      onForward: vi.fn(),
      onInfo: vi.fn(),
      onPin: vi.fn(),
      onReact: vi.fn(),
      onReply: vi.fn(),
      onReactions: vi.fn(),
      onRemind: vi.fn(),
      onSave: vi.fn(),
      onSelect: vi.fn(),
      onUnsend: vi.fn(),
    };
    const onClose = vi.fn();
    const { rerender } = render(
      <MessageContextMenu actions={actions} onClose={onClose} x={20} y={20} />,
    );
    await user.click(
      screen.getByRole("button", { name: en.messages.menu.react.replace("{{emoji}}", "👍") }),
    );
    expect(actions.onReact).toHaveBeenCalledWith("👍");
    expect(onClose).toHaveBeenCalled();

    rerender(
      <MessageContextMenu
        actions={{ ...actions, isPinned: true, isSaved: true }}
        onClose={onClose}
        x={20}
        y={20}
      />,
    );
    await user.click(screen.getByRole("menuitem", { name: en.messages.menu.reply }));
    await user.click(screen.getByRole("menuitem", { name: en.messages.menu.edit }));
    await user.click(screen.getByRole("menuitem", { name: en.messages.menu.forward }));
    await user.click(screen.getByRole("menuitem", { name: en.messages.menu.copy }));
    await user.click(screen.getByRole("menuitem", { name: en.messages.menu.unpin }));
    await user.click(screen.getByRole("menuitem", { name: en.messages.menu.unsave }));
    await user.click(screen.getByRole("menuitem", { name: en.messages.menu.info }));
    await user.click(screen.getByRole("menuitem", { name: en.messages.menu.select }));
    await user.click(screen.getByRole("menuitem", { name: en.messages.menu.reactions }));
    await user.click(screen.getByRole("menuitem", { name: en.messages.menu.remind }));
    await user.click(screen.getByRole("menuitem", { name: en.messages.menu.unsend }));
    expect(actions.onSelect).toHaveBeenCalled();
    expect(actions.onReactions).toHaveBeenCalled();
    expect(actions.onRemind).toHaveBeenCalled();
    expect(actions.onUnsend).toHaveBeenCalled();

    const failed = {
      isFailed: true,
      isMine: true,
      onRetry: vi.fn(),
      onUnsend: vi.fn(),
    };
    rerender(<MessageContextMenu actions={failed} onClose={onClose} x={900} y={900} />);
    await user.click(screen.getByRole("menuitem", { name: en.messages.menu.retry }));
    expect(failed.onRetry).toHaveBeenCalled();
    await user.click(screen.getByRole("button", { name: en.ui.close }));

    rerender(
      <MessageContextMenu
        actions={{ hasText: true, onCopy: vi.fn() }}
        onClose={onClose}
        x={20}
        y={20}
      />,
    );
    expect(screen.getByRole("menuitem", { name: en.messages.menu.copy })).toBeInTheDocument();
  });
});
