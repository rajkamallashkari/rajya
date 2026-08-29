import { describe, expect, it } from "vitest";
import {
  conversationLayer,
  layersForOpenConversation,
  partitionLayers,
  useLayerStore,
} from "./layer-store";

const ada = {
  conversationId: "ada",
  id: "conversation:ada",
  kind: "conversation" as const,
  title: "Ada",
};

const team = {
  conversationId: "team",
  id: "conversation:team",
  kind: "conversation" as const,
  title: "Team",
};

const adaProfile = {
  conversationId: "ada",
  id: "profile:ada",
  kind: "profile" as const,
  title: "Ada",
};

const memberProfile = {
  conversationId: "ada",
  id: "profile:member",
  kind: "profile" as const,
  title: "Member",
};

describe("layer-store", () => {
  it("pushes uniquely, pops, and clears", () => {
    useLayerStore.getState().pushLayer(ada);
    useLayerStore.getState().pushLayer(ada);
    useLayerStore.getState().pushLayer(adaProfile);
    useLayerStore.getState().pushLayer(adaProfile);
    expect(useLayerStore.getState().layers).toHaveLength(2);
    useLayerStore.getState().popLayer();
    expect(useLayerStore.getState().layers).toHaveLength(1);
    useLayerStore.getState().clearLayers();
    expect(useLayerStore.getState().layers).toHaveLength(0);
    useLayerStore.getState().clearLayers();
  });

  it("replaces the conversation and drops details when opening another chat", () => {
    useLayerStore.getState().pushLayer(ada);
    useLayerStore.getState().pushLayer(adaProfile);
    useLayerStore.getState().pushLayer(memberProfile);
    useLayerStore.getState().openConversation(team);
    expect(useLayerStore.getState().layers).toEqual([team]);
    useLayerStore.getState().pushLayer(adaProfile);
    useLayerStore.getState().openConversation(ada);
    expect(useLayerStore.getState().layers).toEqual([ada]);
    useLayerStore.getState().pushLayer(adaProfile);
    useLayerStore.getState().openConversation(ada);
    expect(useLayerStore.getState().layers).toEqual([ada]);
    useLayerStore.getState().openConversation(ada);
    expect(useLayerStore.getState().layers).toEqual([ada]);
  });

  it("partitions the conversation from the detail stack", () => {
    expect(conversationLayer("ada", "Ada")).toEqual(ada);
    expect(partitionLayers([])).toEqual({ conversation: undefined, details: [] });
    expect(partitionLayers([ada, adaProfile, memberProfile])).toEqual({
      conversation: ada,
      details: [adaProfile, memberProfile],
    });
    expect(layersForOpenConversation([ada, adaProfile], ada)).toEqual([ada]);
    expect(layersForOpenConversation([ada, adaProfile], team)).toEqual([team]);
    expect(layersForOpenConversation([], ada)).toEqual([ada]);
  });
});
