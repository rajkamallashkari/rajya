import { describe, expect, it } from "vitest";
import { outboxLockName, resetOutboxLocks, withOutboxLock } from "./lock";

describe("outbox lock", () => {
  it("serializes fallback mutexes per account", async () => {
    expect(outboxLockName(3)).toBe("rajya:outbox:3");
    const order: number[] = [];
    let release: () => void = () => undefined;
    const gate = new Promise<void>((resolve) => {
      release = resolve;
    });
    const first = withOutboxLock(1, async () => {
      order.push(1);
      await gate;
      order.push(2);
      return "a";
    });
    const second = withOutboxLock(1, async () => {
      order.push(3);
      return "b";
    });
    await Promise.resolve();
    expect(order).toEqual([1]);
    release();
    await expect(first).resolves.toBe("a");
    await expect(second).resolves.toBe("b");
    expect(order).toEqual([1, 2, 3]);
    await expect(
      withOutboxLock(1, async () => {
        throw new Error("boom");
      }),
    ).rejects.toThrow("boom");
    await expect(withOutboxLock(1, async () => 4)).resolves.toBe(4);
    resetOutboxLocks();
  });

  it("uses the Web Locks API when present", async () => {
    const names: string[] = [];
    Object.defineProperty(navigator, "locks", {
      configurable: true,
      value: {
        request: async (
          name: string,
          _options: { mode: string },
          callback: () => Promise<string>,
        ) => {
          names.push(name);
          return callback();
        },
      },
    });
    await expect(withOutboxLock(9, async () => "locked")).resolves.toBe("locked");
    expect(names).toEqual(["rajya:outbox:9"]);
    Object.defineProperty(navigator, "locks", { configurable: true, value: undefined });
  });
});
