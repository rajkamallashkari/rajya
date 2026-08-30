import { describe, expect, it, vi } from "vitest";
import { publishMswRealtime, subscribeMswRealtime } from "./msw-bridge";

describe("msw realtime bridge", () => {
  it("no-ops when MSW is off", () => {
    const received: unknown[] = [];
    const stop = subscribeMswRealtime((data) => received.push(data));
    publishMswRealtime({ type: "typing" });
    stop();
    expect(received).toEqual([]);
  });

  it("relays events when MSW is on and BroadcastChannel exists", () => {
    const listeners: Array<(event: MessageEvent<unknown>) => void> = [];
    const close = vi.fn();
    vi.stubEnv("VITE_MSW", "1");
    vi.stubGlobal(
      "BroadcastChannel",
      class {
        public onmessage: ((event: MessageEvent<unknown>) => void) | null = null;
        public postMessage(data: unknown): void {
          for (const listener of listeners) {
            listener({ data } as MessageEvent<unknown>);
          }
        }
        public close(): void {
          close();
        }
        constructor() {
          listeners.push((event) => this.onmessage?.(event));
        }
      },
    );
    const received: unknown[] = [];
    const stop = subscribeMswRealtime((data) => received.push(data));
    publishMswRealtime({ type: "typing", conversation_id: 1 });
    stop();
    expect(received).toEqual([{ type: "typing", conversation_id: 1 }]);
    expect(close).toHaveBeenCalled();
    vi.unstubAllEnvs();
    vi.unstubAllGlobals();
  });

  it("no-ops when BroadcastChannel is missing even with MSW on", () => {
    vi.stubEnv("VITE_MSW", "1");
    vi.stubGlobal("BroadcastChannel", undefined);
    const stop = subscribeMswRealtime(() => undefined);
    publishMswRealtime({ type: "typing" });
    stop();
    vi.unstubAllEnvs();
    vi.unstubAllGlobals();
  });
});
