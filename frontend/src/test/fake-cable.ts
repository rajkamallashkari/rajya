import {
  getCableConsumer,
  setCableFactory,
  type CableConsumer,
  type CableHandlers,
  type CableSubscription,
} from "@/shared/lib/cable/consumer";

export interface FakeSubscription extends CableSubscription {
  handlers: CableHandlers;
  params: Record<string, unknown>;
  unsubscribed: boolean;
}

export class FakeCable {
  public disconnects = 0;
  public open = false;
  public readonly subscriptions: FakeSubscription[] = [];

  public consumer(): CableConsumer {
    return {
      connection: {
        isOpen: () => this.open,
      },
      disconnect: () => {
        this.open = false;
        this.disconnects += 1;
      },
      subscriptions: {
        create: (params, handlers) => {
          const subscription: FakeSubscription = {
            handlers,
            params,
            unsubscribed: false,
            unsubscribe: () => {
              subscription.unsubscribed = true;
            },
          };
          this.subscriptions.push(subscription);
          return subscription;
        },
      },
    };
  }

  public connectAll(): void {
    this.open = true;
    for (const subscription of this.subscriptions) {
      if (!subscription.unsubscribed) {
        subscription.handlers.connected?.();
      }
    }
  }

  public disconnectAll(): void {
    this.open = false;
    for (const subscription of this.subscriptions) {
      if (!subscription.unsubscribed) {
        subscription.handlers.disconnected?.();
      }
    }
  }

  public emit(data: unknown): void {
    for (const subscription of this.subscriptions) {
      if (!subscription.unsubscribed) {
        subscription.handlers.received?.(data);
      }
    }
  }
}

let installed: FakeCable = new FakeCable();

export function installTestCable(): FakeCable {
  installed = new FakeCable();
  setCableFactory(() => installed.consumer());
  getCableConsumer();
  return installed;
}

export function testCable(): FakeCable {
  return installed;
}
