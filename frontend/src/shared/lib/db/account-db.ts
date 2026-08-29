import {
  ACCOUNT_DB_VERSION,
  ACCOUNT_STORES,
  accountDatabaseName,
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

export async function putRecord(
  accountId: number,
  store: AccountStoreName,
  record: StoredRecord,
): Promise<void> {
  if (!canUseIndexedDb()) {
    memoryDb(accountId)[store].set(record.id, record);
    return;
  }
  try {
    await withIdbStore(accountId, store, "readwrite", (objectStore) => objectStore.put(record));
  } catch {
    memoryDb(accountId)[store].set(record.id, record);
  }
}

export async function getAllRecords<T extends StoredRecord>(
  accountId: number,
  store: AccountStoreName,
): Promise<T[]> {
  if (!canUseIndexedDb()) {
    return [...memoryDb(accountId)[store].values()] as T[];
  }
  try {
    return (await withIdbStore(accountId, store, "readonly", (objectStore) =>
      objectStore.getAll(),
    )) as T[];
  } catch {
    return [...memoryDb(accountId)[store].values()] as T[];
  }
}

export async function getRecord<T extends StoredRecord>(
  accountId: number,
  store: AccountStoreName,
  id: string,
): Promise<T | undefined> {
  if (!canUseIndexedDb()) {
    return memoryDb(accountId)[store].get(id) as T | undefined;
  }
  try {
    return (await withIdbStore(accountId, store, "readonly", (objectStore) =>
      objectStore.get(id),
    )) as T | undefined;
  } catch {
    return memoryDb(accountId)[store].get(id) as T | undefined;
  }
}

export async function deleteRecord(
  accountId: number,
  store: AccountStoreName,
  id: string,
): Promise<void> {
  if (!canUseIndexedDb()) {
    memoryDb(accountId)[store].delete(id);
    return;
  }
  try {
    await withIdbStore(accountId, store, "readwrite", (objectStore) => objectStore.delete(id));
  } catch {
    memoryDb(accountId)[store].delete(id);
  }
}

export function resetAccountDatabases(): void {
  memory.clear();
  idbConnections.clear();
}
