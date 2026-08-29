import { useEffect, useState, type KeyboardEvent } from "react";
import { useTranslation } from "react-i18next";
import { filterCommands, type SlashCommand } from "@/features/composer/model/picker";
import { cn } from "@/shared/lib/cn";
import { Button, EmptyState } from "@/shared/ui";
import { WEIGHT_EMPHASIS } from "@/shared/ui/metrics";

export function SlashCommandMenu({
  commands,
  onSelect,
  query,
}: {
  commands: SlashCommand[];
  onSelect: (command: SlashCommand) => void;
  query: string;
}) {
  const { t } = useTranslation();
  const matches = filterCommands(commands, query);
  const [active, setActive] = useState(0);
  const maxIndex = Math.max(matches.length - 1, 0);

  useEffect(() => {
    setActive(0);
  }, [query, matches.length]);

  if (matches.length === 0) {
    return (
      <div
        className="rounded-[var(--radius-md)] border border-[var(--border-subtle)] bg-[var(--surface-raised)] shadow-[var(--elevation-2)]"
        data-slash-menu=""
      >
        <EmptyState title={t("slash.empty")} />
      </div>
    );
  }

  const clamped = Math.min(active, maxIndex);

  function onKeyDown(event: KeyboardEvent<HTMLDivElement>): void {
    if (event.key === "ArrowDown") {
      event.preventDefault();
      setActive((current) => (current >= maxIndex ? 0 : current + 1));
      return;
    }
    if (event.key === "ArrowUp") {
      event.preventDefault();
      setActive((current) => (current <= 0 ? maxIndex : current - 1));
      return;
    }
    if (event.key === "Enter") {
      event.preventDefault();
      const command = matches[clamped];
      if (command) {
        onSelect(command);
      }
    }
  }

  return (
    <div
      className="overflow-hidden rounded-[var(--radius-md)] border border-[var(--border-subtle)] bg-[var(--surface-raised)] shadow-[var(--elevation-2)]"
      data-slash-menu=""
      onKeyDown={onKeyDown}
      role="listbox"
      tabIndex={0}
    >
      {matches.map((command, index) => (
        <Button
          aria-selected={index === clamped}
          className={cn(
            "h-auto w-full flex-col items-start px-[var(--space-3)] py-[var(--space-1)] text-left",
            index === clamped ? "bg-[var(--surface-hover)]" : "",
          )}
          key={`${command.source}-${command.name}`}
          onClick={() => onSelect(command)}
          role="option"
          type="button"
          variant="ghost"
        >
          <span className={WEIGHT_EMPHASIS}>{`/${command.name}`}</span>
          <span className="text-[var(--text-secondary)]">{command.description}</span>
          {command.usageHint ? (
            <span className="text-[var(--text-tertiary)]">
              {t("slash.hint", { hint: command.usageHint })}
            </span>
          ) : null}
        </Button>
      ))}
    </div>
  );
}
