import { afterEach, describe, expect, it } from "vitest";
import {
  deleteRecord,
  getAllRecords,
  getRecord,
  listAccountDatabaseIds,
  putRecord,
  rememberedAccountIds,
  resetAccountDatabases,
} from "./account-db";
import { listOutbox, queueOutbox, removeOutbox } from "./outbox";
import { ACCOUNT_STORES, accountDatabaseName, parseAccountDatabaseId } from "./schema";

type StoreMap = Map<string, Record<string, unknown>>;
const fakeDbs = new Map<string, Map<string, StoreMap>>();

function requestOf<T>(run: () => T, error?: Error, forceError = false): IDBRequest<T> {
  const request = {
    result: undefined as T | undefined,
    error: error ?? null,
    onsuccess: null as ((this: IDBRequest<T>, ev: Event) => unknown) | null,
    onerror: null as ((this: IDBRequest<T>, ev: Event) => unknown) | null,
  };
  queueMicrotask(() => {
    if (error || forceError) {
      request.onerror?.call(request as unknown as IDBRequest<T>, new Event("error"));
      return;
    }
    request.result = run();
    request.onsuccess?.call(request as unknown as IDBRequest<T>, new Event("success"));
  });
  return request as unknown as IDBRequest<T>;
}

function installFakeIndexedDb(
  failOpen: boolean | "empty" | "request" | "request-empty" = false,
): void {
  fakeDbs.clear();
  const fake = {
    open(name: string) {
      if (failOpen === true || failOpen === "empty") {
        if (failOpen === "empty") {
          const request = {
            result: undefined,
            error: null,
            onsuccess: null as ((this: IDBRequest<IDBDatabase>, ev: Event) => unknown) | null,
            onerror: null as ((this: IDBRequest<IDBDatabase>, ev: Event) => unknown) | null,
          };
          queueMicrotask(() => {
            request.onerror?.call(
              request as unknown as IDBRequest<IDBDatabase>,
              new Event("error"),
            );
          });
          return request as unknown as IDBOpenDBRequest;
        }
        return requestOf(() => null as unknown as IDBDatabase, new Error("open_failed"));
      }
      const dbStores = fakeDbs.get(name) ?? new Map<string, StoreMap>();
      fakeDbs.set(name, dbStores);
      const db = {
        objectStoreNames: {
          contains: (store: string) => dbStores.has(store),
        },
        createObjectStore(store: string) {
          dbStores.set(store, new Map());
        },
        transaction(store: string) {
          if (!dbStores.has(store)) {
            dbStores.set(store, new Map());
          }
          const records = dbStores.get(store)!;
          const failError = failOpen === "request" ? new Error("idb_request_failed") : undefined;
          const forceError = failOpen === "request-empty";
          return {
            objectStore: () => ({
              put: (record: { id: string }) =>
                requestOf(
                  () => {
                    records.set(record.id, record);
                    return record.id;
                  },
                  failError,
                  forceError,
                ),
              get: (id: string) => requestOf(() => records.get(id), failError, forceError),
              getAll: () => requestOf(() => [...records.values()], failError, forceError),
              delete: (id: string) =>
                requestOf(
                  () => {
                    records.delete(id);
                  },
                  failError,
                  forceError,
                ),
            }),
          };
        },
      };
      const request = {
        result: db,
        error: null,
        onsuccess: null as ((this: IDBRequest<IDBDatabase>, ev: Event) => unknown) | null,
        onerror: null as ((this: IDBRequest<IDBDatabase>, ev: Event) => unknown) | null,
        onupgradeneeded: null as
          ((this: IDBOpenDBRequest, ev: IDBVersionChangeEvent) => unknown) | null,
      };
      queueMicrotask(() => {
        request.onupgradeneeded?.call(
          request as unknown as IDBOpenDBRequest,
          new Event("upgradeneeded") as IDBVersionChangeEvent,
        );
        request.onsuccess?.call(
          request as unknown as IDBRequest<IDBDatabase>,
          new Event("success"),
        );
      });
      return request as unknown as IDBOpenDBRequest;
    },
  };
  Object.defineProperty(globalThis, "indexedDB", { configurable: true, value: fake });
}

describe("account database", () => {
  afterEach(() => {
    resetAccountDatabases();
    Object.defineProperty(globalThis, "indexedDB", { configurable: true, value: undefined });
  });

  it("uses memory when IndexedDB is missing", async () => {
    Object.defineProperty(globalThis, "indexedDB", { configurable: true, value: undefined });
    expect(accountDatabaseName(7)).toBe("rajya:7");
    expect(parseAccountDatabaseId("rajya:7")).toBe(7);
    expect(parseAccountDatabaseId("rajya:meta")).toBeNull();
    expect(parseAccountDatabaseId("other")).toBeNull();
    expect(parseAccountDatabaseId(undefined)).toBeNull();
    expect(ACCOUNT_STORES).toContain("outbox");
    expect(ACCOUNT_STORES).toContain("keyval");
    await putRecord(1, "cache", { id: "c1", value: "v" });
    expect(await getRecord(1, "cache", "c1")).toEqual({ id: "c1", value: "v" });
    expect(await getAllRecords(1, "cache")).toHaveLength(1);
    await queueOutbox(1, { id: "o1", body: "hi", createdAt: "t", conversationId: 1, attempts: 0, status: "queued" });
    expect(await listOutbox(1)).toEqual([
      expect.objectContaining({ id: "o1", body: "hi", createdAt: "t", conversationId: 1, status: "queued" }),
    ]);
    await removeOutbox(1, "o1");
    expect(await listOutbox(1)).toEqual([]);
    await deleteRecord(1, "cache", "c1");
    expect(await getRecord(1, "cache", "c1")).toBeUndefined();
    await putRecord(2, "drafts", { id: "d1" });
    expect(await getAllRecords(1, "drafts")).toEqual([]);
  });

  it("reads memory when IndexedDB has not caught up", async () => {
    await putRecord(1, "keyval", { id: "auth", token: "tok" });
    installFakeIndexedDb();
    expect(await getRecord(1, "keyval", "auth")).toEqual({ id: "auth", token: "tok" });
    expect(await getAllRecords(1, "keyval")).toEqual([{ id: "auth", token: "tok" }]);
  });

  it("persists through a fake IndexedDB and falls back when open fails", async () => {
    installFakeIndexedDb();
    await putRecord(1, "outbox", { id: "o1", body: "queued", createdAt: "t" });
    expect(await getRecord(1, "outbox", "o1")).toEqual({
      id: "o1",
      body: "queued",
      createdAt: "t",
    });
    expect(await getAllRecords(1, "outbox")).toHaveLength(1);
    await deleteRecord(1, "outbox", "o1");
    expect(await getRecord(1, "outbox", "o1")).toBeUndefined();

    resetAccountDatabases();
    installFakeIndexedDb(true);
    await putRecord(3, "outbox", { id: "fallback", body: "m", createdAt: "t" });
    expect(await getAllRecords(3, "outbox")).toEqual([
      { id: "fallback", body: "m", createdAt: "t" },
    ]);
    expect(await getRecord(3, "outbox", "fallback")).toEqual({
      id: "fallback",
      body: "m",
      createdAt: "t",
    });
    await deleteRecord(3, "outbox", "fallback");
    expect(await getRecord(3, "outbox", "fallback")).toBeUndefined();

    resetAccountDatabases();
    installFakeIndexedDb("empty");
    await putRecord(4, "outbox", { id: "empty", body: "e", createdAt: "t" });
    expect(await getRecord(4, "outbox", "empty")).toEqual({
      id: "empty",
      body: "e",
      createdAt: "t",
    });

    resetAccountDatabases();
    installFakeIndexedDb("request");
    await putRecord(5, "outbox", { id: "req", body: "r", createdAt: "t" });
    expect(await getAllRecords(5, "outbox")).toEqual([{ id: "req", body: "r", createdAt: "t" }]);
    expect(await getRecord(5, "outbox", "req")).toEqual({ id: "req", body: "r", createdAt: "t" });
    await deleteRecord(5, "outbox", "req");
    expect(await getRecord(5, "outbox", "req")).toBeUndefined();

    resetAccountDatabases();
    installFakeIndexedDb("request-empty");
    await putRecord(6, "outbox", { id: "empty-req", body: "er", createdAt: "t" });
    expect(await getRecord(6, "outbox", "empty-req")).toEqual({
      id: "empty-req",
      body: "er",
      createdAt: "t",
    });
  });

  it("lists remembered account ids and IndexedDB names", async () => {
    await putRecord(8, "drafts", { id: "d" });
    expect(rememberedAccountIds()).toContain(8);
    expect(await listAccountDatabaseIds()).toContain(8);

    installFakeIndexedDb();
    Object.defineProperty(indexedDB, "databases", {
      configurable: true,
      value: async () => [{ name: "rajya:11" }, { name: "rajya:meta" }, { name: undefined }],
    });
    expect(await listAccountDatabaseIds()).toEqual(expect.arrayContaining([8, 11]));

    Object.defineProperty(indexedDB, "databases", {
      configurable: true,
      value: async () => {
        throw new Error("nope");
      },
    });
    expect(await listAccountDatabaseIds()).toEqual(rememberedAccountIds());

    Object.defineProperty(indexedDB, "databases", {
      configurable: true,
      value: undefined,
    });
    expect(await listAccountDatabaseIds()).toEqual(rememberedAccountIds());
  });
});
