import { describe, expect, it } from "vitest";
import * as navigation from "./index";

describe("navigation barrel", () => {
  it("re-exports the stack primitives", () => {
    expect(typeof navigation.addLayer).toBe("function");
    expect(typeof navigation.useLayerStore).toBe("function");
    expect(navigation.MOBILE_MAX_PX).toBeGreaterThan(0);
  });
});
