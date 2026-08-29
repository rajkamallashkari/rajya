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
  popLayer: () => void;
  pushLayer: (layer: LayerEntry) => void;
}

export const useLayerStore = create<LayerState>((set) => ({
  layers: [],
  pushLayer: (layer) => {
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
