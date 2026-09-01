import { OSM_TILE_GRID } from "@/features/messages/model/osm-tiles";

export function LocationMap({
  size,
  tiles,
}: {
  size: number;
  tiles: Array<{ url: string }>;
}) {
  return (
    <div
      className="relative min-h-[var(--space-16)] overflow-hidden bg-[var(--surface-hover)]"
      data-location-map=""
      style={{
        aspectRatio: "1 / 1",
        display: "grid",
        gridTemplateColumns: `repeat(${String(OSM_TILE_GRID)}, ${String(size)}px)`,
      }}
    >
      {tiles.map((tile) => (
        <img
          alt=""
          className="h-full w-full object-cover"
          height={size}
          key={tile.url}
          src={tile.url}
          width={size}
        />
      ))}
    </div>
  );
}
