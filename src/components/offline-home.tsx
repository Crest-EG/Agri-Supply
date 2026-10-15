"use client";

import Link from "next/link";
import { useEffect, useState } from "react";
import { TripForm } from "@/app/trips/new/trip-form";
import { TripEditForm } from "@/app/trips/[id]/edit-form";
import { statusLabels, formatWeight } from "@/lib/format";
import { readCache } from "@/lib/offline/db";
import { SyncBadge } from "@/components/sync-badge";
import { GuestHeader } from "@/components/app-header";
import { TripCreateDialog } from "@/components/trip-create-dialog";

type CachedMap = Map<string, unknown>;
type ListTrip = { id: string; trip_no: number | null; trip_date: string; status: string; weight_kg: number | null; plate_number: string | null; product_id: string; supplier_id: string; factory_id: string | null; photo_blur?: string | null };

export function OfflineHome() {
  const [cache, setCache] = useState<CachedMap | null>(null);
  const [ownerId, setOwnerId] = useState("");
  const [location, setLocation] = useState({ pathname: "/~offline", search: "" });
  const { pathname, search } = location;
  useEffect(() => {
    const owner = localStorage.getItem("crest-owner-id") ?? "";
    setOwnerId(owner);
    setLocation({ pathname: window.location.pathname, search: window.location.search });
    if (owner) void readCache(owner).then(setCache);
    const refresh = () => { if (owner) void readCache(owner).then(setCache); };
    window.addEventListener("crest-outbox-change", refresh);
    return () => window.removeEventListener("crest-outbox-change", refresh);
  }, []);

  if (cache === null) return <><GuestHeader title="نسخة البيانات المحفوظة" actionHref="/trips" actionLabel="تحديث الاتصال" /><main className="mx-auto min-h-screen max-w-[1440px] px-4 py-10 md:px-8"><p role="status">جارٍ فتح البيانات المحفوظة...</p></main></>;
  const products = (cache.get("products") as { id: string; name: string; state?: string; is_active?: boolean }[] | undefined) ?? [];
  const suppliers = (cache.get("suppliers") as { id: string; name: string; is_active?: boolean }[] | undefined) ?? [];
  const factories = (cache.get("factories") as { id: string; name: string; is_active?: boolean }[] | undefined) ?? [];
  const supplierLinks = (cache.get("supplier_links") as { supplier_id: string; product_id: string }[] | undefined) ?? [];
  const factoryLinks = (cache.get("factory_links") as { factory_id: string; product_id: string }[] | undefined) ?? [];
  const settings = cache.get("settings") as { default_commission_pct?: number } | undefined;
  const profile = cache.get("profile") as { role?: "admin" | "engineer" } | undefined;
  const prices = (cache.get("product_prices") as { product_id: string; price_per_kg: number | null; is_today: boolean | null; days_old: number | null }[] | undefined) ?? [];
  const engineers = ((cache.get("engineers") as { id: string; full_name: string }[] | undefined) ?? []).map((item) => ({ id: item.id, label: item.full_name }));
  const trips = (cache.get("trips") as ListTrip[] | undefined) ?? [];
  const detailId = pathname.match(/^\/trips\/([0-9a-f-]{36})\/?$/i)?.[1];
  const detailTrip = detailId ? cache.get(`trip:${detailId}`) as Parameters<typeof TripEditForm>[0]["trip"] | undefined : undefined;
  const queued = new URLSearchParams(search).get("queued");
  const locked = Boolean(detailTrip && profile?.role !== "admin" && !["loaded", "in_transit", "arrived"].includes(detailTrip.status));

  return <><GuestHeader title="نسخة البيانات المحفوظة" actionHref="/trips" actionLabel="تحديث الاتصال" /><main className="mx-auto min-h-screen max-w-[1440px] px-4 py-6 md:px-8">
    {queued && <p className="mt-4 rounded-xl bg-green-50 p-3 text-sm text-green-900">تم حفظ التغييرات محليًا. ستتم المزامنة عند عودة الاتصال.</p>}
    {!ownerId && <section className="mt-8 rounded-2xl bg-white p-6"><h2 className="font-bold">يلزم تسجيل الدخول مرة واحدة أثناء الاتصال</h2><p className="mt-2 text-sm text-green-900/70">بعد تحميل بيانات حسابك، ستظهر هنا عند انقطاع الإنترنت.</p><Link href="/login" className="mt-4 inline-block rounded-xl bg-green-700 ps-4 pe-4 py-2 text-white">تسجيل الدخول</Link></section>}
    {ownerId && pathname === "/trips/new" && <><h2 className="mt-6 text-xl font-bold">رحلة جديدة دون اتصال</h2><TripForm suppliers={suppliers} products={products} factories={factories} supplierLinks={supplierLinks} factoryLinks={factoryLinks} ownerId={ownerId} defaultCommissionPct={settings?.default_commission_pct ?? 0} /></>}
    {ownerId && detailId && (detailTrip ? locked ? <section className="mt-8 rounded-2xl bg-orange-100 p-5"><h2 className="font-bold">الرحلة مقفلة للتعديل</h2><p className="mt-2 text-sm">تواصل مع المدير لإجراء أي تعديل.</p></section> : <><h2 className="mt-6 text-xl font-bold">تعديل رحلة دون اتصال</h2><TripEditForm trip={detailTrip} isAdmin={profile?.role === "admin"} ownerId={ownerId} products={products} suppliers={suppliers} factories={factories} engineers={engineers} supplierLinks={supplierLinks} factoryLinks={factoryLinks} referencePrice={prices.find((item) => item.product_id === detailTrip.product_id)?.price_per_kg ?? null} referenceIsToday={prices.find((item) => item.product_id === detailTrip.product_id)?.is_today ?? null} referenceDaysOld={prices.find((item) => item.product_id === detailTrip.product_id)?.days_old ?? null} /></> : <p className="mt-8 rounded-xl bg-orange-100 p-4">هذه الرحلة غير محفوظة على الجهاز بعد.</p>)}
    {ownerId && !detailId && pathname !== "/trips/new" && <>
      <div className="mt-5 flex items-center justify-between"><h2 className="text-xl font-bold">الحركات المحفوظة</h2><TripCreateDialog suppliers={suppliers} products={products} factories={factories} supplierLinks={supplierLinks} factoryLinks={factoryLinks} ownerId={ownerId} defaultCommissionPct={settings?.default_commission_pct ?? 0} /></div>
      {trips.length ? <div className="mt-4 space-y-3">{trips.map((trip) => <article key={trip.id} className="flex flex-wrap items-center justify-between gap-3 rounded-2xl bg-white p-4 shadow-green-900/10"><Link href={`/trips/${trip.id}`} aria-label={`تفاصيل الرحلة ${trip.trip_no ?? "المحفوظة"}`} className="flex min-h-16 flex-1 items-center justify-between gap-4 rounded-lg p-2 hover:bg-green-50 focus-visible:outline-2"><div><p className="font-bold">{trip.trip_no ? `رحلة #${trip.trip_no}` : "رحلة محفوظة محليًا"}</p><p className="mt-1 text-sm text-green-900/70">{trip.plate_number || "بدون رقم سيارة"} · {formatWeight(trip.weight_kg)}</p></div><div className="text-sm">{statusLabels[trip.status] ?? trip.status}<p className="mt-1 text-xs text-green-900/70">{trip.trip_date}</p></div></Link><SyncBadge tripId={trip.id} ownerId={ownerId} /></article>)}</div> : <section className="mt-5 rounded-2xl border border-dashed bg-white p-8 text-center"><p className="font-semibold">لا توجد رحلات محفوظة محليًا.</p><p className="mt-2 text-sm text-green-900/70">افتح قائمة رحلاتك أثناء الاتصال لتجهيز نسخة للعمل دون إنترنت.</p></section>}
    </>}
  </main></>;
}
