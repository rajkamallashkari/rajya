import { apiClient, bearerHeaders, unwrap } from "@/features/auth/api/http";
import type { components } from "@/shared/lib/api/schema";

export type Preferences = components["schemas"]["Preferences"];

export async function getPreferences() {
  return unwrap(
    await apiClient().GET("/api/v1/preferences", { headers: bearerHeaders() }),
    "preferences_failed",
  );
}

export async function updatePreferences(data: Record<string, unknown>) {
  return unwrap(
    await apiClient().PATCH("/api/v1/preferences", {
      headers: bearerHeaders(),
      body: { data },
    }),
    "preferences_failed",
  );
}
