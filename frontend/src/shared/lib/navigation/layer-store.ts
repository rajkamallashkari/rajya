import { create } from "zustand";
import { abortAllLayers } from "@/shared/lib/navigation/layer-stack";

export type LayerKind = "conversation" | "profile";

export interface LayerEntry {
  conversationId: string;
  id: string;
  kind: LayerKind;
  title: string;
}

interface LayerState {
  clearLayers: () => void;
  layers: LayerEntry[];
  openConversation: (layer: LayerEntry) => void;
  popLayer: () => void;
  pushLayer: (layer: LayerEntry) => void;
}

export function partitionLayers(layers: LayerEntry[]): {
  conversation: LayerEntry | undefined;
  details: LayerEntry[];
} {
  return {
    conversation: layers.find((layer) => layer.kind === "conversation"),
    details: layers.filter((layer) => layer.kind !== "conversation"),
  };
}

export function conversationLayer(conversationId: string, title: string): LayerEntry {
  return {
    conversationId,
    id: `conversation:${conversationId}`,
    kind: "conversation",
    title,
  };
}

export function layersForOpenConversation(layers: LayerEntry[], next: LayerEntry): LayerEntry[] {
  const current = layers.find((layer) => layer.kind === "conversation");
  if (current?.conversationId === next.conversationId) {
    const index = layers.findIndex((layer) => layer.kind === "conversation");
    return layers.slice(0, index + 1);
  }
  return [next];
}

export const useLayerStore = create<LayerState>((set, get) => ({
  layers: [],
  openConversation: (layer) => {
    const current = get().layers.find((entry) => entry.kind === "conversation");
    if (!current || current.conversationId !== layer.conversationId) {
      abortAllLayers();
    }
    set((state) => {
      const next = layersForOpenConversation(state.layers, layer);
      if (
        next.length === state.layers.length &&
        next.every((entry, index) => entry.id === state.layers[index]?.id)
      ) {
        return state;
      }
      return { layers: next };
    });
  },
  pushLayer: (layer) => {
    if (layer.kind === "conversation") {
      get().openConversation(layer);
      return;
    }
    set((state) => {
      if (state.layers.some((entry) => entry.id === layer.id)) {
        return state;
      }
      return { layers: [...state.layers, layer] };
    });
  },
  popLayer: () => {
    set((state) => ({ layers: state.layers.slice(0, -1) }));
  },
  clearLayers: () => {
    abortAllLayers();
    set({ layers: [] });
  },
}));

export function resetLayerStore(): void {
  abortAllLayers();
  useLayerStore.setState({ layers: [] });
}
