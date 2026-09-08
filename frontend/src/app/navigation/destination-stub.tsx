import { type ReactNode } from "react";
import { useTranslation } from "react-i18next";
import { EmptyState } from "@/shared/ui/empty-state";
import { WEIGHT_EMPHASIS } from "@/shared/ui/metrics";
import type { ShellDestination } from "@/shared/lib/navigation/destinations";

export function DestinationStub({
  destination,
}: {
  destination: Exclude<ShellDestination, "chats">;
}): ReactNode {
  const { t } = useTranslation();
  const title = t(`shell.${destination}`);
  return (
    <section
      aria-labelledby={`destination-${destination}-title`}
      className="flex h-full min-h-0 min-w-0 flex-1 flex-col bg-[var(--surface-panel)]"
      data-destination={destination}
    >
      <header className="flex items-center px-[var(--space-list-x)] py-[var(--space-list-y)]">
        <h1 className={WEIGHT_EMPHASIS} id={`destination-${destination}-title`}>
          {title}
        </h1>
      </header>
      <EmptyState description={t(`shell.${destination}_stub`)} title={title} />
    </section>
  );
}
