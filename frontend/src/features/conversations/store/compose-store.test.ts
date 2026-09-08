import { describe, expect, it } from "vitest";
import { useComposeStore, resetComposeStore } from "./compose-store";

describe("compose-store", () => {
  it("opens and resets the compose menu", () => {
    useComposeStore.getState().setMenuOpen(true);
    expect(useComposeStore.getState().menuOpen).toBe(true);
    resetComposeStore();
    expect(useComposeStore.getState().menuOpen).toBe(false);
  });
});
