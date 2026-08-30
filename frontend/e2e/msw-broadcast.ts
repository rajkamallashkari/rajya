import type { BrowserContext } from "@playwright/test";

declare global {
  interface Window {
    __rajyaInjectBroadcast?: (name: string, data: unknown) => void;
    __rajyaOnBroadcast?: (name: string, data: unknown) => Promise<unknown>;
  }
}

/**
 * Playwright browser contexts do not share BroadcastChannel. MSW live sync
 * (`rajya:msw-store`, `rajya:realtime`) runs on that API, so two-account
 * tests need a Node-side relay.
 */
export async function bridgeMswBroadcast(
  contextA: BrowserContext,
  contextB: BrowserContext,
): Promise<void> {
  let queue = Promise.resolve();

  const sendTo = async (target: BrowserContext, name: string, data: unknown) => {
    await Promise.all(
      target.pages().map((page) =>
        page.evaluate(
          ([channelName, payload]) => {
            window.__rajyaInjectBroadcast?.(channelName, payload);
          },
          [name, data] as [string, unknown],
        ),
      ),
    );
  };

  const bind = async (source: BrowserContext, target: BrowserContext) => {
    await source.exposeBinding("__rajyaOnBroadcast", (_source, name: string, data: unknown) => {
      queue = queue.then(() => sendTo(target, name, data));
      return queue;
    });
  };

  await bind(contextA, contextB);
  await bind(contextB, contextA);

  const initScript = () => {
    const Original = window.BroadcastChannel;
    let relayQueue: Promise<unknown> = Promise.resolve();
    window.__rajyaInjectBroadcast = (name, data) => {
      const channel = new Original(name);
      channel.postMessage(data);
      queueMicrotask(() => channel.close());
    };
    window.BroadcastChannel = class extends Original {
      postMessage(data: unknown) {
        super.postMessage(data);
        const relay = window.__rajyaOnBroadcast;
        if (!relay) {
          return;
        }
        relayQueue = relayQueue.then(() => relay(this.name, data));
      }
    };
  };

  await contextA.addInitScript(initScript);
  await contextB.addInitScript(initScript);
}
