import { create } from "zustand";
import { abortAllLayers } from "@/shared/lib/navigation/layer-stack";

export type LayerKind =
  | "compose_group"
  | "compose_message"
  | "conversation"
  | "gallery"
  | "profile"
  | "scheduled"
  | "settings";

const COMPOSE_KINDS = new Set<LayerKind>(["compose_group", "compose_message"]);

export interface LayerEntry {
  accountId?: string;
  conversationId: string;
  focusMessageId?: string;
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

export function conversationLayer(
  conversationId: string,
  title: string,
  focusMessageId?: string,
): LayerEntry {
  return {
    conversationId,
    focusMessageId,
    id: `conversation:${conversationId}`,
    kind: "conversation",
    title,
  };
}

export const SETTINGS_LAYER_ID = "settings";
export const COMPOSE_MESSAGE_LAYER_ID = "compose_message";
export const COMPOSE_GROUP_LAYER_ID = "compose_group";

export function settingsLayer(title: string): LayerEntry {
  return {
    conversationId: SETTINGS_LAYER_ID,
    id: SETTINGS_LAYER_ID,
    kind: "settings",
    title,
  };
}

export function scheduledMessagesLayer(conversationId: string, title: string): LayerEntry {
  return {
    conversationId,
    id: `scheduled:${conversationId}`,
    kind: "scheduled",
    title,
  };
}

export function composeMessageLayer(title: string): LayerEntry {
  return {
    conversationId: COMPOSE_MESSAGE_LAYER_ID,
    id: COMPOSE_MESSAGE_LAYER_ID,
    kind: "compose_message",
    title,
  };
}

export function composeGroupLayer(title: string): LayerEntry {
  return {
    conversationId: COMPOSE_GROUP_LAYER_ID,
    id: COMPOSE_GROUP_LAYER_ID,
    kind: "compose_group",
    title,
  };
}

export function layersForOpenConversation(_layers: LayerEntry[], next: LayerEntry): LayerEntry[] {
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
        next.every(
          (entry, index) =>
            entry.id === state.layers[index]?.id &&
            entry.focusMessageId === state.layers[index]?.focusMessageId,
        )
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
      const base = COMPOSE_KINDS.has(layer.kind)
        ? state.layers.filter((entry) => !COMPOSE_KINDS.has(entry.kind))
        : state.layers;
      return { layers: [...base, layer] };
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
