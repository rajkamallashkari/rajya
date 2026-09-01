import {
  beginImpersonation,
  endImpersonation,
  type AccessSession,
} from "@/features/auth/model/access-session";
import type { components } from "@/shared/lib/api/schema";
import { useShellStore } from "@/features/settings/store/shell-store";

type Session = components["schemas"]["Session"];

export function sessionToAccess(payload: Session): AccessSession {
  return {
    accountId: payload.account.id,
    displayName: payload.account.display_name,
    hasPasskey: payload.user.has_passkey,
    hasPassword: payload.user.has_password,
    onboarded: payload.user.onboarded,
    token: payload.token,
    username: payload.account.username,
  };
}

export function startImpersonation(payload: Session): void {
  beginImpersonation(sessionToAccess(payload));
  useShellStore.getState().setImpersonatingName(payload.account.display_name);
}

export function stopImpersonationLocally(): void {
  endImpersonation();
  useShellStore.getState().setImpersonatingName(null);
}
