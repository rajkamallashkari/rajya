import { describe, expect, it } from "vitest";
import {
  CONNECTION_POLL_MS,
  RECONNECT_DELAY_MS,
  RECONNECT_POLL_MS,
  UNMOUNT_GRACE_MS,
} from "./timing";

describe("cable timing", () => {
  it("reads reconnect intervals from the settings registry (BR-110)", () => {
    expect(RECONNECT_DELAY_MS).toBe(800);
    expect(RECONNECT_POLL_MS).toBe(4000);
    expect(CONNECTION_POLL_MS).toBe(3000);
    expect(UNMOUNT_GRACE_MS).toBe(100);
  });
});
