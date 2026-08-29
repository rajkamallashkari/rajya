import type { SerializedAssertion } from "@/features/auth/lib/webauthn";
import { getAccessSession } from "@/features/auth/model/access-session";
import { createApiClient } from "@/shared/lib/api/client";

function client() {
  return createApiClient(window.location.origin);
}

function bearer(): Record<string, string> {
  const token = getAccessSession()?.token;
  return token ? { Authorization: `Bearer ${token}` } : {};
}

export async function fetchLockOptions() {
  const { data, error } = await client().POST("/api/v1/passkeys/lock_options", {
    headers: bearer(),
  });
  if (error || data === undefined) {
    throw error ?? new Error("lock_options_failed");
  }
  return data;
}

export async function assertLock(credential: SerializedAssertion): Promise<void> {
  const { error } = await client().POST("/api/v1/passkeys/assert_lock", {
    headers: bearer(),
    body: { credential },
  });
  if (error) {
    throw error;
  }
}

export async function verifyPasswordLock(password: string): Promise<void> {
  const { error } = await client().POST("/api/v1/users/me/verify_password", {
    headers: bearer(),
    body: { password },
  });
  if (error) {
    throw error;
  }
}
