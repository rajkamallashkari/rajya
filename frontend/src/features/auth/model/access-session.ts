export interface AccessSession {
  accountId: number;
  hasPasskey: boolean;
  hasPassword: boolean;
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
