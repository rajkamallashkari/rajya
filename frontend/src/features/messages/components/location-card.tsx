import { MapPin } from "lucide-react";
import { useMemo } from "react";
import { useTranslation } from "react-i18next";
import {
  LOCATION_TILE_REQUEST_CAP,
  OSM_TILE_SIZE,
  openStreetMapLink,
  tilesForLocation,
} from "@/features/messages/model/osm-tiles";
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
  const tiles = useMemo(
    () => tilesForLocation(location.latitude, location.longitude),
    [location.latitude, location.longitude],
  );
  const open = onOpen ?? (() => window.open(openStreetMapLink(location.latitude, location.longitude), "_blank"));
  return (
    <article
      className="flex min-w-0 flex-col overflow-hidden rounded-[var(--radius-bubble)] bg-[var(--surface-raised)]"
      data-location-card=""
      data-tile-cap={LOCATION_TILE_REQUEST_CAP}
      data-tile-count={tiles.length}
    >
      <div
        className="relative min-h-[var(--space-16)] overflow-hidden bg-[var(--surface-hover)]"
        style={
          tiles.length > 0
            ? {
                aspectRatio: "1 / 1",
                display: "grid",
                gridTemplateColumns: `repeat(2, ${String(OSM_TILE_SIZE)}px)`,
              }
            : undefined
        }
      >
        {tiles.length > 0 ? (
          tiles.map((tile) => (
            <img
              alt=""
              className="h-full w-full object-cover"
              height={OSM_TILE_SIZE}
              key={tile.url}
              src={tile.url}
              width={OSM_TILE_SIZE}
            />
          ))
        ) : (
          <div className="chat-wallpaper flex min-h-[var(--space-16)] items-center justify-center">
            <MapPin aria-hidden="true" className={ICON_CLASS} />
            <span className="sr-only">{t("location.map")}</span>
          </div>
        )}
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
        <Button onClick={open} type="button" variant="ghost">
          {t("location.open")}
        </Button>
      </div>
    </article>
  );
}
