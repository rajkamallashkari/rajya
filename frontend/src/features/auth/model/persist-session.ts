import { getAccessSession } from "@/features/auth/model/access-session";
import { useAccountsStore, type StoredAccount } from "@/features/auth/store/accounts-store";

export function persistSession(payload: {
  account: { display_name: string; id: number; username: string };
  token?: string;
  user: { has_passkey: boolean; has_password: boolean; onboarded: boolean };
}): void {
  const token = payload.token ?? getAccessSession()?.token;
  if (!token) {
    throw new Error("session_token_missing");
  }
  const account: StoredAccount = {
    displayName: payload.account.display_name,
    hasPasskey: payload.user.has_passkey,
    hasPassword: payload.user.has_password,
    id: payload.account.id,
    onboarded: payload.user.onboarded,
    token,
    username: payload.account.username,
  };
  useAccountsStore.getState().upsertAccount(account, true);
}
