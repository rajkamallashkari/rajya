import {
  ACCOUNT_DB_VERSION,
  ACCOUNT_STORES,
  accountDatabaseName,
  parseAccountDatabaseId,
  type AccountStoreName,
  type StoredRecord,
} from "./schema";

type MemoryDb = Record<AccountStoreName, Map<string, StoredRecord>>;

const memory = new Map<string, MemoryDb>();
const idbConnections = new Map<string, Promise<IDBDatabase>>();

function emptyMemory(): MemoryDb {
  return {
    outbox: new Map(),
    cache: new Map(),
    drafts: new Map(),
    keyval: new Map(),
  };
}

function memoryDb(accountId: number): MemoryDb {
  const name = accountDatabaseName(accountId);
  const existing = memory.get(name);
  if (existing) {
    return existing;
  }
  const created = emptyMemory();
  memory.set(name, created);
  return created;
}

function canUseIndexedDb(): boolean {
  return typeof indexedDB !== "undefined";
}

function openIndexedDb(accountId: number): Promise<IDBDatabase> {
  const name = accountDatabaseName(accountId);
  const cached = idbConnections.get(name);
  if (cached) {
    return cached;
  }
  const opening = new Promise<IDBDatabase>((resolve, reject) => {
    const request = indexedDB.open(name, ACCOUNT_DB_VERSION);
    request.onupgradeneeded = () => {
      const db = request.result;
      for (const store of ACCOUNT_STORES) {
        if (!db.objectStoreNames.contains(store)) {
          db.createObjectStore(store, { keyPath: "id" });
        }
      }
    };
    request.onsuccess = () => resolve(request.result);
    request.onerror = () => reject(request.error ?? new Error("idb_open_failed"));
  });
  idbConnections.set(name, opening);
  return opening;
}

function idbRequest<T>(request: IDBRequest<T>): Promise<T> {
  return new Promise((resolve, reject) => {
    request.onsuccess = () => resolve(request.result);
    request.onerror = () => reject(request.error ?? new Error("idb_request_failed"));
  });
}

async function withIdbStore<T>(
  accountId: number,
  store: AccountStoreName,
  mode: IDBTransactionMode,
  fn: (objectStore: IDBObjectStore) => IDBRequest<T>,
): Promise<T> {
  const db = await openIndexedDb(accountId);
  const transaction = db.transaction(store, mode);
  return idbRequest(fn(transaction.objectStore(store)));
}

export async function putRecord<T extends StoredRecord>(
  accountId: number,
  store: AccountStoreName,
  record: T,
): Promise<void> {
  memoryDb(accountId)[store].set(record.id, record);
  if (!canUseIndexedDb()) {
    return;
  }
  try {
    await withIdbStore(accountId, store, "readwrite", (objectStore) => objectStore.put(record));
  } catch {
    return;
  }
}

export async function getAllRecords<T extends StoredRecord>(
  accountId: number,
  store: AccountStoreName,
): Promise<T[]> {
  const fromMemory = [...memoryDb(accountId)[store].values()] as T[];
  if (!canUseIndexedDb()) {
    return fromMemory;
  }
  try {
    const fromIdb = (await withIdbStore(accountId, store, "readonly", (objectStore) =>
      objectStore.getAll(),
    )) as T[];
    return fromIdb.length > 0 ? fromIdb : fromMemory;
  } catch {
    return fromMemory;
  }
}

export async function getRecord<T extends StoredRecord>(
  accountId: number,
  store: AccountStoreName,
  id: string,
): Promise<T | undefined> {
  const fromMemory = memoryDb(accountId)[store].get(id) as T | undefined;
  if (!canUseIndexedDb()) {
    return fromMemory;
  }
  try {
    const fromIdb = (await withIdbStore(accountId, store, "readonly", (objectStore) =>
      objectStore.get(id),
    )) as T | undefined;
    return fromIdb ?? fromMemory;
  } catch {
    return fromMemory;
  }
}

export async function deleteRecord(
  accountId: number,
  store: AccountStoreName,
  id: string,
): Promise<void> {
  memoryDb(accountId)[store].delete(id);
  if (!canUseIndexedDb()) {
    return;
  }
  try {
    await withIdbStore(accountId, store, "readwrite", (objectStore) => objectStore.delete(id));
  } catch {
    return;
  }
}

export function rememberedAccountIds(): number[] {
  const names = new Set([...memory.keys(), ...idbConnections.keys()]);
  return [...names]
    .map((name) => parseAccountDatabaseId(name))
    .filter((id): id is number => id != null);
}

export async function listAccountDatabaseIds(): Promise<number[]> {
  const fromMemory = rememberedAccountIds();
  if (!canUseIndexedDb() || typeof indexedDB.databases !== "function") {
    return fromMemory;
  }
  try {
    const listed = await indexedDB.databases();
    const fromIdb = listed.flatMap((entry) => {
      const id = parseAccountDatabaseId(entry.name);
      return id == null ? [] : [id];
    });
    return [...new Set([...fromMemory, ...fromIdb])];
  } catch {
    return fromMemory;
  }
}

export function resetAccountDatabases(): void {
  memory.clear();
  idbConnections.clear();
}
