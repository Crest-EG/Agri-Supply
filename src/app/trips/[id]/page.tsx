import Link from "next/link";
import { notFound } from "next/navigation";
import { requireProfile } from "@/lib/authz";
import { one } from "@/lib/relations";
import { statusLabels, formatWeight, formatDate } from "@/lib/format";
import { TripEditForm } from "./edit-form";
import { TripPhotoViewer } from "@/components/trip-photo-viewer";
import { OfflineCacheSnapshot } from "@/components/offline-cache-snapshot";
import { timeSupabase } from "@/lib/supabase/timing";
import { AppHeader } from "@/components/app-header";
import { ArrowRight, BadgeCheck, CalendarDays, Scale, Truck } from "lucide-react";

export default async function TripDetailsPage({ params, searchParams }: { params: Promise<{ id: string }>; searchParams: Promise<{ error?: string; saved?: string; locked?: string }> }) {
  const [{ id }, query] = await Promise.all([params, searchParams]);
  const { supabase, profile } = await requireProfile();
  const [{ data: trip }, { data: products }, { data: suppliers }, { data: factories }, { data: supplierLinks }, { data: factoryLinks }, { data: engineers }] = await Promise.all([
    timeSupabase("trip.trip_row", supabase.from("trips").select("id, trip_no, trip_date, engineer_id, supplier_id, product_id, factory_id, status, plate_number, weight_kg, price_per_kg, commission_pct, gross_amount, commission_amount, supplier_payable, analysis_note, notes, photo_path, photo_blur, products(name), suppliers(name), factories(name)").eq("id", id).maybeSingle()),
    timeSupabase("trip.products", supabase.from("products").select("id, name, state, is_active").order("name")),
    timeSupabase("trip.suppliers", supabase.from("suppliers").select("id, name, is_active").order("name")),
    timeSupabase("trip.factories", supabase.from("factories").select("id, name, is_active").order("name")),
    timeSupabase("trip.supplier_links", supabase.from("supplier_products").select("supplier_id, product_id")),
    timeSupabase("trip.factory_links", supabase.from("factory_products").select("factory_id, product_id")),
    profile.role === "admin" ? timeSupabase("trip.engineers", supabase.from("profiles").select("id, full_name").eq("role", "engineer").order("full_name")) : Promise.resolve({ data: [] as { id: string; full_name: string }[] }),
  ]);
  if (!trip) notFound();
  const { data: referencePrices } = await timeSupabase("trip.reference_price", supabase.from("product_current_price").select("product_id, price_per_kg, is_today, days_old").eq("product_id", trip.product_id));
  const reference = referencePrices?.[0];
  const locked = profile.role !== "admin" && !["loaded", "in_transit", "arrived"].includes(trip.status);
  const product = one(trip.products);
  const supplier = one(trip.suppliers);
  const factory = one(trip.factories);
  const engineerOptions = (engineers ?? []).map((item) => ({ id: item.id, label: item.full_name }));
  const errors: Record<string, string> = { invalid: "تحقق من الحقول والأرقام المدخلة.", status: "انتقال الحالة غير مسموح في هذه المرحلة.", links: "المورد أو المصنع غير مرتبط بالمنتج المحدد.", photo: "تعذر رفع الصورة. يجب أن تكون الصورة مضغوطة بصيغة WebP.", save: "تعذر حفظ التعديلات. ربما أُغلقت الرحلة أو تغيرت صلاحياتك." };

  return <><AppHeader profile={profile} title="تفاصيل رحلة التوريد" /><main className="mx-auto min-h-screen max-w-[1440px] px-4 py-5 pb-24 md:px-8 md:py-8"><div className="mx-auto max-w-3xl">
    <OfflineCacheSnapshot ownerId={profile.id} entries={[{ kind: `trip:${trip.id}`, value: trip }, { kind: "products", value: products ?? [] }, { kind: "suppliers", value: suppliers ?? [] }, { kind: "factories", value: factories ?? [] }, { kind: "supplier_links", value: supplierLinks ?? [] }, { kind: "factory_links", value: factoryLinks ?? [] }, { kind: "product_prices", value: referencePrices ?? [] }, { kind: "profile", value: profile }, { kind: "engineers", value: engineers ?? [] }]} />
    <Link href="/trips" className="inline-flex min-h-10 items-center gap-2 rounded-lg px-2 text-sm font-bold text-green-700 hover:bg-green-100"><ArrowRight aria-hidden size={17} />العودة إلى الرحلات</Link>
    <section className="mt-4 overflow-hidden rounded-2xl border border-green-100 bg-white shadow-sm"><div className="flex flex-wrap items-center justify-between gap-3 border-b border-green-100 bg-green-50 p-4 md:p-5"><div><p className="text-xs font-bold text-green-700">تفاصيل رحلة التوريد</p><h1 className="mt-1 text-2xl font-extrabold" dir="ltr">#{trip.trip_no}</h1></div><span className={`inline-flex items-center gap-2 rounded-full px-3 py-2 text-sm font-bold ${trip.status === "analysis_accepted" || trip.status === "factory_accepted" ? "bg-green-700 text-white" : trip.status.includes("reject") ? "border border-orange-500 bg-orange-100 text-green-900" : "border border-green-500 bg-green-100 text-green-900"}`}><BadgeCheck size={16} />{statusLabels[trip.status]}</span></div><div className="grid gap-4 p-4 sm:grid-cols-2 md:p-5"><div className="space-y-3"><h2 className="font-bold">بيانات التوريد</h2><p className="rounded-xl bg-green-50 p-3 text-sm"><span className="text-green-900/70">المنتج</span><strong className="mt-1 block">{product?.name ?? "—"}</strong></p><p className="rounded-xl bg-green-50 p-3 text-sm"><span className="text-green-900/70">المورد</span><strong className="mt-1 block">{supplier?.name ?? "—"}</strong></p><p className="rounded-xl bg-green-50 p-3 text-sm"><span className="text-green-900/70">المصنع المستلم</span><strong className="mt-1 block">{factory?.name ?? "لم يحدد"}</strong></p><p className="flex items-center gap-2 text-xs text-green-900/70"><CalendarDays size={15} />{formatDate(trip.trip_date)}</p></div><div className="space-y-3"><h2 className="font-bold">بيانات الحمولة والقيمة</h2><p className="flex items-center justify-between rounded-xl border border-green-100 p-3 text-sm"><span className="flex items-center gap-2 text-green-900/70"><Scale size={16} />الوزن</span><strong>{formatWeight(trip.weight_kg)}</strong></p><p className="flex items-center justify-between rounded-xl border border-green-100 p-3 text-sm"><span className="flex items-center gap-2 text-green-900/70"><Truck size={16} />رقم السيارة</span><bdi dir="auto" className="font-bold">{trip.plate_number ?? "—"}</bdi></p><p className="flex items-center justify-between rounded-xl border border-green-100 p-3 text-sm"><span>السعر</span><strong>{trip.price_per_kg == null ? "—" : `${trip.price_per_kg} جنيه/كجم`}</strong></p><TripPhotoViewer tripId={trip.id} blur={trip.photo_blur} /></div><div className="grid gap-2 border-t border-green-100 pt-4 sm:col-span-2 sm:grid-cols-3"><p className="rounded-xl bg-green-50 p-3 text-sm">الإجمالي<strong className="mt-1 block">{trip.gross_amount == null ? "—" : `${trip.gross_amount} جنيه`}</strong></p><p className="rounded-xl bg-green-50 p-3 text-sm">عمولة الشركة<strong className="mt-1 block">{trip.commission_amount == null ? "—" : `${trip.commission_amount} جنيه`}</strong></p><p className="rounded-xl bg-green-50 p-3 text-sm">مستحق المورد<strong className="mt-1 block">{trip.supplier_payable == null ? "—" : `${trip.supplier_payable} جنيه`}</strong></p></div></div></section>
    {locked ? <section className="mt-5 rounded-2xl border border-orange-100 bg-orange-100 p-5"><h2 className="font-bold">الرحلة مقفلة للتعديل</h2><p className="mt-2 text-sm text-green-900">تم اعتماد الرحلة من المصنع أو تجاوزت هذه المرحلة. تواصل مع المدير لإجراء أي تعديل.</p></section> : <>
      {query.error && <p role="alert" className="mt-4 rounded-xl bg-orange-100 p-3 text-sm text-green-900">{errors[query.error] ?? "تعذر حفظ البيانات."}</p>}{query.saved && <p className="mt-4 rounded-xl bg-green-50 p-3 text-sm text-green-900">تم حفظ التعديلات.</p>}{query.locked && <p role="alert" className="mt-4 rounded-xl bg-orange-100 p-3 text-sm text-green-900">قُفلت الرحلة أثناء التعديل. تواصل مع المدير.</p>}
    <TripEditForm trip={trip} isAdmin={profile.role === "admin"} ownerId={profile.id} products={products ?? []} suppliers={suppliers ?? []} factories={factories ?? []} engineers={engineerOptions} supplierLinks={supplierLinks ?? []} factoryLinks={factoryLinks ?? []} referencePrice={reference?.price_per_kg ?? null} referenceIsToday={reference?.is_today ?? null} referenceDaysOld={reference?.days_old ?? null} />
    </>}
    </div></main></>;
}
