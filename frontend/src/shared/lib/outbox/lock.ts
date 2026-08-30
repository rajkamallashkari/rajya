const mutexes = new Map<number, Promise<void>>();

export function outboxLockName(accountId: number): string {
  return `rajya:outbox:${String(accountId)}`;
}

export async function withOutboxLock<T>(accountId: number, task: () => Promise<T>): Promise<T> {
  const locks = globalThis.navigator?.locks;
  if (locks?.request) {
    return locks.request(outboxLockName(accountId), { mode: "exclusive" }, () => task());
  }
  const previous = mutexes.get(accountId) ?? Promise.resolve();
  const run = previous.then(task, task);
  mutexes.set(
    accountId,
    run.then(
      () => undefined,
      () => undefined,
    ),
  );
  return run;
}

export function resetOutboxLocks(): void {
  mutexes.clear();
}
