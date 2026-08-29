import type { SerializedAttestation } from "@/features/auth/lib/webauthn";
import { apiClient, bearerHeaders, unwrap } from "@/features/auth/api/http";

export async function fetchRegistrationOptions() {
  return unwrap(
    await apiClient().POST("/api/v1/passkeys/registration_options", { headers: bearerHeaders() }),
    "registration_options_failed",
  );
}

export async function registerPasskey(nickname: string, credential: SerializedAttestation) {
  return unwrap(
    await apiClient().POST("/api/v1/passkeys/register", {
      headers: bearerHeaders(),
      body: { nickname, credential },
    }),
    "register_passkey_failed",
  );
}
