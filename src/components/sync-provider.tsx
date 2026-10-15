"use client";

import { useEffect } from "react";
import { useRouter } from "next/navigation";
import { offlineDb, saveCache } from "@/lib/offline/db";

let syncActive = false;
let syncRequested = false;
async function synchronize(refreshChangedData: () => void) {
  if (!navigator.onLine) return;
  if (syncActive) {
    syncRequested = true;
    return;
  }
  syncActive = true;
  let dataChanged = false;
  try {
    const ownerId = localStorage.getItem("crest-owner-id");
    if (!ownerId) return;
    const entries = await offlineDb.outbox.where("owner_id").equals(ownerId).and((entry) => entry.status === "pending" && entry.next_attempt_at <= Date.now()).sortBy("created_at");
    for (const entry of entries) {
      const form = new FormData();
      const { photo, ...payload } = entry.payload;
      form.set("payload", JSON.stringify(payload));
      if (photo) form.set("photo", photo, "trip-photo.webp");
      let result: { ok: boolean; retryable?: boolean; reason?: string; trip?: Record<string, unknown> };
      try {
        const response = await fetch("/api/trips/sync", { method: "POST", body: form });
        result = await response.json();
      } catch {
        result = { ok: false, reason: "تعذر الاتصال بالخادم.", retryable: true };
      }
      if (result.ok) {
        dataChanged = true;
        await offlineDb.outbox.delete(entry.id);
        const trips = await offlineDb.cache.get(`trips:${ownerId}`);
        const list = Array.isArray(trips?.value) ? trips.value as Record<string, unknown>[] : [];
        const syncedTrip = result.trip ?? {};
        const tripId = String(syncedTrip.id ?? entry.trip_id);
        const next = { ...list.find((trip) => trip.id === tripId), ...syncedTrip };
        await saveCache(ownerId, "trips", [next, ...list.filter((trip) => trip.id !== tripId)]);
        await saveCache(ownerId, `trip:${tripId}`, next);
      } else {
        const attempts = entry.attempts + 1;
        await offlineDb.outbox.update(entry.id, {
          attempts,
          status: result.retryable ? "pending" : "failed",
          next_attempt_at: Date.now() + Math.min(60 * 60 * 1000, 2_000 * 2 ** Math.min(attempts, 10)),
          error: result.reason ?? "تعذرت المزامنة.",
        });
      }
      window.dispatchEvent(new Event("crest-outbox-change"));
    }
    if (dataChanged) refreshChangedData();
  } finally {
    syncActive = false;
    if (syncRequested) {
      syncRequested = false;
      queueMicrotask(() => { void synchronize(refreshChangedData); });
    }
  }
}

export function flushOfflineQueue(refreshChangedData: () => void = () => {}) {
  return synchronize(refreshChangedData);
}

export function SyncProvider() {
  const router = useRouter();
  useEffect(() => {
    const attempt = () => { void flushOfflineQueue(() => router.refresh()); };
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
  }, [router]);
  return null;
}
