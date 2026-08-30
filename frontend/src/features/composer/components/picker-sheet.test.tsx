import { render, screen } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import { describe, expect, it, vi } from "vitest";
import { PickerSheet } from "./picker-sheet";
import { SlashCommandMenu } from "./slash-command-menu";
import {
  applySkinTone,
  commandQuery,
  filterCommands,
  filterGifs,
  filterReplies,
  rememberEmoji,
  expandSavedReplyShortcut,
  savedRepliesAsCommands,
  gifsFromList,
  isPickerSlash,
  pickerTabForSlash,
  stickerViewsFromPacks,
} from "@/features/composer/model/picker";
import { en } from "@/shared/lib/i18n/catalog";

describe("picker model", () => {
  it("tones, caps recents, and filters lists", () => {
    expect(applySkinTone("🔥", 2)).toBe("🔥");
    expect(applySkinTone("👍", 0)).toBe("👍");
    expect(applySkinTone("👍", 2)).toContain("👍");
    expect(applySkinTone("👍", 9)).toBe("👍");
    expect(rememberEmoji(["a"], "b", 2)).toEqual(["b", "a"]);
    expect(rememberEmoji(["a", "b"], "c", 2)).toEqual(["c", "a"]);
    expect(rememberEmoji(["a"], "a", 2)).toEqual(["a"]);
    expect(filterGifs([{ id: "1", previewLabel: "x", title: "Party" }], "")).toHaveLength(1);
    expect(filterGifs([{ id: "1", previewLabel: "x", title: "Party" }], "zz")).toHaveLength(0);
    expect(filterGifs([{ id: "1", previewLabel: "x", title: "Party" }], "par")).toHaveLength(1);
    expect(filterReplies([{ body: "Hi", id: "1", shortcut: "/omw" }], "")).toHaveLength(1);
    expect(filterReplies([{ body: "Hi", id: "1", shortcut: "/omw" }], "omw")).toHaveLength(1);
    expect(filterReplies([{ body: "Hi", id: "1", shortcut: "/omw" }], "later")).toHaveLength(0);
    expect(commandQuery("/Search")).toBe("search");
    expect(
      filterCommands([{ description: "Find", name: "search", source: "builtin" }], "/"),
    ).toHaveLength(1);
    expect(
      filterCommands([{ description: "Find", name: "search", source: "builtin" }], "/se"),
    ).toHaveLength(1);
    expect(
      filterCommands([{ description: "Find chats", name: "help", source: "bot" }], "chat"),
    ).toHaveLength(1);
    expect(expandSavedReplyShortcut("/omw ", [{ body: "On my way", id: "1", shortcut: "/omw" }])).toBe(
      "On my way ",
    );
    expect(expandSavedReplyShortcut("/omw\n", [{ body: "On my way", id: "1", shortcut: "/omw" }])).toBe(
      "On my way\n",
    );
    expect(expandSavedReplyShortcut("/omw", [{ body: "On my way", id: "1", shortcut: "/omw" }])).toBe(
      "/omw",
    );
    expect(expandSavedReplyShortcut("hi ", [])).toBe("hi ");
    expect(expandSavedReplyShortcut(" ", [{ body: "Hi", id: "1", shortcut: "/omw" }])).toBe(" ");
    expect(expandSavedReplyShortcut("hi ", [{ body: "hi", id: "1", shortcut: "hi" }])).toBe("hi ");
    expect(savedRepliesAsCommands([{ body: "Hi", id: "1", shortcut: "/omw" }])[0]?.name).toBe("omw");
    expect(isPickerSlash("sticker")).toBe(true);
    expect(isPickerSlash("gif")).toBe(true);
    expect(isPickerSlash("omw")).toBe(false);
    expect(pickerTabForSlash("sticker")).toBe("stickers");
    expect(pickerTabForSlash("gif")).toBe("gifs");
    expect(pickerTabForSlash("omw")).toBeNull();
    expect(
      stickerViewsFromPacks([
        {
          id: 1,
          kind: "sticker",
          stickers: [{ id: 9, shortcode: "wave", url: "https://x" }],
        },
        { id: 2, kind: "emoji", stickers: [{ id: 8, shortcode: "smile" }] },
      ]),
    ).toEqual([{ id: "9", packId: "1", shortcode: "wave", url: "https://x" }]);
    expect(stickerViewsFromPacks(undefined)).toEqual([]);
    expect(gifsFromList([{ id: "g", preview_url: "https://g", title: "Party" }])[0]?.previewUrl).toBe(
      "https://g",
    );
    expect(gifsFromList(undefined)).toEqual([]);
  });
});

describe("PickerSheet", () => {
  it("picks from every tab including empty states", async () => {
    const user = userEvent.setup({ pointerEventsCheck: 0 });
    const onPickEmoji = vi.fn();
    const onPickGif = vi.fn();
    const onPickReply = vi.fn();
    const onPickSticker = vi.fn();
    const { rerender } = render(
      <PickerSheet
        gifs={[{ id: "g1", previewLabel: "gif", title: "Party" }]}
        onOpenChange={vi.fn()}
        onPickEmoji={onPickEmoji}
        onPickGif={onPickGif}
        onPickReply={onPickReply}
        onPickSticker={onPickSticker}
        open
        replies={[{ body: "Hi", id: "r1", shortcut: "/omw" }]}
        stickers={[{ id: "s1", packId: "p", shortcode: "wave" }]}
      />,
    );
    await user.click(screen.getByRole("button", { name: "👍" }));
    expect(onPickEmoji).toHaveBeenCalled();
    await user.click(screen.getByRole("tab", { name: en.picker.stickers }));
    await user.click(screen.getByRole("button", { name: "wave" }));
    expect(onPickSticker).toHaveBeenCalled();
    await user.click(screen.getByRole("tab", { name: en.picker.gifs }));
    await user.click(screen.getByRole("button", { name: "gif" }));
    expect(onPickGif).toHaveBeenCalled();
    await user.type(screen.getByPlaceholderText(en.picker.search_gifs), "zzz");
    expect(screen.getByText(en.picker.empty_gifs)).toBeInTheDocument();
    await user.click(screen.getByRole("tab", { name: en.picker.replies }));
    await user.click(screen.getByRole("button", { name: /omw/i }));
    expect(onPickReply).toHaveBeenCalled();
    await user.type(screen.getByPlaceholderText(en.picker.search_replies), "nope");
    expect(screen.getByText(en.picker.empty_replies)).toBeInTheDocument();
    rerender(
      <PickerSheet
        gifs={[]}
        onOpenChange={vi.fn()}
        onPickEmoji={onPickEmoji}
        onPickGif={onPickGif}
        onPickReply={onPickReply}
        onPickSticker={onPickSticker}
        open
        replies={[]}
        stickers={[]}
      />,
    );
    await user.click(screen.getByRole("tab", { name: en.picker.stickers }));
    expect(screen.getByText(en.picker.empty_stickers)).toBeInTheDocument();
  });

  it("uses remote GIF results, previews, and the unavailable empty state", async () => {
    const user = userEvent.setup({ pointerEventsCheck: 0 });
    const onGifQueryChange = vi.fn();
    const { rerender } = render(
      <PickerSheet
        gifs={[
          { id: "g1", previewLabel: "gif", previewUrl: "https://media.test/gif.gif", title: "Party" },
        ]}
        initialTab="gifs"
        onGifQueryChange={onGifQueryChange}
        onOpenChange={vi.fn()}
        onPickEmoji={vi.fn()}
        onPickGif={vi.fn()}
        onPickReply={vi.fn()}
        onPickSticker={vi.fn()}
        open
        remoteGifs
        replies={[]}
        stickers={[{ id: "s1", packId: "p", shortcode: "wave", url: "https://media.test/s.png" }]}
      />,
    );
    expect(screen.getByRole("img", { name: "Party" })).toBeInTheDocument();
    await user.type(screen.getByPlaceholderText(en.picker.search_gifs), "zzz");
    expect(onGifQueryChange).toHaveBeenCalledWith("zzz");
    expect(screen.getByRole("img", { name: "Party" })).toBeInTheDocument();
    await user.click(screen.getByRole("tab", { name: en.picker.stickers }));
    expect(screen.getByRole("img", { name: "wave" })).toBeInTheDocument();
    await user.click(screen.getByRole("tab", { name: en.picker.gifs }));
    rerender(
      <PickerSheet
        gifUnavailable
        gifs={[]}
        initialTab="gifs"
        onOpenChange={vi.fn()}
        onPickEmoji={vi.fn()}
        onPickGif={vi.fn()}
        onPickReply={vi.fn()}
        onPickSticker={vi.fn()}
        open
        replies={[]}
        stickers={[]}
      />,
    );
    expect(screen.getByText(en.picker.unavailable_gifs)).toBeInTheDocument();
  });
});

describe("SlashCommandMenu", () => {
  it("navigates, wraps, and selects", async () => {
    const user = userEvent.setup();
    const onSelect = vi.fn();
    const commands = [
      { description: "One", name: "one", source: "builtin" as const, usageHint: "a" },
      { description: "Two", name: "two", source: "bot" as const },
    ];
    const { rerender } = render(
      <SlashCommandMenu commands={commands} onSelect={onSelect} query="/" />,
    );
    const box = screen.getByRole("listbox");
    box.focus();
    await user.click(screen.getByRole("option", { name: /one/i }));
    expect(onSelect).toHaveBeenCalledWith(commands[0]);
    await user.keyboard("{ArrowDown}");
    await user.keyboard("{Enter}");
    expect(onSelect).toHaveBeenCalledWith(commands[1]);
    await user.keyboard("{ArrowDown}");
    await user.keyboard("{ArrowUp}");
    await user.keyboard("{ArrowUp}");
    rerender(<SlashCommandMenu commands={commands} onSelect={onSelect} query="/zz" />);
    expect(screen.getByText(en.slash.empty)).toBeInTheDocument();
  });
});
