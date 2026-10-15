"use client";

import { useState } from "react";
import { updateTrip } from "../actions";
import { SearchableSelect, type SearchOption } from "@/components/searchable-select";
import { statusLabels } from "@/lib/format";
import { TripPhotoInput } from "@/components/trip-photo-input";
import { useRouter } from "next/navigation";
import { enqueueTrip } from "@/lib/offline/queue";
import { toast } from "sonner";
import { FormSubmitButton } from "@/components/form-submit-button";

type Choice = { id: string; name: string; state?: string; is_active?: boolean };
type LinkedProduct = { supplier_id?: string; factory_id?: string; product_id: string };
type TripData = { id: string; engineer_id: string; supplier_id: string; product_id: string; factory_id: string | null; trip_date: string; status: string; plate_number: string | null; weight_kg: number | null; price_per_kg: number | null; commission_pct: number; notes: string | null; analysis_note: string | null; photo_path: string | null; photo_blur: string | null };
const statuses = ["loaded", "in_transit", "arrived", "factory_accepted", "analysis_accepted", "analysis_rejected", "rejected"];
const engineerNext: Record<string, string[]> = { loaded: ["loaded", "in_transit"], in_transit: ["in_transit", "arrived"], arrived: ["arrived", "factory_accepted"] };

export function TripEditForm({ trip, isAdmin, ownerId, products, suppliers, factories, engineers, supplierLinks, factoryLinks, referencePrice, referenceIsToday, referenceDaysOld }: {
  trip: TripData; isAdmin: boolean; ownerId: string; products: Choice[]; suppliers: Choice[]; factories: Choice[]; engineers: SearchOption[];
  supplierLinks: LinkedProduct[]; factoryLinks: LinkedProduct[]; referencePrice: number | null; referenceIsToday: boolean | null; referenceDaysOld: number | null;
}) {
  const router = useRouter();
  const [productId, setProductId] = useState(trip.product_id);
  const [status, setStatus] = useState(trip.status);
  const [price, setPrice] = useState(trip.price_per_kg?.toString() ?? "");
  const supplierIds = new Set(supplierLinks.filter((link) => link.product_id === productId).map((link) => link.supplier_id));
  const factoryIds = new Set(factoryLinks.filter((link) => link.product_id === productId).map((link) => link.factory_id));
  const supplierOptions = suppliers.filter((item) => item.is_active || item.id === trip.supplier_id).filter((item) => !supplierIds.size || supplierIds.has(item.id) || item.id === trip.supplier_id).map((item) => ({ id: item.id, label: item.name }));
  const factoryOptions = factories.filter((item) => item.is_active || item.id === trip.factory_id).filter((item) => !factoryIds.size || factoryIds.has(item.id) || item.id === trip.factory_id).map((item) => ({ id: item.id, label: item.name }));
  const productOptions: SearchOption[] = products.filter((item) => item.is_active || item.id === trip.product_id).map((item) => ({ id: item.id, label: `${item.name}${item.state ? ` · ${item.state === "fresh" ? "طازج" : "مجمد"}` : ""}` }));
  const allowedStatuses = isAdmin ? statuses : engineerNext[trip.status] ?? [];
  const priceBadge = referencePrice == null ? "لا يوجد سعر مرجعي" : referenceIsToday ? "سعر اليوم" : `آخر تحديث منذ ${referenceDaysOld ?? 0} يوم`;

  async function submit(formData: FormData) {
    if (navigator.onLine) {
      try {
        const result = await updateTrip(formData);
        if (!result.ok) { toast.error("تعذر حفظ التعديلات. راجع الحالة والبيانات."); return; }
        toast.success("تم حفظ التعديلات");
        router.refresh();
        return;
      } catch { /* Preserve the edit in the outbox if the request lost its connection. */ }
    }
    const photo = formData.get("photo");
    await enqueueTrip({
      id: trip.id, operation: "update", owner_id: ownerId,
      engineer_id: String(formData.get("engineer_id") ?? trip.engineer_id), trip_date: String(formData.get("trip_date") ?? trip.trip_date),
      supplier_id: String(formData.get("supplier_id") ?? trip.supplier_id), product_id: String(formData.get("product_id") ?? trip.product_id), factory_id: String(formData.get("factory_id") ?? "") || null,
      status: String(formData.get("status") ?? trip.status), plate_number: String(formData.get("plate_number") ?? "").trim() || null,
      weight_kg: String(formData.get("weight_kg") ?? "").trim() ? Number(formData.get("weight_kg")) : null,
      price_per_kg: formData.has("price_per_kg") ? (String(formData.get("price_per_kg") ?? "").trim() ? Number(formData.get("price_per_kg")) : null) : trip.price_per_kg,
      commission_pct: String(formData.get("commission_pct") ?? "").trim() ? Number(formData.get("commission_pct")) : trip.commission_pct,
      analysis_note: String(formData.get("analysis_note") ?? trip.analysis_note ?? "") || null,
      notes: String(formData.get("notes") ?? trip.notes ?? "") || null,
      photo: photo instanceof File && photo.size > 0 ? photo : null, photo_blur: String(formData.get("photo_blur") ?? trip.photo_blur ?? "") || null,
    });
    router.push("/~offline?queued=1");
  }

  return <form action={submit} className="mt-5 space-y-4 pb-24 md:pb-0">
    <input type="hidden" name="id" value={trip.id} />
    <section className="rounded-2xl border border-green-100 bg-white p-4 shadow-sm md:p-6"><header className="mb-5 border-b border-green-100 pb-4"><h2 className="font-bold">بيانات التوريد</h2><p className="mt-1 text-xs text-green-900/70">المهندس المسؤول والمنتج والمورد والمصنع.</p></header>
    {isAdmin && <SearchableSelect label="مسؤول الرحلة" name="engineer_id" options={engineers} initialId={trip.engineer_id} />}
    {isAdmin && <label className="block text-sm font-semibold">تاريخ الرحلة<input required type="date" name="trip_date" defaultValue={trip.trip_date} className="mt-2 w-full rounded-xl border border-green-100 ps-4 pe-4 py-3" /></label>}
    <SearchableSelect label="المنتج" name="product_id" options={productOptions} initialId={trip.product_id} onChange={setProductId} />
    <SearchableSelect label="المورد" name="supplier_id" options={supplierOptions} initialId={trip.supplier_id} />
    <SearchableSelect label="المصنع" name="factory_id" options={factoryOptions} initialId={trip.factory_id ?? ""} />
    </section>
    <section className="rounded-2xl border border-green-100 bg-white p-4 shadow-sm md:p-6"><header className="mb-5 border-b border-green-100 pb-4"><h2 className="font-bold">حالة الرحلة والحمولة</h2><p className="mt-1 text-xs text-green-900/70">تحديث المرحلة والوزن وبيانات المركبة.</p></header>
    <div className="grid gap-4 sm:grid-cols-2">
      <label className="block text-sm font-semibold">الحالة<select name="status" value={status} onChange={(event) => { const next = event.target.value; setStatus(next); if (next === "factory_accepted" && referencePrice != null && price === "") setPrice(String(referencePrice)); }} className="mt-2 w-full rounded-xl border border-green-100 bg-white ps-4 pe-4 py-3">{allowedStatuses.map((item) => <option key={item} value={item}>{statusLabels[item]}</option>)}</select></label>
      <label className="block text-sm font-semibold">الوزن (كجم)<input type="number" min="0.001" step="0.001" name="weight_kg" defaultValue={trip.weight_kg ?? ""} className="mt-2 w-full rounded-xl border border-green-100 ps-4 pe-4 py-3" /></label>
      <label className="block text-sm font-semibold">رقم السيارة<input name="plate_number" defaultValue={trip.plate_number ?? ""} className="mt-2 w-full rounded-xl border border-green-100 ps-4 pe-4 py-3" /></label>
      {(isAdmin || status === "factory_accepted") && <label className="block text-sm font-semibold">سعر القبول (جنيه/كجم)<input type="number" min="0" step="0.01" name="price_per_kg" value={price} onChange={(event) => setPrice(event.target.value)} className="mt-2 w-full rounded-xl border border-green-100 ps-4 pe-4 py-3" /><span className="mt-1 inline-flex rounded-full bg-green-500 ps-3 pe-3 py-1 text-xs font-medium text-green-900">{priceBadge}{referencePrice != null ? ` · ${referencePrice} جنيه/كجم` : ""}</span></label>}
      {isAdmin && <label className="block text-sm font-semibold">عمولة الشركة (%)<input type="number" min="0" max="100" step="0.01" name="commission_pct" defaultValue={trip.commission_pct} className="mt-2 w-full rounded-xl border border-green-100 ps-4 pe-4 py-3" /></label>}
      {isAdmin && <label className="block text-sm font-semibold">ملاحظة التحليل<textarea name="analysis_note" defaultValue={trip.analysis_note ?? ""} className="mt-2 min-h-24 w-full rounded-xl border border-green-100 ps-4 pe-4 py-3" /></label>}
      {isAdmin && <label className="block text-sm font-semibold">ملاحظات الرحلة<textarea name="notes" defaultValue={trip.notes ?? ""} className="mt-2 min-h-24 w-full rounded-xl border border-green-100 ps-4 pe-4 py-3" /></label>}
    </div>
    </section>
    {(!trip.photo_path || isAdmin) && <section className="rounded-2xl border border-green-100 bg-white p-4 shadow-sm md:p-6"><header className="mb-4 border-b border-green-100 pb-4"><h2 className="font-bold">توثيق صورة الحمولة</h2><p className="mt-1 text-xs text-green-900/70">تُعرض الصورة من التخزين الخاص برابط آمن.</p></header><TripPhotoInput initialBlur={trip.photo_blur ?? ""} label={trip.photo_path ? "استبدال صورة الحمولة" : "صورة الحمولة (اختياري)"} /></section>}
    <div className="fixed inset-x-0 bottom-[4.5rem] z-30 border-t border-green-100 bg-white p-3 md:static md:border-0 md:bg-transparent md:p-0"><FormSubmitButton className="min-h-12 w-full rounded-xl border border-green-700 bg-white px-5 py-3 font-bold text-green-900 hover:bg-green-50 md:w-auto">حفظ التعديلات</FormSubmitButton></div>
  </form>;
}
