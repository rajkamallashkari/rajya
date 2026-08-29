import { describe, expect, it, vi } from "vitest";
import {
  _testReset,
  _testSetPushedCount,
  _testSnapshot,
  abortAllLayers,
  addLayer,
  clearLayers,
  layerStackDepth,
  removeLayer,
} from "./layer-stack";
import { LAYER_SENTINEL_KEY } from "./constants";

async function flush(): Promise<void> {
  await Promise.resolve();
}

describe("layer-stack", () => {
  it("matches history depth to the open stack and pops on back", async () => {
    const closeA = vi.fn();
    const closeB = vi.fn();
    addLayer("a", closeA);
    addLayer("a", closeA);
    addLayer("b", closeB);
    await flush();
    expect(layerStackDepth()).toBe(2);
    expect(_testSnapshot().pushedCount).toBe(2);
    expect(_testSnapshot().stackIds).toEqual(["a", "b"]);
    window.dispatchEvent(new PopStateEvent("popstate", { state: {} }));
    expect(closeB).toHaveBeenCalled();
    expect(layerStackDepth()).toBe(1);
    removeLayer("a");
    await flush();
    expect(_testSnapshot().pushedCount).toBe(0);
    removeLayer("missing");
    expect(clearLayers()).toBe(false);
    abortAllLayers();
  });

  it("clears layers, skips a throwing closer, and ignores orphaned sentinels", async () => {
    const ok = vi.fn();
    addLayer("boom", () => {
      throw new Error("close");
    });
    addLayer("ok", ok);
    await flush();
    expect(clearLayers()).toBe(true);
    expect(ok).toHaveBeenCalled();
    window.dispatchEvent(
      new PopStateEvent("popstate", {
        state: { [LAYER_SENTINEL_KEY]: true, session: 0 },
      }),
    );
    addLayer("live", vi.fn());
    await flush();
    abortAllLayers();
    expect(layerStackDepth()).toBe(0);
  });

  it("ignores programmatic backs and a mismatched pop", async () => {
    addLayer("x", vi.fn());
    await flush();
    removeLayer("x");
    await flush();
    expect(_testSnapshot().ignorePops).toBe(1);
    window.dispatchEvent(new PopStateEvent("popstate", { state: null }));
    expect(_testSnapshot().ignorePops).toBe(0);
    _testSetPushedCount(1);
    window.dispatchEvent(new PopStateEvent("popstate", { state: null }));
    expect(_testSnapshot().pushedCount).toBe(0);
    _testReset();
    expect(_testSnapshot()).toEqual({
      ignorePops: 0,
      pushedCount: 0,
      session: 0,
      stackIds: [],
    });
  });
});
