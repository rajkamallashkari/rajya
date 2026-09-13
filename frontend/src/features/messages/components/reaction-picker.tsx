import { useState } from "react";
import { useTranslation } from "react-i18next";
import { Button, DismissLayer } from "@/shared/ui";

export const EMOJI_OPTIONS = [
  "😀", "😃", "😄", "😁", "😆", "😅", "😂", "🤣", "😊", "😇", "🙂", "🙃",
  "😉", "😍", "🥰", "😘", "😋", "😎", "🤩", "🥳", "😏", "😢", "😭", "😤",
  "😡", "🤯", "😱", "😮", "😴", "🤔", "🫡", "🤗", "🤭", "🫢", "🫠", "🫶",
  "👍", "👎", "👏", "🙌", "🙏", "💪", "🤝", "👀", "💯", "❤️", "🧡", "💛",
  "💚", "💙", "💜", "🖤", "🤍", "💔", "✨", "🔥", "🎉", "🎊", "✅", "❌",
  "⭐", "🌟", "⚡", "💡", "🚀", "🏆", "🎯", "🍕", "🍰", "☕", "🌈", "🌍",
];

export function ReactionPicker({
  onClose,
  onCustomize,
  onSelect,
  quickReactions,
}: {
  onClose: () => void;
  onCustomize: (reactions: string[]) => void;
  onSelect: (emoji: string) => void;
  quickReactions: string[];
}) {
  const { t } = useTranslation();
  const [customizing, setCustomizing] = useState(false);
  const [slot, setSlot] = useState(0);
  const [draft, setDraft] = useState(quickReactions);

  return (
    <>
      <DismissLayer label={t("reactions.close_picker")} onDismiss={onClose} scrim />
      <section
        aria-label={t("reactions.picker")}
        className="fixed bottom-[var(--space-4)] left-1/2 z-[var(--z-menu)] flex max-h-[min(32rem,80vh)] w-[min(24rem,calc(100vw-var(--space-4)))] -translate-x-1/2 flex-col rounded-[var(--radius-lg)] border border-[var(--border-default)] bg-[var(--surface-elevated)] p-[var(--space-3)] shadow-[var(--elevation-3)]"
        data-reaction-picker=""
      >
        <div className="mb-[var(--space-2)] flex items-center justify-between">
          <strong>
            {customizing ? t("reactions.choose_slot", { slot: slot + 1 }) : t("reactions.quick")}
          </strong>
          <Button
            onClick={() => {
              if (customizing) {
                onCustomize(draft);
              }
              setCustomizing((value) => !value);
            }}
            size="sm"
            variant="ghost"
          >
            {customizing ? t("reactions.done") : t("reactions.customize")}
          </Button>
        </div>
        <div className="mb-[var(--space-3)] flex gap-[var(--space-1)]" role="group">
          {draft.map((emoji, index) => (
            <Button
              aria-pressed={customizing && slot === index}
              key={`${emoji}-${String(index)}`}
              onClick={() => (customizing ? setSlot(index) : onSelect(emoji))}
              variant={customizing && slot === index ? "primary" : "ghost"}
            >
              {emoji}
            </Button>
          ))}
        </div>
        <div className="grid min-h-0 grid-cols-8 gap-[var(--space-1)] overflow-y-auto" role="list">
          {EMOJI_OPTIONS.map((emoji) => (
            <Button
              aria-label={t("reactions.react_with", { emoji })}
              key={emoji}
              onClick={() => {
                if (customizing) {
                  const next = [...draft];
                  next[slot] = emoji;
                  setDraft(next);
                  setSlot((current) => Math.min(current + 1, next.length - 1));
                } else {
                  onSelect(emoji);
                }
              }}
              variant="ghost"
            >
              {emoji}
            </Button>
          ))}
        </div>
      </section>
    </>
  );
}
