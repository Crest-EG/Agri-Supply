import Dexie, { type Table } from "dexie";
import type { CacheEntry, OutboxEntry } from "./types";

class CrestOfflineDatabase extends Dexie {
  cache!: Table<CacheEntry, string>;
  outbox!: Table<OutboxEntry, string>;

  constructor() {
    super("crest-supply-tracker");
    this.version(1).stores({
      cache: "key, owner_id, kind",
      outbox: "id, trip_id, owner_id, status, next_attempt_at, created_at",
    });
  }
}

export const offlineDb = new CrestOfflineDatabase();

export async function saveCache(ownerId: string, kind: string, value: unknown) {
  const key = `${kind}:${ownerId}`;
  await offlineDb.cache.put({ key, owner_id: ownerId, kind, value, updated_at: new Date().toISOString() });
}

export async function saveCacheIfChanged(ownerId: string, kind: string, value: unknown) {
  const key = `${kind}:${ownerId}`;
  const serializedValue = JSON.stringify(value);
  return offlineDb.transaction("rw", offlineDb.cache, async () => {
    const existing = await offlineDb.cache.get(key);
    if (existing && JSON.stringify(existing.value) === serializedValue) return false;
    await offlineDb.cache.put({ key, owner_id: ownerId, kind, value, updated_at: new Date().toISOString() });
    return true;
  });
}

export async function readCache(ownerId: string) {
  const rows = await offlineDb.cache.where("owner_id").equals(ownerId).toArray();
  return new Map(rows.map((row) => [row.kind, row.value]));
}
