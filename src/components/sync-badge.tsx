"use client";

import { useEffect, useState } from "react";
import { CheckCheck } from "lucide-react";
import { offlineDb } from "@/lib/offline/db";
import { retryTripSync } from "@/lib/offline/queue";

type SyncState = { status: "pending" | "failed" | "synced"; error?: string };
export function SyncBadge({ tripId, ownerId }: { tripId: string; ownerId: string }) {
  const [state, setState] = useState<SyncState>({ status: "synced" });
  useEffect(() => {
    let active = true;
    const refresh = async () => {
      const entry = await offlineDb.outbox.where("trip_id").equals(tripId).first();
      if (active) setState(entry ? { status: entry.status, error: entry.error ?? undefined } : { status: "synced" });
    };
    void refresh();
    window.addEventListener("crest-outbox-change", refresh);
    return () => { active = false; window.removeEventListener("crest-outbox-change", refresh); };
  }, [tripId]);
  if (state.status === "failed") return <span className="inline-flex items-center gap-1 rounded-full bg-orange-100 ps-2 pe-2 py-1 text-xs text-green-900"><span>{state.error ? `فشلت المزامنة: ${state.error}` : "فشلت المزامنة"}</span><button type="button" onClick={() => void retryTripSync(tripId, ownerId)} className="underline">إعادة</button></span>;
  if (state.status === "pending") return <span className="rounded-full bg-orange-500 ps-2 pe-2 py-1 text-xs text-green-900">مزامنة</span>;
  return <span role="img" aria-label="تمت المزامنة" title="تمت المزامنة" className="inline-flex h-7 w-7 items-center justify-center rounded-full bg-green-100 text-green-700"><CheckCheck aria-hidden size={17} strokeWidth={2.5} /></span>;
}
