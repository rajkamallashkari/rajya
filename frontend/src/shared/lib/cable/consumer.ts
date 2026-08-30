import { createConsumer } from "@rails/actioncable";
import { getAccessSession } from "@/features/auth/model/access-session";

export interface CableHandlers {
  connected?: () => void;
  disconnected?: () => void;
  received?: (data: unknown) => void;
}

export interface CableSubscription {
  unsubscribe: () => void;
}

export interface CableConsumer {
  connection: { isOpen?: () => boolean };
  disconnect: () => void;
  subscriptions: {
    create: (params: Record<string, unknown>, handlers: CableHandlers) => CableSubscription;
  };
}

export type CableFactory = (url: () => string) => CableConsumer;

let factory: CableFactory = defaultFactory;
let consumer: CableConsumer | null = null;

function defaultFactory(url: () => string): CableConsumer {
  return createConsumer(url);
}

export function cableUrl(): string {
  const protocol = window.location.protocol === "https:" ? "wss:" : "ws:";
  const token = getAccessSession()?.token;
  const base = `${protocol}//${window.location.host}/cable`;
  return token ? `${base}?token=${encodeURIComponent(token)}` : base;
}

export function getCableConsumer(): CableConsumer {
  consumer ??= factory(cableUrl);
  return consumer;
}

export function resetCableConsumer(): void {
  consumer?.disconnect();
  consumer = null;
}

export function isCableConnected(): boolean {
  try {
    return consumer?.connection.isOpen?.() ?? false;
  } catch {
    return false;
  }
}

export function setCableFactory(next: CableFactory): void {
  resetCableConsumer();
  factory = next;
}

export function resetCableFactory(): void {
  setCableFactory(defaultFactory);
}
