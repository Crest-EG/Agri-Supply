"use client";

import { useState, useTransition } from "react";
import { getTripPhotoUrl } from "@/app/trips/photo-actions";

export function TripPhotoViewer({ tripId, blur, label = "عرض صورة الرحلة" }: { tripId: string; blur: string | null; label?: string }) {
  const [url, setUrl] = useState("");
  const [error, setError] = useState("");
  const [loading, startTransition] = useTransition();
  if (!blur) return null;
  function openPhoto() {
    setError("");
    startTransition(async () => {
      const result = await getTripPhotoUrl(tripId);
      if (result.error || !result.url) setError(result.error || "تعذر تحميل الصورة.");
      else setUrl(result.url);
    });
  }
  return <>
    <button type="button" onClick={openPhoto} aria-label={label} className="group relative h-16 w-16 shrink-0 overflow-hidden rounded-xl border border-green-100 bg-green-50 hover:ring-2 hover:ring-green-700">
      {/* eslint-disable-next-line @next/next/no-img-element -- Small base64 placeholder; must never be fetched from remote storage. */}
      <img src={blur} alt="معاينة ضبابية لصورة الحمولة" className="h-full w-full scale-110 object-cover blur-sm" />
      <span className="absolute inset-x-0 bottom-0 bg-white/90 py-1 text-[10px] font-bold text-green-900" aria-hidden="true">عرض الصورة</span>
    </button>
    {loading && <span className="sr-only" role="status">جارٍ تحميل الصورة</span>}
    {error && <p role="alert" className="sr-only">{error}</p>}
    {url && <div role="dialog" aria-modal="true" aria-label="صورة الحمولة" onClick={() => setUrl("")} onKeyDown={(event) => { if (event.key === "Escape") setUrl(""); }} className="fixed inset-0 z-50 grid place-items-center bg-green-900/80 p-4">
      <button type="button" onClick={() => setUrl("")} className="absolute end-4 top-4 rounded-full bg-white ps-4 pe-4 py-2 font-semibold">إغلاق</button>
      {/* eslint-disable-next-line @next/next/no-img-element -- Signed URL is short-lived and loaded only after a user tap. */}
      <img src={url} alt="صورة الحمولة" onClick={(event) => event.stopPropagation()} className="max-h-[90vh] max-w-full rounded-xl object-contain" />
    </div>}
  </>;
}
