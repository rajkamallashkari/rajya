export interface PushPayload {
  account_id?: number;
  body?: string;
  conversation_id?: number;
  tag?: string;
  title?: string;
  url?: string;
}

export interface PushEventLike {
  data: { json: () => PushPayload } | null;
  waitUntil: (promise: Promise<unknown>) => void;
}

export interface NotificationClickEventLike {
  action?: string;
  notification: { data?: PushPayload; close: () => void };
  waitUntil: (promise: Promise<unknown>) => void;
}

export interface WindowClientLike {
  focused?: boolean;
  navigate?: (url: string) => Promise<unknown>;
  url?: string;
  focus: () => Promise<unknown>;
  postMessage?: (data: unknown) => void;
}

export interface PushClients {
  matchAll: (options?: { type?: string; includeUncontrolled?: boolean }) => Promise<WindowClientLike[]>;
  openWindow: (url: string) => Promise<WindowClientLike | null>;
}

export interface ShowNotificationScope {
  registration: {
    showNotification: (title: string, options?: NotificationOptions) => Promise<void>;
  };
}

export function parsePushData(event: PushEventLike): PushPayload {
  try {
    return event.data?.json() ?? {};
  } catch {
    return {};
  }
}

export async function handlePush(event: PushEventLike, scope: ShowNotificationScope): Promise<void> {
  const payload = parsePushData(event);
  const title = payload.title ?? "";
  await scope.registration.showNotification(title, {
    body: payload.body,
    data: payload,
    tag: payload.tag,
  });
}

export async function handleNotificationClick(
  event: NotificationClickEventLike,
  clients: PushClients,
): Promise<void> {
  event.notification.close();
  const url = event.notification.data?.url || "/";
  const existing = await clients.matchAll({ type: "window", includeUncontrolled: true });
  const match = existing.find((client) => client.url?.includes(url) || client.focused);
  if (match?.navigate) {
    await match.navigate(url);
    await match.focus();
    return;
  }
  if (match) {
    await match.focus();
    return;
  }
  await clients.openWindow(url);
}
