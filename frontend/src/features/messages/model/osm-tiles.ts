import registry from "@/shared/lib/config/settings-registry.json";

const DEGREES_HALF = 180;
const DEGREES_FULL = 360;
export const OSM_TILE_GRID = 2;
const TILE_ORIGIN = 1;

export const LOCATION_TILE_REQUEST_CAP = registry.location_tile_request_cap.default as number;
export const OSM_TILE_HOST = registry.osm_tile_host.default as string;
export const OSM_TILE_SIZE = registry.osm_tile_size.default as number;
export const OSM_TILE_ZOOM = registry.osm_tile_zoom.default as number;

export interface TileCoord {
  url: string;
  x: number;
  y: number;
  z: number;
}

const issued = new Set<string>();

export function resetOsmTileBudget(): void {
  issued.clear();
}

export function remainingOsmTileBudget(cap: number = LOCATION_TILE_REQUEST_CAP): number {
  return Math.max(0, cap - issued.size);
}

export function latLngToTile(latitude: number, longitude: number, zoom: number): { x: number; y: number } {
  const n = OSM_TILE_GRID ** zoom;
  const x = Math.floor(((longitude + DEGREES_HALF) / DEGREES_FULL) * n);
  const latRad = (latitude * Math.PI) / DEGREES_HALF;
  const y = Math.floor(
    ((TILE_ORIGIN - Math.log(Math.tan(latRad) + TILE_ORIGIN / Math.cos(latRad)) / Math.PI) /
      OSM_TILE_GRID) *
      n,
  );
  return { x: wrapTile(x, n), y: clampTile(y, n) };
}

export function osmTileUrl(x: number, y: number, zoom: number, host: string = OSM_TILE_HOST): string {
  return `https://${host}/${String(zoom)}/${String(x)}/${String(y)}.png`;
}

export function tilesForLocation(
  latitude: number,
  longitude: number,
  cap: number = LOCATION_TILE_REQUEST_CAP,
): TileCoord[] {
  const center = latLngToTile(latitude, longitude, OSM_TILE_ZOOM);
  const n = OSM_TILE_GRID ** OSM_TILE_ZOOM;
  const coords = [
    { x: center.x, y: center.y },
    { x: wrapTile(center.x + 1, n), y: center.y },
    { x: center.x, y: clampTile(center.y + 1, n) },
    { x: wrapTile(center.x + 1, n), y: clampTile(center.y + 1, n) },
  ];
  const unique = new Map<string, { x: number; y: number }>();
  coords.forEach((tile) => {
    unique.set(`${String(tile.x)}:${String(tile.y)}`, tile);
  });
  const selected: TileCoord[] = [];
  unique.forEach((tile) => {
    const url = osmTileUrl(tile.x, tile.y, OSM_TILE_ZOOM);
    if (issued.has(url) || issued.size < cap) {
      issued.add(url);
      selected.push({ url, x: tile.x, y: tile.y, z: OSM_TILE_ZOOM });
    }
  });
  return selected;
}

function wrapTile(value: number, n: number): number {
  return ((value % n) + n) % n;
}

function clampTile(value: number, n: number): number {
  if (value < 0) {
    return 0;
  }
  if (value >= n) {
    return n - 1;
  }
  return value;
}

export function openStreetMapLink(latitude: number, longitude: number): string {
  const lat = latitude.toFixed(6);
  const lng = longitude.toFixed(6);
  return `https://www.openstreetmap.org/?mlat=${lat}&mlon=${lng}#map=${String(OSM_TILE_ZOOM)}/${lat}/${lng}`;
}
