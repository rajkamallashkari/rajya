export interface AccessSession {
  accountId: number;
  displayName: string;
  hasPasskey: boolean;
  hasPassword: boolean;
  onboarded: boolean;
  token: string;
  username: string;
}

let session: AccessSession | null = null;
let originalSession: AccessSession | null = null;
let impersonating = false;

export function getAccessSession(): AccessSession | null {
  return session;
}

export function setAccessSession(next: AccessSession | null): void {
  session = next;
}

export function beginImpersonation(next: AccessSession): void {
  if (!impersonating) {
    originalSession = session;
    impersonating = true;
  }
  session = next;
}

export function endImpersonation(): void {
  if (impersonating) {
    session = originalSession;
  }
  originalSession = null;
  impersonating = false;
}

export function isImpersonating(): boolean {
  return impersonating;
}
