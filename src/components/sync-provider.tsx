"use client";

import { useEffect } from "react";
import { offlineDb, saveCache } from "@/lib/offline/db";
import { syncQueuedTrip } from "@/app/trips/offline-actions";

let syncActive = false;
async function synchronize() {
  if (!navigator.onLine || syncActive) return;
  syncActive = true;
  try {
  const ownerId = localStorage.getItem("crest-owner-id");
  if (!ownerId) return;
  const entries = await offlineDb.outbox.where("owner_id").equals(ownerId).and((entry) => entry.status === "pending" && entry.next_attempt_at <= Date.now()).sortBy("created_at");
  for (const entry of entries) {
    const result = await syncQueuedTrip(entry.payload);
    if (result.ok) {
      await offlineDb.outbox.delete(entry.id);
      const trips = await offlineDb.cache.get(`trips:${ownerId}`);
      const list = Array.isArray(trips?.value) ? trips.value as Record<string, unknown>[] : [];
      const next = { ...list.find((trip) => trip.id === result.trip.id), ...result.trip };
      await saveCache(ownerId, "trips", [next, ...list.filter((trip) => trip.id !== result.trip.id)]);
      await saveCache(ownerId, `trip:${result.trip.id}`, next);
    } else {
      const attempts = entry.attempts + 1;
      const delay = Math.min(60 * 60 * 1000, 2_000 * 2 ** Math.min(attempts, 10));
      await offlineDb.outbox.update(entry.id, {
        attempts,
        status: result.retryable ? "pending" : "failed",
        next_attempt_at: Date.now() + delay,
        error: result.reason,
      });
      if (result.retryable) window.setTimeout(() => window.dispatchEvent(new Event("online")), delay);
    }
    window.dispatchEvent(new Event("crest-outbox-change"));
  }
  } finally {
    syncActive = false;
  }
}

export function SyncProvider() {
  useEffect(() => {
    const attempt = () => { void synchronize(); };
    window.addEventListener("online", attempt);
    window.addEventListener("crest-outbox-change", attempt);
    window.addEventListener("focus", attempt);
    document.addEventListener("visibilitychange", attempt);
    attempt();
    return () => {
      window.removeEventListener("online", attempt);
      window.removeEventListener("crest-outbox-change", attempt);
      window.removeEventListener("focus", attempt);
      document.removeEventListener("visibilitychange", attempt);
    };
  }, []);
  return null;
}
