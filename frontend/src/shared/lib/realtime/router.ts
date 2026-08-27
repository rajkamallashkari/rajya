export type RealtimeEvent = { type: "connected" } | { type: "disconnected" };

export interface QueryCacheWriter {
  invalidateQueries: (filters: { queryKey: readonly string[] }) => Promise<void> | void;
}

export async function routeRealtimeEvent(
  event: RealtimeEvent,
  cache: QueryCacheWriter,
): Promise<void> {
  switch (event.type) {
    case "connected":
      await cache.invalidateQueries({ queryKey: ["realtime", "connection"] });
      return;
    case "disconnected":
      await cache.invalidateQueries({ queryKey: ["realtime", "connection"] });
      return;
    default: {
      const exhaustive: never = event;
      throw new Error(String(exhaustive));
    }
  }
}
