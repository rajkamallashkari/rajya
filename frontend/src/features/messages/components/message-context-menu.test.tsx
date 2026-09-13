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
      onReport: vi.fn(),
      onSave: vi.fn(),
      onSelect: vi.fn(),
      onSuggestReply: vi.fn(),
      onTranscribe: vi.fn(),
      onTranslate: vi.fn(),
      onUnsend: vi.fn(),
      onUpdateQuickReactions: vi.fn(),
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

    rerender(<MessageContextMenu actions={actions} onClose={onClose} x={20} y={20} />);
    await user.click(screen.getByRole("button", { name: "More reactions" }));
    expect(screen.getByRole("region", { name: "Emoji picker" })).toBeInTheDocument();
    await user.click(screen.getByRole("button", { name: "Customize" }));
    await user.click(
      screen.getByRole("region", { name: "Emoji picker" }).querySelectorAll("button")[1]!,
    );
    await user.click(screen.getByRole("button", { name: "React with 🚀" }));
    await user.click(screen.getByRole("button", { name: "Done" }));
    expect(actions.onUpdateQuickReactions).toHaveBeenCalledWith([
      "🚀",
      "❤️",
      "😂",
      "😮",
      "😭",
      "🙏",
    ]);
    await user.click(screen.getByRole("button", { name: "React with 😀" }));
    expect(actions.onReact).toHaveBeenLastCalledWith("😀");
    expect(onClose).toHaveBeenCalled();
    rerender(<MessageContextMenu actions={actions} onClose={onClose} x={20} y={20} />);
    await user.click(screen.getByRole("button", { name: "More reactions" }));
    await user.click(
      screen.getByRole("region", { name: "Emoji picker" }).querySelectorAll("button")[1]!,
    );
    expect(actions.onReact).toHaveBeenLastCalledWith("👍");

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
    await user.click(screen.getByRole("menuitem", { name: en.messages.menu.suggest_reply }));
    await user.click(screen.getByRole("menuitem", { name: en.messages.menu.transcribe }));
    await user.click(screen.getByRole("menuitem", { name: en.messages.menu.translate }));
    await user.click(screen.getByRole("menuitem", { name: en.messages.menu.unpin }));
    await user.click(screen.getByRole("menuitem", { name: en.messages.menu.unsave }));
    await user.click(screen.getByRole("menuitem", { name: en.messages.menu.info }));
    await user.click(screen.getByRole("menuitem", { name: en.messages.menu.select }));
    await user.click(screen.getByRole("menuitem", { name: en.messages.menu.reactions }));
    await user.click(screen.getByRole("menuitem", { name: en.messages.menu.remind }));
    await user.click(screen.getByRole("menuitem", { name: en.messages.menu.report }));
    await user.click(screen.getByRole("menuitem", { name: en.messages.menu.unsend }));
    expect(actions.onSelect).toHaveBeenCalled();
    expect(actions.onReactions).toHaveBeenCalled();
    expect(actions.onRemind).toHaveBeenCalled();
    expect(actions.onReport).toHaveBeenCalled();
    expect(actions.onUnsend).toHaveBeenCalled();
    expect(actions.onSuggestReply).toHaveBeenCalled();
    expect(actions.onTranscribe).toHaveBeenCalled();
    expect(actions.onTranslate).toHaveBeenCalled();

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

    const regenerate = { onRegenerate: vi.fn() };
    rerender(<MessageContextMenu actions={regenerate} onClose={onClose} x={20} y={20} />);
    await user.click(screen.getByRole("menuitem", { name: en.messages.menu.regenerate }));
    expect(regenerate.onRegenerate).toHaveBeenCalled();

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
