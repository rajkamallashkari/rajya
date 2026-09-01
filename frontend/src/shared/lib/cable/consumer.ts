import { createConsumer } from "@rails/actioncable";
import { getAccessSession } from "@/features/auth/model/access-session";
import { apiOrigin, cableHttpToWs } from "@/shared/lib/api/origin";

export interface CableHandlers {
  connected?: () => void;
  disconnected?: () => void;
  received?: (data: unknown) => void;
}

export interface CableSubscription {
  unsubscribe: () => void;
  perform: (action: string, data?: Record<string, unknown>) => void;
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
  const token = getAccessSession()?.token;
  const base = `${cableHttpToWs(apiOrigin())}/cable`;
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
