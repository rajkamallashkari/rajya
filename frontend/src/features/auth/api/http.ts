import { getAccessSession } from "@/features/auth/model/access-session";
import { createApiClient } from "@/shared/lib/api/client";
import { apiOrigin } from "@/shared/lib/api/origin";

export function apiClient() {
  return createApiClient(apiOrigin());
}

export function bearerHeaders(): Record<string, string> {
  const token = getAccessSession()?.token;
  return token ? { Authorization: `Bearer ${token}` } : {};
}

export function unwrap<T>(result: { data?: T; error?: unknown }, fallback: string): T {
  if (result.error || result.data === undefined) {
    throw result.error ?? new Error(fallback);
  }
  return result.data;
}
