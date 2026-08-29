import type { SerializedAssertion } from "@/features/auth/lib/webauthn";
import { apiClient, bearerHeaders, unwrap } from "@/features/auth/api/http";

export async function fetchLockOptions() {
  return unwrap(
    await apiClient().POST("/api/v1/passkeys/lock_options", {
      headers: bearerHeaders(),
    }),
    "lock_options_failed",
  );
}

export async function assertLock(credential: SerializedAssertion): Promise<void> {
  unwrap(
    await apiClient().POST("/api/v1/passkeys/assert_lock", {
      headers: bearerHeaders(),
      body: { credential },
    }),
    "assert_lock_failed",
  );
}

export async function verifyPasswordLock(password: string): Promise<void> {
  unwrap(
    await apiClient().POST("/api/v1/users/me/verify_password", {
      headers: bearerHeaders(),
      body: { password },
    }),
    "verify_password_failed",
  );
}
