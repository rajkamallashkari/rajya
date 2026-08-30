import { describe, expect, it, vi } from "vitest";
import { setAccessSession } from "@/features/auth/model/access-session";
import {
  cableUrl,
  getCableConsumer,
  isCableConnected,
  resetCableConsumer,
  resetCableFactory,
  setCableFactory,
} from "./consumer";
import { testSession } from "@/test/access-session";

describe("cable consumer", () => {
  it("builds a tokenized ws url and reuses the consumer until reset", () => {
    setAccessSession(testSession({ token: "jwt" }));
    expect(cableUrl()).toContain("/cable?token=jwt");
    setAccessSession(null);
    expect(cableUrl()).toMatch(/ws:\/\/.*\/cable$/);
    const first = getCableConsumer();
    expect(getCableConsumer()).toBe(first);
    resetCableConsumer();
    expect(isCableConnected()).toBe(false);
  });

  it("uses wss when the page is https", () => {
    const original = window.location;
    Object.defineProperty(window, "location", {
      configurable: true,
      value: { ...original, protocol: "https:", host: "rajya.pages.dev" },
    });
    expect(cableUrl()).toBe("wss://rajya.pages.dev/cable");
    Object.defineProperty(window, "location", { configurable: true, value: original });
  });

  it("reports connection state and treats isOpen throws as disconnected", () => {
    setCableFactory(() => ({
      connection: {
        isOpen: () => {
          throw new Error("closed");
        },
      },
      disconnect: vi.fn(),
      subscriptions: { create: vi.fn() },
    }));
    getCableConsumer();
    expect(isCableConnected()).toBe(false);
    setCableFactory(() => ({
      connection: { isOpen: () => true },
      disconnect: vi.fn(),
      subscriptions: { create: vi.fn() },
    }));
    getCableConsumer();
    expect(isCableConnected()).toBe(true);
    setCableFactory(() => ({
      connection: {},
      disconnect: vi.fn(),
      subscriptions: { create: vi.fn() },
    }));
    getCableConsumer();
    expect(isCableConnected()).toBe(false);
  });

  it("restores the default factory", () => {
    resetCableFactory();
    const restored = getCableConsumer();
    expect(typeof restored.disconnect).toBe("function");
    expect(typeof restored.subscriptions.create).toBe("function");
  });
});
