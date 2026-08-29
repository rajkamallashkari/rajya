import { create } from "zustand";
import { assertLock, fetchLockOptions, verifyPasswordLock } from "@/features/auth/api/lock";
import { base64urlToBuffer, serializeAssertionCredential } from "@/features/auth/lib/webauthn";
import { getAccessSession } from "@/features/auth/model/access-session";
import {
  isLockThreshold,
  LOCK_STORAGE,
  LOCK_THRESHOLD_MS,
  type LockThreshold,
} from "@/features/auth/model/lock-thresholds";

export type LockErrorKey = "auth.lock.cloned" | "auth.lock.failed" | "auth.lock.password_incorrect";

export interface LockState {
  lastHiddenAt: number | null;
  locked: boolean;
  lockedAccountIds: number[];
  threshold: LockThreshold;
  unlockErrorKey: LockErrorKey | null;
  unlocking: boolean;
  forceUnlock: () => void;
  isAccountLocked: (accountId: number) => boolean;
  lock: () => void;
  onVisibilityHidden: () => void;
  onVisibilityVisible: () => void;
  setThreshold: (threshold: LockThreshold) => void;
  syncWithActiveAccount: () => void;
  unlockAccount: (accountId: number) => void;
  unlockWithPasskey: () => Promise<LockErrorKey | null>;
  unlockWithPassword: (password: string) => Promise<LockErrorKey | null>;
}

function readThreshold(): LockThreshold {
  const stored = window.localStorage.getItem(LOCK_STORAGE.threshold);
  return isLockThreshold(stored) ? stored : "never";
}

function readLastHiddenAt(): number | null {
  const stored = window.localStorage.getItem(LOCK_STORAGE.hiddenAt);
  if (stored === null) {
    return null;
  }
  const parsed = Number.parseInt(stored, 10);
  return Number.isNaN(parsed) ? null : parsed;
}

export function readLockedAccountIds(): number[] {
  const stored = window.localStorage.getItem(LOCK_STORAGE.lockedAccountIds);
  if (!stored) {
    return [];
  }
  try {
    const parsed: unknown = JSON.parse(stored);
    return Array.isArray(parsed) ? parsed.filter((id): id is number => typeof id === "number") : [];
  } catch {
    return [];
  }
}

function persistLockedAccountIds(ids: number[]): void {
  if (ids.length === 0) {
    window.localStorage.removeItem(LOCK_STORAGE.lockedAccountIds);
    return;
  }
  window.localStorage.setItem(LOCK_STORAGE.lockedAccountIds, JSON.stringify(ids));
}

function activeAccountId(): number | null {
  return getAccessSession()?.accountId ?? null;
}

export function computeInitialLockedIds(): number[] {
  const persisted = readLockedAccountIds();
  if (persisted.length > 0) {
    return persisted;
  }
  if (window.localStorage.getItem("appLocked") === "true") {
    window.localStorage.removeItem("appLocked");
    const id = activeAccountId();
    return id === null ? [] : [id];
  }
  const threshold = readThreshold();
  if (threshold === "never") {
    return [];
  }
  const hiddenAt = readLastHiddenAt();
  if (hiddenAt === null) {
    return [];
  }
  if (Date.now() - hiddenAt < LOCK_THRESHOLD_MS[threshold]) {
    return [];
  }
  const id = activeAccountId();
  return id === null ? [] : [id];
}

function unlockActive(ids: number[]): { locked: boolean; lockedAccountIds: number[] } {
  const activeId = activeAccountId();
  const next = ids.filter((id) => id !== activeId);
  persistLockedAccountIds(next);
  window.localStorage.removeItem(LOCK_STORAGE.hiddenAt);
  return {
    lockedAccountIds: next,
    locked: false,
  };
}

function snapshotLockState(): Pick<
  LockState,
  "lastHiddenAt" | "locked" | "lockedAccountIds" | "threshold" | "unlockErrorKey" | "unlocking"
> {
  const ids = computeInitialLockedIds();
  const activeId = activeAccountId();
  return {
    lockedAccountIds: ids,
    locked: activeId !== null && ids.includes(activeId),
    unlocking: false,
    unlockErrorKey: null,
    threshold: readThreshold(),
    lastHiddenAt: readLastHiddenAt(),
  };
}

export const useLockStore = create<LockState>((set, get) => ({
  ...snapshotLockState(),

  setThreshold: (threshold) => {
    window.localStorage.setItem(LOCK_STORAGE.threshold, threshold);
    set({ threshold });
  },

  onVisibilityHidden: () => {
    const now = Date.now();
    window.localStorage.setItem(LOCK_STORAGE.hiddenAt, String(now));
    set({ lastHiddenAt: now });
  },

  onVisibilityVisible: () => {
    const { threshold } = get();
    if (threshold === "never") {
      return;
    }
    const hiddenAt = readLastHiddenAt();
    if (hiddenAt === null) {
      return;
    }
    if (Date.now() - hiddenAt < LOCK_THRESHOLD_MS[threshold]) {
      return;
    }
    const activeId = activeAccountId();
    if (activeId === null) {
      return;
    }
    const ids = get().lockedAccountIds.includes(activeId)
      ? get().lockedAccountIds
      : [...get().lockedAccountIds, activeId];
    persistLockedAccountIds(ids);
    set({ lockedAccountIds: ids, locked: true, unlockErrorKey: null });
  },

  isAccountLocked: (accountId) => get().lockedAccountIds.includes(accountId),

  syncWithActiveAccount: () => {
    const activeId = activeAccountId();
    set({
      locked: activeId !== null && get().lockedAccountIds.includes(activeId),
      unlockErrorKey: null,
    });
  },

  unlockWithPasskey: async () => {
    set({ unlocking: true, unlockErrorKey: null });
    try {
      const options = await fetchLockOptions();
      const credential = (await navigator.credentials.get({
        publicKey: {
          challenge: base64urlToBuffer(options.challenge),
          allowCredentials: (options.allowCredentials ?? []).map((entry) => ({
            type: (entry.type ?? "public-key") as PublicKeyCredentialType,
            id: base64urlToBuffer(entry.id),
          })),
          userVerification: "required",
        },
      })) as PublicKeyCredential | null;
      if (!credential) {
        throw new Error("no_credential");
      }
      await assertLock(serializeAssertionCredential(credential));
      set({
        ...unlockActive(get().lockedAccountIds),
        unlocking: false,
        unlockErrorKey: null,
        lastHiddenAt: null,
      });
      return null;
    } catch (err: unknown) {
      const apiErr = err as { error?: { code?: string }; name?: string };
      if (apiErr.name === "NotAllowedError") {
        set({ unlocking: false, unlockErrorKey: null });
        return null;
      }
      const key: LockErrorKey =
        apiErr.error?.code === "unauthenticated" ? "auth.lock.cloned" : "auth.lock.failed";
      set({ unlocking: false, unlockErrorKey: key });
      return key;
    }
  },

  unlockWithPassword: async (password) => {
    set({ unlocking: true, unlockErrorKey: null });
    try {
      await verifyPasswordLock(password);
      set({
        ...unlockActive(get().lockedAccountIds),
        unlocking: false,
        unlockErrorKey: null,
        lastHiddenAt: null,
      });
      return null;
    } catch (err: unknown) {
      const code = (err as { error?: { code?: string } }).error?.code;
      const key: LockErrorKey =
        code === "unauthenticated" ? "auth.lock.password_incorrect" : "auth.lock.failed";
      set({ unlocking: false, unlockErrorKey: key });
      return key;
    }
  },

  lock: () => {
    const activeId = activeAccountId();
    if (activeId === null) {
      return;
    }
    const ids = get().lockedAccountIds.includes(activeId)
      ? get().lockedAccountIds
      : [...get().lockedAccountIds, activeId];
    persistLockedAccountIds(ids);
    set({ lockedAccountIds: ids, locked: true, unlockErrorKey: null });
  },

  forceUnlock: () => {
    set({
      ...unlockActive(get().lockedAccountIds),
      unlocking: false,
      unlockErrorKey: null,
      lastHiddenAt: null,
    });
  },

  unlockAccount: (accountId) => {
    const ids = get().lockedAccountIds.filter((id) => id !== accountId);
    persistLockedAccountIds(ids);
    const activeId = activeAccountId();
    set({ lockedAccountIds: ids, locked: activeId !== null && ids.includes(activeId) });
  },
}));

export function resetLockStore(): void {
  useLockStore.setState(snapshotLockState());
}
