declare module "@rails/actioncable" {
  export function createConsumer(url?: string | (() => string)): {
    connection: { isOpen?: () => boolean };
    disconnect: () => void;
    subscriptions: {
      create: (
        params: Record<string, unknown>,
        handlers: {
          connected?: () => void;
          disconnected?: () => void;
          received?: (data: unknown) => void;
        },
      ) => { unsubscribe: () => void };
    };
  };
}
