import { MapPin } from "lucide-react";
import { useTranslation } from "react-i18next";
import { LOCATION_REQUEST_CAP } from "@/features/conversations/model/report";
import { Button } from "@/shared/ui";
import { ICON_CLASS, WEIGHT_EMPHASIS } from "@/shared/ui/metrics";

export interface LocationView {
  accuracyM: number | null;
  label: string | null;
  latitude: number;
  longitude: number;
}

export function LocationCard({
  location,
  onOpen,
}: {
  location: LocationView;
  onOpen?: () => void;
}) {
  const { t } = useTranslation();
  const coords = `${location.latitude.toFixed(6)}, ${location.longitude.toFixed(6)}`;
  return (
    <article
      className="flex min-w-0 flex-col overflow-hidden rounded-[var(--radius-bubble)] bg-[var(--surface-raised)]"
      data-location-card=""
      data-tile-cap={LOCATION_REQUEST_CAP}
    >
      <div className="chat-wallpaper flex min-h-[var(--space-16)] items-center justify-center">
        <MapPin aria-hidden="true" className={ICON_CLASS} />
        <span className="sr-only">{t("location.map")}</span>
      </div>
      <div className="flex flex-col gap-[var(--space-1)] p-[var(--space-3)]">
        {location.label ? <p className={WEIGHT_EMPHASIS}>{location.label}</p> : null}
        <p className="text-[var(--text-secondary)]">{coords}</p>
        {location.accuracyM !== null ? (
          <p className="text-[var(--text-tertiary)]">
            {t("location.accuracy", { meters: location.accuracyM })}
          </p>
        ) : null}
        <p className="text-[var(--text-tertiary)]">{t("location.attribution")}</p>
        {onOpen ? (
          <Button onClick={onOpen} type="button" variant="ghost">
            {t("location.open")}
          </Button>
        ) : null}
      </div>
    </article>
  );
}
