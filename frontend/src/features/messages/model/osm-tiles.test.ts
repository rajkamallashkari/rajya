import { afterEach, describe, expect, it } from "vitest";
import {
  LOCATION_TILE_REQUEST_CAP,
  latLngToTile,
  openStreetMapLink,
  osmTileUrl,
  remainingOsmTileBudget,
  resetOsmTileBudget,
  tilesForLocation,
} from "./osm-tiles";

describe("osm tiles", () => {
  afterEach(() => {
    resetOsmTileBudget();
  });

  it("maps a known point onto a tile and builds a capped mosaic", () => {
    const tile = latLngToTile(0, 0, 1);
    expect(tile).toEqual({ x: 1, y: 1 });
    expect(osmTileUrl(1, 2, 3)).toContain("/3/1/2.png");
    expect(openStreetMapLink(12.9716, 77.5946)).toContain("mlat=12.971600");
    const first = tilesForLocation(12.9716, 77.5946);
    expect(first.length).toBeGreaterThan(0);
    expect(first.length).toBeLessThanOrEqual(LOCATION_TILE_REQUEST_CAP);
    expect(tilesForLocation(12.9716, 77.5946)).toHaveLength(first.length);
    expect(remainingOsmTileBudget()).toBeLessThan(LOCATION_TILE_REQUEST_CAP);
  });

  it("stops issuing new tiles once the cap is reached", () => {
    const first = tilesForLocation(10, 10, 1);
    expect(first).toHaveLength(1);
    expect(tilesForLocation(-10, -10, 1)).toEqual([]);
    expect(remainingOsmTileBudget(1)).toBe(0);
  });

  it("wraps longitude and clamps latitude tiles", () => {
    expect(latLngToTile(89, 179, 2).x).toBeGreaterThanOrEqual(0);
    expect(latLngToTile(-89, -179, 2).y).toBeGreaterThanOrEqual(0);
    expect(latLngToTile(0, -200, 2).x).toBeGreaterThanOrEqual(0);
    expect(latLngToTile(89.999, 0, 1).y).toBe(0);
  });
});
