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

export function getAccessSession(): AccessSession | null {
  return session;
}

export function setAccessSession(next: AccessSession | null): void {
  session = next;
}
