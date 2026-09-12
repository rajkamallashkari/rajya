import { Button } from "@/shared/ui/button";

export function DateDivider({ label, onClick }: { label: string; onClick?: () => void }) {
  return (
    <div className="flex justify-center py-[var(--space-3)]" data-date-divider="">
      <Button
        className="min-h-0 min-w-0 rounded-[var(--radius-full)] border-[var(--border-subtle)] px-[var(--space-3)] py-[var(--space-1)] text-[length:var(--text-xs)] text-[var(--text-tertiary)]"
        onClick={onClick}
        size="sm"
        type="button"
        variant="secondary"
      >
        {label}
      </Button>
    </div>
  );
}
