import { offlineDb } from "./db";
import type { QueuedTrip } from "./types";

export async function enqueueTrip(payload: QueuedTrip) {
  const now = new Date().toISOString();
  const existing = await offlineDb.outbox.where("trip_id").equals(payload.id).first();
  const operation = existing?.payload.operation === "create" ? "create" : payload.operation;
  const nextPayload = { ...existing?.payload, ...payload, operation };
  await offlineDb.transaction("rw", offlineDb.outbox, offlineDb.cache, async () => {
    await offlineDb.outbox.put({
      id: existing?.id ?? crypto.randomUUID(), trip_id: payload.id, owner_id: payload.owner_id,
      payload: nextPayload, status: "pending", attempts: 0, next_attempt_at: Date.now(), error: null,
      created_at: existing?.created_at ?? now,
    });
    const listKey = `trips:${payload.owner_id}`;
    const cached = await offlineDb.cache.get(listKey);
    const list = Array.isArray(cached?.value) ? cached.value as Record<string, unknown>[] : [];
    const previous = list.find((trip) => trip.id === payload.id) ?? {};
    const optimistic = {
      ...previous,
      id: payload.id,
      trip_no: previous.trip_no ?? null,
      trip_date: payload.trip_date ?? previous.trip_date ?? new Date().toISOString().slice(0, 10),
      engineer_id: payload.engineer_id ?? payload.owner_id,
      supplier_id: payload.supplier_id,
      product_id: payload.product_id,
      factory_id: payload.factory_id,
      status: payload.status,
      plate_number: payload.plate_number,
      photo_path: payload.photo ? `${payload.owner_id}/${payload.id}.webp` : previous.photo_path ?? null,
      photo_blur: payload.photo_blur ?? previous.photo_blur ?? null,
      weight_kg: payload.weight_kg,
      price_per_kg: payload.price_per_kg,
    };
    const nextList = [optimistic, ...list.filter((trip) => trip.id !== payload.id)];
    await offlineDb.cache.put({ key: listKey, owner_id: payload.owner_id, kind: "trips", value: nextList, updated_at: now });
    await offlineDb.cache.put({ key: `trip:${payload.id}:${payload.owner_id}`, owner_id: payload.owner_id, kind: `trip:${payload.id}`, value: optimistic, updated_at: now });
  });
  window.dispatchEvent(new Event("crest-outbox-change"));
}

export async function retryTripSync(tripId: string, ownerId: string) {
  const entry = await offlineDb.outbox.where("trip_id").equals(tripId).first();
  if (entry?.owner_id !== ownerId) return;
  await offlineDb.outbox.update(entry.id, { status: "pending", next_attempt_at: Date.now(), error: null });
  window.dispatchEvent(new Event("crest-outbox-change"));
}
