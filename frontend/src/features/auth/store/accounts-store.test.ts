import { describe, expect, it } from "vitest";
import { ACCOUNTS_STORAGE_KEY } from "@/features/auth/model/account-token";
import { getAccessSession } from "@/features/auth/model/access-session";
import { resetAccountsStore, useAccountsStore, type StoredAccount } from "./accounts-store";

function account(id: number, overrides: Partial<StoredAccount> = {}): StoredAccount {
  return {
    displayName: `User ${id}`,
    hasPasskey: false,
    hasPassword: true,
    id,
    onboarded: true,
    token: `tok-${id}`,
    username: `user${id}`,
    ...overrides,
  };
}

function jwt(payload: object): string {
  const encoded = btoa(JSON.stringify(payload))
    .replace(/\+/g, "-")
    .replace(/\//g, "_")
    .replace(/=/g, "");
  return `hdr.${encoded}.sig`;
}

describe("accounts store", () => {
  it("upserts, switches, removes, and hydrates without leaking expired tokens", () => {
    useAccountsStore.getState().upsertAccount(account(1));
    expect(useAccountsStore.getState().activeAccountId).toBe(1);
    expect(getAccessSession()?.token).toBe("tok-1");

    useAccountsStore.getState().upsertAccount(account(2), true);
    expect(useAccountsStore.getState().activeAccountId).toBe(2);
    expect(getAccessSession()?.accountId).toBe(2);

    useAccountsStore.getState().upsertAccount(account(2, { displayName: "Grace" }));
    expect(useAccountsStore.getState().accounts.find((row) => row.id === 2)?.displayName).toBe(
      "Grace",
    );
    useAccountsStore.getState().upsertAccount(account(7));
    expect(useAccountsStore.getState().activeAccountId).toBe(2);

    useAccountsStore.getState().setActive(1);
    expect(getAccessSession()?.accountId).toBe(1);
    useAccountsStore.getState().setActive(99);

    useAccountsStore.getState().removeAccount(1);
    expect(useAccountsStore.getState().activeAccountId).toBe(2);
    useAccountsStore.getState().removeAccount(2);
    expect(useAccountsStore.getState().activeAccountId).toBe(7);
    useAccountsStore.getState().removeAccount(7);
    expect(useAccountsStore.getState().activeAccountId).toBeNull();
    expect(getAccessSession()).toBeNull();

    useAccountsStore.getState().upsertAccount(account(3));
    useAccountsStore.getState().upsertAccount(account(4));
    useAccountsStore.getState().removeAccount(4);
    expect(useAccountsStore.getState().activeAccountId).toBe(3);
    useAccountsStore.getState().removeAll();
    expect(useAccountsStore.getState().accounts).toEqual([]);

    window.localStorage.setItem(ACCOUNTS_STORAGE_KEY, "{");
    useAccountsStore.getState().hydrate();
    expect(useAccountsStore.getState().accounts).toEqual([]);

    window.localStorage.setItem(ACCOUNTS_STORAGE_KEY, "null");
    useAccountsStore.getState().hydrate();
    expect(useAccountsStore.getState().accounts).toEqual([]);

    window.localStorage.setItem(ACCOUNTS_STORAGE_KEY, "[]");
    useAccountsStore.getState().hydrate();
    expect(useAccountsStore.getState().accounts).toEqual([]);

    window.localStorage.setItem(ACCOUNTS_STORAGE_KEY, JSON.stringify({ accounts: "nope" }));
    useAccountsStore.getState().hydrate();
    expect(useAccountsStore.getState().accounts).toEqual([]);

    window.localStorage.setItem(
      ACCOUNTS_STORAGE_KEY,
      JSON.stringify({
        accounts: [account(5, { token: jwt({ exp: 1 }) }), account(6), { id: "bad" }, null, "skip"],
        activeAccountId: 5,
      }),
    );
    useAccountsStore.getState().hydrate();
    expect(useAccountsStore.getState().accounts.map((row) => row.id)).toEqual([6]);
    expect(useAccountsStore.getState().activeAccountId).toBe(6);

    resetAccountsStore();
    expect(window.localStorage.getItem(ACCOUNTS_STORAGE_KEY)).toBeNull();
  });
});
