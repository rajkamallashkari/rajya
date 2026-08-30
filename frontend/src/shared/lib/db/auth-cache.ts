import { deleteRecord, getRecord, putRecord } from "./account-db";
import { AUTH_CACHE_KEY, type AuthCacheRecord } from "./schema";

export interface AuthCache {
  accountId: number;
  apiUrl: string;
  token: string;
}

export async function setAuthCache(accountId: number, cache: AuthCache): Promise<void> {
  await putRecord(accountId, "keyval", {
    ...cache,
    id: AUTH_CACHE_KEY,
  });
}

export async function getAuthCache(accountId: number): Promise<AuthCache | undefined> {
  const record = await getRecord<AuthCacheRecord>(accountId, "keyval", AUTH_CACHE_KEY);
  if (!record) {
    return undefined;
  }
  return {
    accountId: record.accountId,
    apiUrl: record.apiUrl,
    token: record.token,
  };
}

export async function clearAuthCache(accountId: number): Promise<void> {
  await deleteRecord(accountId, "keyval", AUTH_CACHE_KEY);
}
