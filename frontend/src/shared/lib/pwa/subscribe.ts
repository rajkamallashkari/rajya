import { urlBase64ToUint8Array } from "./vapid";

export interface PushPermissionHost {
  permission: NotificationPermission;
  requestPermission: () => Promise<NotificationPermission>;
}

export async function createPushSubscription(
  registration: { pushManager: PushManager },
  publicKey: string,
  notifications: PushPermissionHost,
): Promise<PushSubscriptionJSON | null> {
  const permission =
    notifications.permission === "granted"
      ? "granted"
      : notifications.permission === "denied"
        ? "denied"
        : await notifications.requestPermission();
  if (permission !== "granted" || publicKey.length === 0) {
    return null;
  }
  const subscription = await registration.pushManager.subscribe({
    userVisibleOnly: true,
    applicationServerKey: urlBase64ToUint8Array(publicKey),
  });
  return subscription.toJSON();
}
