import { create } from "zustand";
import { setAccessSession, type AccessSession } from "@/features/auth/model/access-session";
import { ACCOUNTS_STORAGE_KEY, isJwtExpired } from "@/features/auth/model/account-token";
import { useLockStore } from "@/features/auth/store/lock-store";

export interface StoredAccount {
  displayName: string;
  hasPasskey: boolean;
  hasPassword: boolean;
  id: number;
  onboarded: boolean;
  token: string;
  username: string;
}

interface AccountsState {
  accounts: StoredAccount[];
  activeAccountId: number | null;
  hydrate: () => void;
  removeAccount: (accountId: number) => void;
  removeAll: () => void;
  setActive: (accountId: number) => void;
  upsertAccount: (account: StoredAccount, activate?: boolean) => void;
}

function toSession(account: StoredAccount): AccessSession {
  return {
    accountId: account.id,
    displayName: account.displayName,
    hasPasskey: account.hasPasskey,
    hasPassword: account.hasPassword,
    onboarded: account.onboarded,
    token: account.token,
    username: account.username,
  };
}

function applyActive(account: StoredAccount | undefined): void {
  setAccessSession(account ? toSession(account) : null);
  useLockStore.getState().syncWithActiveAccount();
}

function persist(accounts: StoredAccount[], activeAccountId: number | null): void {
  window.localStorage.setItem(ACCOUNTS_STORAGE_KEY, JSON.stringify({ accounts, activeAccountId }));
}

function readStored(): { accounts: StoredAccount[]; activeAccountId: number | null } {
  const raw = window.localStorage.getItem(ACCOUNTS_STORAGE_KEY);
  if (!raw) {
    return { accounts: [], activeAccountId: null };
  }
  try {
    const parsed: unknown = JSON.parse(raw);
    if (parsed === null || typeof parsed !== "object" || Array.isArray(parsed)) {
      return { accounts: [], activeAccountId: null };
    }
    const record = parsed as { accounts?: unknown; activeAccountId?: unknown };
    const accounts = Array.isArray(record.accounts)
      ? record.accounts.filter(isStoredAccount).filter((account) => !isJwtExpired(account.token))
      : [];
    const activeAccountId =
      typeof record.activeAccountId === "number" &&
      accounts.some((account) => account.id === record.activeAccountId)
        ? record.activeAccountId
        : (accounts[0]?.id ?? null);
    return { accounts, activeAccountId };
  } catch {
    return { accounts: [], activeAccountId: null };
  }
}

function isStoredAccount(value: unknown): value is StoredAccount {
  if (value === null || typeof value !== "object") {
    return false;
  }
  const record = value as Record<string, unknown>;
  return (
    typeof record.id === "number" &&
    typeof record.token === "string" &&
    typeof record.username === "string" &&
    typeof record.displayName === "string" &&
    typeof record.hasPasskey === "boolean" &&
    typeof record.hasPassword === "boolean" &&
    typeof record.onboarded === "boolean"
  );
}

function snapshot(): Pick<AccountsState, "accounts" | "activeAccountId"> {
  return readStored();
}

function commit(
  accounts: StoredAccount[],
  activeAccountId: number | null,
): Pick<AccountsState, "accounts" | "activeAccountId"> {
  persist(accounts, activeAccountId);
  applyActive(accounts.find((account) => account.id === activeAccountId));
  return { accounts, activeAccountId };
}

export const useAccountsStore = create<AccountsState>((set, get) => ({
  ...snapshot(),

  hydrate: () => {
    const next = snapshot();
    persist(next.accounts, next.activeAccountId);
    applyActive(next.accounts.find((account) => account.id === next.activeAccountId));
    set(next);
  },

  upsertAccount: (account, activate = false) => {
    const { accounts, activeAccountId } = get();
    const nextAccounts = accounts.some((row) => row.id === account.id)
      ? accounts.map((row) => (row.id === account.id ? account : row))
      : [...accounts, account];
    const nextActive =
      activate || activeAccountId === null || activeAccountId === account.id
        ? account.id
        : activeAccountId;
    set(commit(nextAccounts, nextActive));
  },

  setActive: (accountId) => {
    const { accounts } = get();
    if (!accounts.some((account) => account.id === accountId)) {
      return;
    }
    set(commit(accounts, accountId));
  },

  removeAccount: (accountId) => {
    const accounts = get().accounts.filter((account) => account.id !== accountId);
    const activeAccountId =
      get().activeAccountId === accountId ? (accounts[0]?.id ?? null) : get().activeAccountId;
    set(commit(accounts, activeAccountId));
  },

  removeAll: () => {
    set(commit([], null));
  },
}));

export function resetAccountsStore(): void {
  window.localStorage.removeItem(ACCOUNTS_STORAGE_KEY);
  applyActive(undefined);
  useAccountsStore.setState({ accounts: [], activeAccountId: null });
}
