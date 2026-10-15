"use client";

import { useEffect } from "react";
import { saveCache } from "@/lib/offline/db";

export type CacheSnapshot = { kind: string; value: unknown };
export function OfflineCacheSnapshot({ ownerId, entries }: { ownerId: string; entries: CacheSnapshot[] }) {
  useEffect(() => {
    localStorage.setItem("crest-owner-id", ownerId);
    void Promise.all(entries.map(({ kind, value }) => saveCache(ownerId, kind, value))).then(() => window.dispatchEvent(new Event("online")));
  }, [ownerId, entries]);
  return null;
}
