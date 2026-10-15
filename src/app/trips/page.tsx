import Link from "next/link";
import { requireProfile } from "@/lib/authz";
import { statusLabels, formatWeight, formatDate } from "@/lib/format";
import { one } from "@/lib/relations";
import type { Database } from "@/lib/database.types";
import { TripPhotoViewer } from "@/components/trip-photo-viewer";
import { SyncBadge } from "@/components/sync-badge";
import { OfflineCacheSnapshot } from "@/components/offline-cache-snapshot";
import { timeSupabase } from "@/lib/supabase/timing";
import { AppHeader } from "@/components/app-header";
import { TripCreateDialog } from "@/components/trip-create-dialog";
import { Dialog, DialogClose } from "@/components/dialog";
import { ArrowDownLeft, BadgeCheck, CircleX, Clock3, FlaskConical, ListFilter, Search, Truck } from "lucide-react";


const pageSize = 20;
type TripStatus = Database["public"]["Enums"]["trip_status"];
const statuses = Object.entries(statusLabels) as [TripStatus, string][];
const statusTone = (status: string) => status === "factory_accepted" || status === "analysis_accepted" ? "bg-green-700 text-white" : status.includes("reject") ? "border border-orange-500 bg-orange-100 text-green-900" : "border border-green-500 bg-green-100 text-green-900";

export default async function TripsPage({ searchParams }: { searchParams: Promise<Record<string, string | string[] | undefined>> }) {
  const [{ supabase, profile }, rawParams] = await Promise.all([requireProfile(), searchParams]);
  const get = (key: string) => typeof rawParams[key] === "string" ? rawParams[key] as string : "";
  const page = Math.max(1, Number.parseInt(get("page") || "1", 10) || 1);
  const filters = { engineer_id: get("engineer_id"), factory_id: get("factory_id"), product_id: get("product_id"), supplier_id: get("supplier_id"), status: get("status"), date_from: get("date_from"), date_to: get("date_to"), plate: get("plate").trim() };
  let query = supabase.from("trips").select("id, trip_no, trip_date, engineer_id, supplier_id, product_id, factory_id, status, plate_number, photo_blur, weight_kg, price_per_kg, commission_pct, gross_amount, commission_amount, supplier_payable, analysis_note, notes, products(name), factories(name), suppliers(name)", { count: "exact" })
    .order("trip_date", { ascending: false }).order("trip_no", { ascending: false });
  if (profile.role === "admin" && filters.engineer_id) query = query.eq("engineer_id", filters.engineer_id);
  if (filters.factory_id) query = query.eq("factory_id", filters.factory_id);
  if (filters.product_id) query = query.eq("product_id", filters.product_id);
  if (filters.supplier_id) query = query.eq("supplier_id", filters.supplier_id);
  const selectedStatus = statuses.find(([status]) => status === filters.status)?.[0];
  if (selectedStatus) query = query.eq("status", selectedStatus);
  if (/^\d{4}-\d{2}-\d{2}$/.test(filters.date_from)) query = query.gte("trip_date", filters.date_from);
  if (/^\d{4}-\d{2}-\d{2}$/.test(filters.date_to)) query = query.lte("trip_date", filters.date_to);
  if (filters.plate) query = query.ilike("plate_number", `%${filters.plate.replace(/[%_,]/g, "")}%`);
  const [{ data: products }, { data: factories }, { data: suppliers }, { data: engineers }, { data: supplierLinks }, { data: factoryLinks }, { data: settings }, { data: prices }, { data: trips, error, count }] = await Promise.all([
    timeSupabase("trips.products", supabase.from("products").select("id, name, state").eq("is_active", true).order("name")),
    timeSupabase("trips.factories", supabase.from("factories").select("id, name").eq("is_active", true).order("name")),
    timeSupabase("trips.suppliers", supabase.from("suppliers").select("id, name").eq("is_active", true).order("name")),
    profile.role === "admin" ? timeSupabase("trips.engineers", supabase.from("profiles").select("id, full_name").eq("role", "engineer").order("full_name")) : Promise.resolve({ data: [] }),
    timeSupabase("trips.supplier_links", supabase.from("supplier_products").select("supplier_id, product_id")),
    timeSupabase("trips.factory_links", supabase.from("factory_products").select("factory_id, product_id")),
    timeSupabase("trips.settings", supabase.from("settings").select("default_commission_pct").eq("id", true).maybeSingle()),
    timeSupabase("trips.prices", supabase.from("product_current_price").select("product_id, price_per_kg, is_today, days_old")),
    timeSupabase("trips.rows", query.range((page - 1) * pageSize, page * pageSize - 1)),
  ]);

  const queryForPage = (target: number) => {
    const params = new URLSearchParams();
    for (const [key, value] of Object.entries(filters)) if (value) params.set(key, value);
    params.set("page", String(target));
    return `/trips?${params.toString()}`;
  };
  const pageCount = Math.max(1, Math.ceil((count ?? 0) / pageSize));

  const StatusIcon = ({ status }: { status: string }) => status === "analysis_accepted" || status === "factory_accepted" ? <BadgeCheck aria-hidden size={16} /> : status.includes("reject") ? <CircleX aria-hidden size={16} /> : status === "in_transit" ? <Truck aria-hidden size={16} /> : status === "arrived" ? <FlaskConical aria-hidden size={16} /> : <Clock3 aria-hidden size={16} />;
  return <><AppHeader profile={profile} title={profile.role === "admin" ? "كل الحركات" : "رحلاتي"} /><main className="mx-auto min-h-screen max-w-[1440px] px-4 py-5 pb-24 md:px-8 md:py-8">
    <OfflineCacheSnapshot ownerId={profile.id} entries={[{ kind: "trips", value: trips ?? [] }, ...(trips ?? []).map((trip) => ({ kind: `trip:${trip.id}`, value: trip })), { kind: "products", value: products ?? [] }, { kind: "factories", value: factories ?? [] }, { kind: "suppliers", value: suppliers ?? [] }, { kind: "supplier_links", value: supplierLinks ?? [] }, { kind: "factory_links", value: factoryLinks ?? [] }, { kind: "settings", value: settings ?? { default_commission_pct: 0 } }, { kind: "product_prices", value: prices ?? [] }, { kind: "profile", value: profile }, { kind: "engineers", value: engineers ?? [] }]} />
    <div className="mt-5 flex flex-wrap items-center justify-between gap-3 rounded-2xl border border-green-100 bg-white p-4 shadow-sm"><div><h1 className="text-xl font-extrabold">{profile.role === "admin" ? "كل الحركات" : "رحلاتي"}</h1><p className="mt-1 text-sm text-green-900/70">متابعة تفاصيل التوريدات وحالاتها</p></div><div className="flex flex-wrap gap-2"><TripCreateDialog suppliers={suppliers ?? []} products={products ?? []} factories={factories ?? []} supplierLinks={supplierLinks ?? []} factoryLinks={factoryLinks ?? []} ownerId={profile.id} defaultCommissionPct={settings?.default_commission_pct ?? 0} /><Dialog title="تصفية الحركات" closeOnSubmit trigger={<button type="button" className="inline-flex min-h-12 items-center gap-2 rounded-xl border border-green-700 bg-white px-4 font-semibold text-green-900 hover:bg-green-50"><ListFilter aria-hidden size={18} />الفلاتر</button>}>
    <form method="get" className="space-y-3">
      <label className="relative block"><span className="sr-only">ابحث برقم لوحة السيارة</span><span aria-hidden className="absolute inset-y-0 start-4 flex items-center text-green-700"><Search size={18} /></span><input name="plate" defaultValue={filters.plate} placeholder="ابحث برقم اللوحة أو رقم الرحلة..." className="w-full rounded-xl border border-green-100 ps-11 pe-4" /></label>
      <details className="mt-3 rounded-xl bg-green-50 p-3"><summary className="cursor-pointer select-none font-bold text-green-900">تصفية الحركات والبحث المتقدم</summary><div className="mt-4 grid gap-3 sm:grid-cols-2 lg:grid-cols-4">
        {profile.role === "admin" && <label className="text-sm">المهندس<select name="engineer_id" defaultValue={filters.engineer_id} className="mt-1 w-full rounded-xl border border-green-100 bg-white ps-3 pe-3"><option value="">الكل</option>{(engineers ?? []).map((item) => <option key={item.id} value={item.id}>{item.full_name}</option>)}</select></label>}
        <label className="text-sm">المصنع<select name="factory_id" defaultValue={filters.factory_id} className="mt-1 w-full rounded-xl border border-green-100 bg-white ps-3 pe-3"><option value="">الكل</option>{(factories ?? []).map((item) => <option key={item.id} value={item.id}>{item.name}</option>)}</select></label>
        <label className="text-sm">المنتج<select name="product_id" defaultValue={filters.product_id} className="mt-1 w-full rounded-xl border border-green-100 bg-white ps-3 pe-3"><option value="">الكل</option>{(products ?? []).map((item) => <option key={item.id} value={item.id}>{item.name}</option>)}</select></label>
        <label className="text-sm">المورد<select name="supplier_id" defaultValue={filters.supplier_id} className="mt-1 w-full rounded-xl border border-green-100 bg-white ps-3 pe-3"><option value="">الكل</option>{(suppliers ?? []).map((item) => <option key={item.id} value={item.id}>{item.name}</option>)}</select></label>
        <label className="text-sm">الحالة<select name="status" defaultValue={filters.status} className="mt-1 w-full rounded-xl border border-green-100 bg-white ps-3 pe-3"><option value="">الكل</option>{statuses.map(([value, label]) => <option key={value} value={value}>{label}</option>)}</select></label>
        <label className="text-sm">من تاريخ<input name="date_from" type="date" defaultValue={filters.date_from} className="mt-1 w-full rounded-xl border border-green-100 ps-3 pe-3" /></label>
        <label className="text-sm">إلى تاريخ<input name="date_to" type="date" defaultValue={filters.date_to} className="mt-1 w-full rounded-xl border border-green-100 ps-3 pe-3" /></label>
      </div></details>
      <div className="flex flex-wrap items-center gap-2 pt-2"><button className="min-h-11 rounded-xl bg-green-700 ps-5 pe-5 py-2 font-bold text-white">تطبيق البحث</button><DialogClose><Link href="/trips" className="inline-flex min-h-11 items-center rounded-xl border border-green-700 bg-white ps-4 pe-4 py-2 font-semibold">مسح الفلاتر</Link></DialogClose></div>
    </form>
      </Dialog></div></div>
    {error ? <p role="alert" className="mt-6 rounded-xl bg-orange-100 p-4 text-green-900">تعذر تحميل الحركات. تحقق من الاتصال والصلاحيات.</p> : trips?.length ? <>
      <div className="mt-5 space-y-3 md:hidden">{trips.map((trip) => { const product = one(trip.products); const supplier = one(trip.suppliers); const factory = one(trip.factories); return <article key={trip.id} className="rounded-2xl border border-green-100 bg-white p-4 shadow-sm"><div className="flex items-start gap-3"><Link href={`/trips/${trip.id}`} prefetch aria-label={`تفاصيل الرحلة ${trip.trip_no ?? "المحفوظة"}`} className="min-h-28 min-w-0 flex-1 rounded-xl p-1 -m-1 hover:bg-green-50 focus-visible:outline-2"><div className="flex flex-wrap items-center gap-2"><span className="rounded-full bg-green-50 px-2.5 py-1 text-xs font-extrabold text-green-900" dir="ltr">#{trip.trip_no}</span><span className={`inline-flex items-center gap-1 rounded-full px-2.5 py-1 text-xs font-bold ${statusTone(trip.status)}`}><StatusIcon status={trip.status} />{statusLabels[trip.status] ?? trip.status}</span></div><h2 className="mt-3 text-base font-extrabold">{product?.name ?? "منتج غير محدد"}</h2><p className="mt-1 text-sm font-semibold">{supplier?.name ?? "—"}</p><p className="mt-1 flex items-center gap-1 text-xs text-green-900/70"><ArrowDownLeft aria-hidden size={14} />{factory?.name ?? "لم يحدد المصنع"}</p></Link><div className="flex shrink-0 flex-col items-center gap-2"><TripPhotoViewer tripId={trip.id} blur={trip.photo_blur} /><SyncBadge tripId={trip.id} ownerId={profile.id} /></div></div><Link href={`/trips/${trip.id}`} prefetch aria-label={`عرض بيانات السيارة والوزن والتاريخ للرحلة ${trip.trip_no ?? "المحفوظة"}`} className="mt-4 grid min-h-14 grid-cols-3 gap-2 rounded-lg border-t border-green-100 pt-3 text-xs hover:bg-green-50 focus-visible:outline-2"><p><span className="block text-green-900/70">السيارة</span><bdi dir="auto" className="mt-1 block font-bold">{trip.plate_number ?? "—"}</bdi></p><p><span className="block text-green-900/70">الوزن</span><b className="mt-1 block font-bold">{formatWeight(trip.weight_kg)}</b></p><p><span className="block text-green-900/70">التاريخ</span><bdi dir="ltr" className="mt-1 block font-bold">{formatDate(trip.trip_date)}</bdi></p></Link></article>; })}</div>
      <div className="mt-5 hidden overflow-x-auto rounded-2xl border border-green-100 bg-white shadow-sm md:block"><table className="w-full border-collapse text-start text-sm"><thead className="bg-green-50"><tr>{["الرحلة", "المورد", "المصنع", "السيارة", "الوزن", "الحالة", "التاريخ", ""].map((label) => <th key={label} className="border-b border-green-100 px-3 py-3 font-semibold">{label}</th>)}</tr></thead><tbody>{trips.map((trip) => { const product = one(trip.products); const supplier = one(trip.suppliers); const factory = one(trip.factories); return <tr key={trip.id} className="border-b border-green-50 last:border-0"><td className="px-3 py-3"><Link prefetch href={`/trips/${trip.id}`} className="font-semibold text-green-700">#{trip.trip_no} · {product?.name ?? ""}</Link></td><td className="px-3 py-3">{supplier?.name ?? "—"}</td><td className="px-3 py-3">{factory?.name ?? "—"}</td><td dir="ltr" className="px-3 py-3 text-start">{trip.plate_number ?? "—"}</td><td className="px-3 py-3">{formatWeight(trip.weight_kg)}</td><td className="px-3 py-3"><span className={`inline-flex items-center gap-1 rounded-full px-2 py-1 text-xs font-semibold ${statusTone(trip.status)}`}><StatusIcon status={trip.status} />{statusLabels[trip.status] ?? trip.status}</span></td><td className="px-3 py-3" dir="ltr">{formatDate(trip.trip_date)}</td><td className="px-3 py-3"><div className="flex items-center gap-2"><TripPhotoViewer tripId={trip.id} blur={trip.photo_blur} /><SyncBadge tripId={trip.id} ownerId={profile.id} /></div></td></tr>; })}</tbody></table></div>
    </> : <section className="mt-8 rounded-2xl border border-dashed border-green-100 bg-white p-10 text-center"><h2 className="font-bold">لا توجد رحلات</h2><p className="mt-2 text-green-900/70">أنشئ رحلة جديدة أو غيّر الفلاتر.</p></section>}
    {!error && count !== null && count !== undefined && pageCount > 1 && <nav aria-label="ترقيم الصفحات" className="mt-5 flex items-center justify-center gap-3"><Link aria-disabled={page <= 1} className={`rounded-xl border ps-4 pe-4 py-2 ${page <= 1 ? "pointer-events-none opacity-40" : ""}`} href={queryForPage(page - 1)}>السابق</Link><span className="text-sm">صفحة {page} من {pageCount}</span><Link aria-disabled={page >= pageCount} className={`rounded-xl border ps-4 pe-4 py-2 ${page >= pageCount ? "pointer-events-none opacity-40" : ""}`} href={queryForPage(page + 1)}>التالي</Link></nav>}
  </main></>;
}
