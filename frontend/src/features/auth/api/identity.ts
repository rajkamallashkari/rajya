import { apiClient, bearerHeaders, unwrap } from "@/features/auth/api/http";

export async function fetchMe() {
  return unwrap(
    await apiClient().GET("/api/v1/users/me", { headers: bearerHeaders() }),
    "me_failed",
  );
}

export async function updateProfile(body: {
  bio?: string;
  display_name?: string;
  username?: string;
}) {
  return unwrap(
    await apiClient().PATCH("/api/v1/users/me", { headers: bearerHeaders(), body }),
    "profile_failed",
  );
}

export async function completeOnboarding() {
  return unwrap(
    await apiClient().POST("/api/v1/users/me/complete_onboarding", { headers: bearerHeaders() }),
    "onboarding_failed",
  );
}

export async function checkUsername(username: string) {
  return unwrap(
    await apiClient().GET("/api/v1/accounts/username", {
      headers: bearerHeaders(),
      params: { query: { username } },
    }),
    "username_failed",
  );
}

export async function setPassword(password: string, passwordConfirmation: string) {
  return unwrap(
    await apiClient().PATCH("/api/v1/users/me/password", {
      headers: bearerHeaders(),
      body: { password, password_confirmation: passwordConfirmation },
    }),
    "password_failed",
  );
}

export async function fetchAccount(id: number) {
  const result = await apiClient().GET("/api/v1/accounts/{id}", {
    headers: bearerHeaders(),
    params: { path: { id } },
  });
  if (result.error || result.data === undefined) {
    return { account: null, missing: true as const };
  }
  return { account: result.data, missing: false as const };
}

export async function loginWithPassword(email: string, password: string) {
  return unwrap(
    await apiClient().POST("/auth/login", { body: { email, password } }),
    "login_failed",
  );
}

export async function loginWithGoogle(code: string) {
  return unwrap(await apiClient().POST("/auth/google", { body: { code } }), "google_failed");
}

export async function requestOtp(email: string) {
  return unwrap(
    await apiClient().POST("/auth/otp/request", { body: { email } }),
    "otp_request_failed",
  );
}

export async function verifyOtp(email: string, code: string) {
  return unwrap(
    await apiClient().POST("/auth/otp/verify", { body: { email, code } }),
    "otp_verify_failed",
  );
}

export async function requestMagicLink(email: string) {
  return unwrap(
    await apiClient().POST("/auth/magic_link/request", { body: { email } }),
    "magic_request_failed",
  );
}

export async function verifyMagicLink(token: string) {
  return unwrap(
    await apiClient().POST("/auth/magic_link/verify", { body: { token } }),
    "magic_verify_failed",
  );
}

export async function registerWithPassword(body: {
  email: string;
  name: string;
  password: string;
  password_confirmation: string;
}) {
  return unwrap(await apiClient().POST("/auth/register", { body }), "register_failed");
}
