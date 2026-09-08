import { MessageSquare, Phone, User } from "lucide-react";
import { type ReactNode } from "react";
import { useTranslation } from "react-i18next";
import { useShellStore } from "@/features/settings/store/shell-store";
import { cn } from "@/shared/lib/cn";
import { SHELL_DESTINATIONS, type ShellDestination } from "@/shared/lib/navigation/destinations";
import { Button } from "@/shared/ui/button";
import { ICON_CLASS, WEIGHT_EMPHASIS } from "@/shared/ui/metrics";

const DESTINATION_ICONS = {
  calls: Phone,
  chats: MessageSquare,
  profile: User,
} as const;

export function PrimaryNav({ placement }: { placement: "bar" | "rail" }): ReactNode {
  const { t } = useTranslation();
  const destination = useShellStore((state) => state.destination);
  const setDestination = useShellStore((state) => state.setDestination);

  return (
    <nav
      aria-label={t("shell.tabs_aria")}
      className={placement === "rail" ? "primary-rail" : "primary-bar"}
      data-primary-nav={placement}
    >
      {SHELL_DESTINATIONS.map((id) => (
        <DestinationTab
          destination={id}
          key={id}
          onSelect={setDestination}
          selected={destination === id}
        />
      ))}
      {placement === "rail" ? <div className="flex-1" /> : null}
    </nav>
  );
}

function DestinationTab({
  destination,
  onSelect,
  selected,
}: {
  destination: ShellDestination;
  onSelect: (destination: ShellDestination) => void;
  selected: boolean;
}): ReactNode {
  const { t } = useTranslation();
  const Icon = DESTINATION_ICONS[destination];
  const label = t(`shell.${destination}`);
  return (
    <Button
      aria-current={selected ? "page" : undefined}
      aria-label={label}
      className={cn("primary-tab", WEIGHT_EMPHASIS)}
      data-destination-tab={destination}
      onClick={() => onSelect(destination)}
      type="button"
      variant="ghost"
    >
      <Icon aria-hidden className={ICON_CLASS} />
      {label}
    </Button>
  );
}
