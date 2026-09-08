import type { SerializedAssertion, SerializedAttestation } from "@/features/auth/lib/webauthn";
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

export async function listPasskeys() {
  return unwrap(
    await apiClient().GET("/api/v1/passkeys", { headers: bearerHeaders() }),
    "passkeys_failed",
  );
}

export async function renamePasskey(id: number, nickname: string) {
  return unwrap(
    await apiClient().PATCH("/api/v1/passkeys/{id}", {
      headers: bearerHeaders(),
      params: { path: { id } },
      body: { nickname },
    }),
    "passkey_rename_failed",
  );
}

export async function destroyPasskey(id: number) {
  return unwrap(
    await apiClient().DELETE("/api/v1/passkeys/{id}", {
      headers: bearerHeaders(),
      params: { path: { id } },
    }),
    "passkey_destroy_failed",
  );
}

export async function fetchAuthenticationOptions(email?: string) {
  return unwrap(
    await apiClient().POST("/auth/passkeys/authentication_options", {
      body: email ? { email } : {},
    }),
    "authentication_options_failed",
  );
}

export async function authenticatePasskey(nonce: string, credential: SerializedAssertion) {
  return unwrap(
    await apiClient().POST("/auth/passkeys/authenticate", {
      body: { nonce, credential },
    }),
    "authenticate_passkey_failed",
  );
}
