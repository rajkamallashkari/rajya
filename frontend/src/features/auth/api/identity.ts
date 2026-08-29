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
