import { fireEvent, render, screen } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import { describe, expect, it, vi } from "vitest";
import { Composer } from "./composer";
import type { VoiceRecorderResult } from "@/features/composer/hooks/use-voice-recorder";
import { LONG_PRESS_MS } from "@/shared/hooks/constants";
import { en } from "@/shared/lib/i18n/catalog";

function voice(overrides: Partial<VoiceRecorderResult> = {}): VoiceRecorderResult {
  return {
    canResume: false,
    cancel: vi.fn(),
    durationMs: 1200,
    finalPeaks: [0.2],
    mimeType: "audio/webm",
    pause: vi.fn(),
    peaks: [0.2],
    previewBlob: null,
    resume: vi.fn(),
    start: vi.fn(async () => undefined),
    state: "idle",
    stop: vi.fn(),
    ...overrides,
  };
}

describe("Composer", () => {
  it("keeps mic and send as separate controls and opens the send menu", async () => {
    const user = userEvent.setup();
    const onSend = vi.fn();
    const onChange = vi.fn();
    const onAttach = vi.fn();
    const onSchedule = vi.fn();
    const onRewrite = vi.fn();
    const onDismissReply = vi.fn();
    const onDismissEdit = vi.fn();
    const onClearSchedule = vi.fn();
    const onOpenSchedule = vi.fn();
    const onRemoveAttachment = vi.fn();
    const { rerender } = render(
      <Composer
        attachments={[{ id: "a1", name: "clip.png" }]}
        onAttach={onAttach}
        onChange={onChange}
        onClearSchedule={onClearSchedule}
        onDismissReply={onDismissReply}
        onOpenSchedule={onOpenSchedule}
        onRemoveAttachment={onRemoveAttachment}
        onRewrite={onRewrite}
        onSchedule={onSchedule}
        onSend={onSend}
        replyTo={{ preview: "earlier", senderName: "Ada" }}
        scheduledLabel="Tomorrow 09:00"
      />,
    );
    expect(screen.getByLabelText(en.composer.mic)).toBeInTheDocument();
    expect(screen.getByLabelText(en.composer.send)).toHaveAttribute(
      "data-composer-primary",
      "send",
    );
    expect(document.querySelector("[data-composer-row]")).toHaveAttribute(
      "data-composer-row",
      "compose",
    );
    await user.click(
      screen.getByRole("button", {
        name: en.composer.scheduled.replace("{{when}}", "Tomorrow 09:00"),
      }),
    );
    expect(onOpenSchedule).toHaveBeenCalled();
    await user.click(screen.getByRole("button", { name: en.composer.clear_schedule }));
    expect(onClearSchedule).toHaveBeenCalled();
    await user.click(
      screen.getByRole("button", {
        name: en.composer.remove_attachment.replace("{{name}}", "clip.png"),
      }),
    );
    expect(onRemoveAttachment).toHaveBeenCalledWith("a1");
    const chips = document.querySelector("[data-composer-attachments]");
    expect(chips).toHaveClass("overflow-x-auto");
    expect(chips).not.toHaveClass("flex-wrap");
    expect(chips?.firstElementChild).toHaveClass("shrink-0");
    expect(chips?.firstElementChild).toHaveClass("whitespace-nowrap");

    const field = screen.getByRole("textbox");
    await user.type(field, "hello");
    expect(onChange).toHaveBeenCalled();
    await user.keyboard("{Enter}");
    expect(onSend).toHaveBeenCalledWith({ silent: false, text: "hello" });

    rerender(
      <Composer
        onAttach={onAttach}
        onDismissReply={onDismissReply}
        onRewrite={onRewrite}
        onSchedule={onSchedule}
        onSend={onSend}
        replyTo={{ preview: "earlier", senderName: "Ada" }}
        value="later"
      />,
    );
    fireEvent.contextMenu(screen.getByLabelText(en.composer.send));
    fireEvent.keyDown(window, { key: "Escape" });
    expect(
      screen.queryByRole("menuitem", { name: en.composer.send_silent }),
    ).not.toBeInTheDocument();
    fireEvent.contextMenu(screen.getByLabelText(en.composer.send));
    fireEvent.keyDown(window, { key: "Tab" });
    fireEvent.keyDown(screen.getByRole("textbox"), { key: "Escape" });
    fireEvent.contextMenu(screen.getByLabelText(en.composer.send));
    const scheduleItem = screen.getByRole("menuitem", { name: en.composer.schedule });
    expect(scheduleItem).toHaveClass("whitespace-nowrap");
    expect(scheduleItem).toHaveClass("justify-start");
    expect(scheduleItem.closest("[role='menu']")).toHaveClass("w-max");
    await user.click(screen.getByRole("menuitem", { name: en.composer.attach_files }));
    expect(onAttach).toHaveBeenCalled();
    fireEvent.contextMenu(screen.getByLabelText(en.composer.send));
    await user.click(screen.getByRole("menuitem", { name: en.composer.schedule }));
    expect(onSchedule).toHaveBeenCalled();
    fireEvent.contextMenu(screen.getByLabelText(en.composer.send));
    await user.click(screen.getByRole("menuitem", { name: en.composer.rewrite }));
    expect(onRewrite).toHaveBeenCalled();
    rerender(
      <Composer
        onRewrite={onRewrite}
        onSend={onSend}
        provisional
        value="later"
      />,
    );
    expect(screen.getByText(en.ai.provisional)).toBeInTheDocument();
    fireEvent.contextMenu(screen.getByLabelText(en.composer.send));
    await user.click(screen.getByRole("menuitem", { name: en.composer.send_silent }));
    expect(onSend).toHaveBeenCalledWith({ silent: true, text: "later" });

    rerender(
      <Composer
        onDismissReply={onDismissReply}
        onSend={onSend}
        replyTo={{ preview: "earlier", senderName: "Ada" }}
        value="keep"
      />,
    );
    fireEvent.contextMenu(screen.getByLabelText(en.composer.send));
    await user.click(screen.getByRole("button", { name: en.ui.close }));
    fireEvent.keyDown(screen.getByRole("textbox"), { key: "Enter", shiftKey: true });
    fireEvent.keyDown(screen.getByRole("textbox"), { key: "Escape" });
    expect(onDismissReply).toHaveBeenCalled();
    rerender(
      <Composer
        onDismissReply={onDismissReply}
        onSend={onSend}
        replyTo={{ preview: "earlier", senderName: "Ada" }}
        value="keep"
      />,
    );
    await user.click(screen.getByRole("button", { name: en.composer.dismiss_reply }));

    rerender(<Composer editing onDismissEdit={onDismissEdit} onSend={onSend} value="edit me" />);
    expect(screen.getByText(en.composer.editing)).toBeInTheDocument();
    fireEvent.contextMenu(screen.getByLabelText(en.composer.send));
    expect(screen.getByRole("menuitem", { name: en.composer.rewrite })).toBeInTheDocument();
    expect(screen.queryByRole("menuitem", { name: en.composer.attach_files })).toBeNull();
    fireEvent.keyDown(window, { key: "Escape" });
    fireEvent.keyDown(screen.getByRole("textbox"), { key: "Escape" });
    expect(onDismissEdit).toHaveBeenCalled();
    await user.click(screen.getByRole("button", { name: en.composer.dismiss_edit }));

    rerender(<Composer defaultValue="  " onSend={onSend} />);
    fireEvent.submit(document.querySelector("form") as HTMLFormElement);
    expect(onSend).toHaveBeenCalledTimes(2);

    rerender(<Composer editing onSend={onSend} placeholder="Ask…" value="keep" />);
    fireEvent.keyDown(screen.getByRole("textbox"), { key: "Escape" });
    rerender(
      <Composer onSend={onSend} replyTo={{ preview: "earlier", senderName: "Ada" }} value="keep" />,
    );
    fireEvent.keyDown(screen.getByRole("textbox"), { key: "Escape" });
    await user.type(screen.getByRole("textbox"), "x");

    rerender(
      <Composer
        attachments={[{ id: "a2", name: "doc.pdf" }]}
        onSend={onSend}
        scheduledLabel="Later"
      />,
    );
    await user.click(screen.getByRole("button", { name: en.composer.clear_schedule }));
    await user.click(
      screen.getByRole("button", {
        name: en.composer.remove_attachment.replace("{{name}}", "doc.pdf"),
      }),
    );
    fireEvent.contextMenu(screen.getByLabelText(en.composer.send));
    await user.click(screen.getByRole("menuitem", { name: en.composer.attach_files }));
  });

  it("records, sends, and discards voice notes", async () => {
    vi.useFakeTimers();
    const onVoiceSend = vi.fn();
    const idle = voice();
    const { rerender } = render(
      <Composer onSend={vi.fn()} onVoiceSend={onVoiceSend} voice={idle} />,
    );
    await fireEvent.click(screen.getByLabelText(en.composer.mic));
    expect(idle.start).toHaveBeenCalled();

    const blob = new Blob(["a"]);
    const recording = voice({ state: "recording" });
    rerender(<Composer onSend={vi.fn()} onVoiceSend={onVoiceSend} voice={recording} />);
    expect(document.querySelector("[data-composer-row]")).toHaveAttribute(
      "data-composer-row",
      "voice",
    );
    fireEvent.submit(document.querySelector("form") as HTMLFormElement);
    expect(recording.stop).toHaveBeenCalled();
    rerender(
      <Composer
        onSend={vi.fn()}
        onVoiceSend={onVoiceSend}
        voice={voice({ canResume: true, state: "recording" })}
      />,
    );

    const paused = voice({
      canResume: false,
      previewBlob: blob,
      state: "paused",
    });
    rerender(<Composer onSend={vi.fn()} onVoiceSend={onVoiceSend} voice={paused} />);
    fireEvent.click(screen.getByLabelText(en.composer.send_voice));
    expect(onVoiceSend).toHaveBeenCalled();
    expect(paused.cancel).toHaveBeenCalled();

    const live = voice({ state: "recording" });
    rerender(<Composer onSend={vi.fn()} onVoiceSend={onVoiceSend} voice={live} />);
    fireEvent.click(screen.getByLabelText(en.composer.discard_voice));
    expect(live.cancel).toHaveBeenCalled();

    const pending = voice({ canResume: true, previewBlob: blob, state: "paused" });
    rerender(<Composer onSend={vi.fn()} onVoiceSend={onVoiceSend} voice={pending} />);
    fireEvent.click(screen.getByLabelText(en.composer.send_voice));
    expect(pending.stop).toHaveBeenCalled();

    const finalized = voice({
      canResume: false,
      previewBlob: blob,
      state: "paused",
    });
    rerender(<Composer onSend={vi.fn()} onVoiceSend={onVoiceSend} voice={finalized} />);
    expect(onVoiceSend).toHaveBeenCalledTimes(3);

    rerender(
      <Composer
        onSend={vi.fn()}
        voice={voice({ finalPeaks: [], previewBlob: blob, state: "paused" })}
      />,
    );
    fireEvent.click(screen.getByLabelText(en.composer.send_voice));

    vi.useRealTimers();
    expect(LONG_PRESS_MS).toBeGreaterThan(0);
  });

  it("requests an edit of the last message from an empty field", () => {
    const onEditLast = vi.fn();
    const { rerender } = render(<Composer onEditLast={onEditLast} onSend={vi.fn()} value="" />);
    fireEvent.keyDown(screen.getByRole("textbox"), { key: "ArrowUp" });
    expect(onEditLast).toHaveBeenCalled();
    rerender(<Composer onEditLast={onEditLast} onSend={vi.fn()} value="keep" />);
    fireEvent.keyDown(screen.getByRole("textbox"), { key: "ArrowUp" });
    expect(onEditLast).toHaveBeenCalledTimes(1);
  });

  it("expands a saved-reply shortcut and lists matching slash commands", async () => {
    const user = userEvent.setup();
    const onChange = vi.fn();
    render(
      <Composer
        onChange={onChange}
        onSend={vi.fn()}
        savedReplies={[{ body: "On my way", id: "1", shortcut: "/omw" }]}
      />,
    );
    await user.type(screen.getByRole("textbox"), "/om");
    await user.click(screen.getByRole("option"));
    expect(onChange).toHaveBeenCalledWith("On my way ");
  });

  it("opens the sticker picker from a slash command without an extra composer button", async () => {
    const user = userEvent.setup({ pointerEventsCheck: 0 });
    const onPickSticker = vi.fn();
    const onPickGif = vi.fn();
    const onChange = vi.fn();
    render(
      <Composer
        gifs={[{ id: "g1", previewLabel: "Party", title: "Party" }]}
        onChange={onChange}
        onPickGif={onPickGif}
        onPickSticker={onPickSticker}
        onSend={vi.fn()}
        savedReplies={[{ body: "On my way", id: "1", shortcut: "/omw" }]}
        stickers={[{ id: "9", packId: "1", shortcode: "wave" }]}
      />,
    );
    expect(screen.getByLabelText(en.composer.mic)).toBeInTheDocument();
    expect(screen.queryByRole("button", { name: en.picker.title })).toBeNull();
    await user.type(screen.getByRole("textbox"), "/sticker");
    await user.click(screen.getByRole("option", { name: /sticker/i }));
    expect(screen.getByText(en.picker.title)).toBeInTheDocument();
    await user.click(screen.getByRole("tab", { name: en.picker.stickers }));
    await user.click(screen.getByRole("button", { name: "wave" }));
    expect(onPickSticker).toHaveBeenCalled();
    await user.type(screen.getByRole("textbox"), "/gif");
    await user.click(screen.getByRole("option", { name: /gif/i }));
    await user.click(screen.getByRole("button", { name: "Party" }));
    expect(onPickGif).toHaveBeenCalled();
    await user.type(screen.getByRole("textbox"), "/gif");
    await user.click(screen.getByRole("option", { name: /gif/i }));
    await user.click(screen.getByRole("tab", { name: en.picker.emoji }));
    await user.click(screen.getByRole("button", { name: "👍" }));
    expect(onChange).toHaveBeenCalled();
    await user.click(screen.getByRole("tab", { name: en.picker.replies }));
    await user.click(screen.getByRole("button", { name: /omw/i }));
    await user.clear(screen.getByRole("textbox"));
    await user.type(screen.getByRole("textbox"), "/sticker");
    await user.click(screen.getByRole("option", { name: /sticker/i }));
    fireEvent.keyDown(document.querySelector("[data-composer] textarea") as HTMLTextAreaElement, {
      key: "Escape",
    });
    expect(screen.queryByRole("dialog", { name: en.picker.title })).not.toBeInTheDocument();
  });
});
