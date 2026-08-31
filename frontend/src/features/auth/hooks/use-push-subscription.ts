import { useEffect } from "react";
import {
  fetchVapidPublicKey,
  registerPushSubscription,
  unregisterPushSubscription,
} from "@/features/auth/api/push";
import { useAccountsStore } from "@/features/auth/store/accounts-store";
import { createPushSubscription } from "@/shared/lib/pwa/subscribe";

let lastEndpoint: string | null = null;

export async function syncWebPush(
  accountId: number | null,
  worker: Pick<Navigator, "serviceWorker"> | undefined,
  notifications: { permission: NotificationPermission; requestPermission: () => Promise<NotificationPermission> },
): Promise<void> {
  if (accountId == null) {
    if (lastEndpoint) {
      try {
        await unregisterPushSubscription(lastEndpoint);
      } catch {
        /* signed out — ignore */
      }
      lastEndpoint = null;
    }
    return;
  }
  if (!worker?.serviceWorker) {
    return;
  }
  try {
    const vapid = await fetchVapidPublicKey();
    if (!vapid.public_key) {
      return;
    }
    const registration = await worker.serviceWorker.ready;
    const json = await createPushSubscription(registration, vapid.public_key, notifications);
    const endpoint = json?.endpoint;
    const p256dh = json?.keys?.p256dh;
    const auth = json?.keys?.auth;
    if (!endpoint || !p256dh || !auth) {
      return;
    }
    await registerPushSubscription({ endpoint, keys: { p256dh, auth } });
    lastEndpoint = endpoint;
  } catch {
    /* permission or network — ignore */
  }
}

export function resetWebPushEndpoint(): void {
  lastEndpoint = null;
}

export function usePushSubscription(): void {
  const accountId = useAccountsStore((state) => state.activeAccountId);
  useEffect(() => {
    const notifications =
      typeof Notification === "undefined"
        ? {
            permission: "denied" as const,
            requestPermission: async () => "denied" as const,
          }
        : Notification;
    void syncWebPush(accountId, navigator, notifications);
  }, [accountId]);
}
