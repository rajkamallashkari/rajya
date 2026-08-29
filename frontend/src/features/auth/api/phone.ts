import { apiClient, bearerHeaders, unwrap } from "@/features/auth/api/http";

export async function issuePhoneVerification() {
  return unwrap(
    await apiClient().POST("/api/v1/users/me/phone/verification", { headers: bearerHeaders() }),
    "phone_issue_failed",
  );
}

export async function fetchPhoneVerification() {
  return unwrap(
    await apiClient().GET("/api/v1/users/me/phone/verification", { headers: bearerHeaders() }),
    "phone_status_failed",
  );
}
