import { apiClient, bearerHeaders, unwrap } from "@/features/auth/api/http";

export async function fetchVapidPublicKey() {
  return unwrap(
    await apiClient().GET("/api/v1/push_subscriptions/vapid", { headers: bearerHeaders() }),
    "vapid_failed",
  );
}

export async function registerPushSubscription(body: {
  endpoint: string;
  keys: { auth: string; p256dh: string };
}) {
  return unwrap(
    await apiClient().POST("/api/v1/push_subscriptions", { headers: bearerHeaders(), body }),
    "push_subscribe_failed",
  );
}

export async function unregisterPushSubscription(endpoint: string) {
  return unwrap(
    await apiClient().DELETE("/api/v1/push_subscriptions", {
      headers: bearerHeaders(),
      params: { query: { endpoint } },
    }),
    "push_unsubscribe_failed",
  );
}
