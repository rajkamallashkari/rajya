import { describe, expect, it } from "vitest";
import { useLayerStore } from "./layer-store";

const sample = {
  conversationId: "ada",
  id: "conversation:ada",
  kind: "conversation" as const,
  title: "Ada",
};

describe("layer-store", () => {
  it("pushes uniquely, pops, and clears", () => {
    useLayerStore.getState().pushLayer(sample);
    useLayerStore.getState().pushLayer(sample);
    useLayerStore.getState().pushLayer({
      conversationId: "ada",
      id: "profile:ada",
      kind: "profile",
      title: "Ada",
    });
    expect(useLayerStore.getState().layers).toHaveLength(2);
    useLayerStore.getState().popLayer();
    expect(useLayerStore.getState().layers).toHaveLength(1);
    useLayerStore.getState().clearLayers();
    expect(useLayerStore.getState().layers).toHaveLength(0);
    useLayerStore.getState().clearLayers();
  });
});
