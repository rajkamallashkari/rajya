import type { AccessSession } from "@/features/auth/model/access-session";

export function testSession(overrides: Partial<AccessSession> = {}): AccessSession {
  return {
    accountId: 1,
    displayName: "Ada",
    hasPasskey: true,
    hasPassword: true,
    onboarded: true,
    token: "tok",
    username: "ada",
    ...overrides,
  };
}
