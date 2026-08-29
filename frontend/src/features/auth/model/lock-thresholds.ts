export const LOCK_STORAGE = {
  hiddenAt: "rajya:appLastHiddenAt",
  lockedAccountIds: "rajya:appLockedAccountIds",
  threshold: "rajya:appLockThreshold",
} as const;

export type LockThreshold = "immediate" | "30s" | "1m" | "5m" | "never";

export const LOCK_THRESHOLD_MS: Record<LockThreshold, number> = {
  immediate: 0,
  "30s": 30_000,
  "1m": 60_000,
  "5m": 300_000,
  never: Number.POSITIVE_INFINITY,
};

export const LOCK_THRESHOLDS = Object.keys(LOCK_THRESHOLD_MS) as LockThreshold[];

export function isLockThreshold(value: string | null): value is LockThreshold {
  return value !== null && value in LOCK_THRESHOLD_MS;
}
