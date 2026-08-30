import { waitFor } from "@testing-library/react";
import { describe, expect, it, vi } from "vitest";

describe("bootstrap", () => {
  it("no-ops without a root and mounts when present", async () => {
    vi.resetModules();
    vi.doMock("@/shared/lib/api/msw/start-browser", () => ({
      defaultStartMsw: vi.fn().mockResolvedValue(undefined),
    }));
    const { bootstrap, mount } = await import("./main");
    await bootstrap(document);

    const root = document.createElement("div");
    root.id = "root";
    document.body.append(root);

    const register = vi.fn().mockResolvedValue({ scope: "/" });
    Object.defineProperty(window.navigator, "serviceWorker", {
      configurable: true,
      value: { register },
    });
    vi.stubGlobal("fetch", async () => ({ ok: false, json: async () => ({}) }));

    await bootstrap(document);
    await waitFor(() => {
      expect(root.childNodes.length > 0).toBe(true);
    });
    await mount(root, "1");
    vi.unstubAllGlobals();
  });
});
