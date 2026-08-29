import { describe, expect, it } from "vitest";
import {
  isLockThreshold,
  LOCK_STORAGE,
  LOCK_THRESHOLD_MS,
  LOCK_THRESHOLDS,
} from "./lock-thresholds";

describe("lock-thresholds", () => {
  it("lists every threshold and rejects unknown values", () => {
    expect(LOCK_THRESHOLDS).toEqual(["immediate", "30s", "1m", "5m", "never"]);
    expect(LOCK_THRESHOLD_MS.immediate).toBe(0);
    expect(LOCK_THRESHOLD_MS.never).toBe(Number.POSITIVE_INFINITY);
    expect(LOCK_STORAGE.threshold).toBe("rajya:appLockThreshold");
    expect(isLockThreshold("1m")).toBe(true);
    expect(isLockThreshold("hourly")).toBe(false);
    expect(isLockThreshold(null)).toBe(false);
  });
});
