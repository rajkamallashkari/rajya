import { shouldStartMsw } from "@/shared/lib/api/msw/flag";

const REALTIME_CHANNEL = "rajya:realtime";

export function publishMswRealtime(event: unknown): void {
  if (!shouldStartMsw(import.meta.env.VITE_MSW) || typeof BroadcastChannel === "undefined") {
    return;
  }
  const channel = new BroadcastChannel(REALTIME_CHANNEL);
  channel.postMessage(event);
  channel.close();
}

export function subscribeMswRealtime(onEvent: (data: unknown) => void): () => void {
  if (!shouldStartMsw(import.meta.env.VITE_MSW) || typeof BroadcastChannel === "undefined") {
    return () => undefined;
  }
  const channel = new BroadcastChannel(REALTIME_CHANNEL);
  channel.onmessage = (event: MessageEvent<unknown>) => {
    onEvent(event.data);
  };
  return () => channel.close();
}
