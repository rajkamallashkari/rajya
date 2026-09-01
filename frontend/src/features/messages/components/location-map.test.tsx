import { render } from "@testing-library/react";
import { describe, expect, it } from "vitest";
import { LocationMap } from "./location-map";

describe("LocationMap", () => {
  it("renders the OSM mosaic", () => {
    render(<LocationMap size={8} tiles={[{ url: "https://tile.test/1.png" }]} />);
    expect(document.querySelector("[data-location-map]")).not.toBeNull();
    expect(document.querySelector("img")?.getAttribute("src")).toBe("https://tile.test/1.png");
  });
});
