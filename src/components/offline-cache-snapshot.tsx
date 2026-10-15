"use client";

import { useEffect } from "react";
import { useRouter } from "next/navigation";
import { saveCacheIfChanged } from "@/lib/offline/db";
import { flushOfflineQueue } from "@/components/sync-provider";

export type CacheSnapshot = { kind: string; value: unknown };
export function OfflineCacheSnapshot({ ownerId, entries }: { ownerId: string; entries: CacheSnapshot[] }) {
  const router = useRouter();
  const entriesContent = JSON.stringify(entries);
  useEffect(() => {
    localStorage.setItem("crest-owner-id", ownerId);
    const snapshot = JSON.parse(entriesContent) as CacheSnapshot[];
    void Promise.all(snapshot.map(({ kind, value }) => saveCacheIfChanged(ownerId, kind, value)))
      .then((changed) => {
        if (changed.some(Boolean)) return flushOfflineQueue(() => router.refresh());
      });
  }, [ownerId, entriesContent, router]);
  return null;
}
