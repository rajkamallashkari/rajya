export function DateDivider({ label }: { label: string }) {
  return (
    <div className="flex justify-center py-[var(--space-3)]" data-date-divider="">
      <span
        className="rounded-[var(--radius-full)] border border-[var(--border-subtle)] bg-[var(--surface-panel)] px-[var(--space-3)] py-[var(--space-1)] text-[length:var(--text-xs)] text-[var(--text-tertiary)]"
        role="separator"
      >
        {label}
      </span>
    </div>
  );
}
