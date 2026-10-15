"use client";

import { useEffect, useState } from "react";
import { createTrip } from "../actions";
import { SearchableSelect, type SearchOption } from "@/components/searchable-select";
import { TripPhotoInput } from "@/components/trip-photo-input";
import { useRouter } from "next/navigation";
import { enqueueTrip } from "@/lib/offline/queue";
import { toast } from "sonner";
import { FormSubmitButton } from "@/components/form-submit-button";
import { Camera, CircleAlert, PackageCheck, Truck } from "lucide-react";

type Choice = { id: string; name: string; state?: string };
export function TripForm({ suppliers, products, factories, supplierLinks, factoryLinks, ownerId, defaultCommissionPct, error, modal = false, onSaved }: { suppliers: Choice[]; products: Choice[]; factories: Choice[]; supplierLinks: { supplier_id: string; product_id: string }[]; factoryLinks: { factory_id: string; product_id: string }[]; ownerId: string; defaultCommissionPct: number; error?: string; modal?: boolean; onSaved?: () => void }) {
  const router = useRouter();
  const [productId, setProductId] = useState("");
  const [tripId, setTripId] = useState("");
  useEffect(() => setTripId(globalThis.crypto.randomUUID()), []);
  const availableSuppliers = productId && supplierLinks.some((link) => link.product_id === productId)
    ? suppliers.filter((supplier) => supplierLinks.some((link) => link.product_id === productId && link.supplier_id === supplier.id))
    : suppliers;
  const availableFactories = productId && factoryLinks.some((link) => link.product_id === productId)
    ? factories.filter((factory) => factoryLinks.some((link) => link.product_id === productId && link.factory_id === factory.id))
    : factories;
  const productOptions: SearchOption[] = products.map((item) => ({ id: item.id, label: `${item.name}${item.state ? ` · ${item.state === "fresh" ? "طازج" : "مجمد"}` : ""}` }));
  const supplierOptions: SearchOption[] = availableSuppliers.map((item) => ({ id: item.id, label: item.name }));
  const factoryOptions: SearchOption[] = availableFactories.map((item) => ({ id: item.id, label: item.name }));
  async function submit(formData: FormData) {
    if (navigator.onLine) {
      try {
        const result = await createTrip(formData);
        if (!result.ok) { toast.error("تعذر حفظ الرحلة. راجع البيانات والاتصال."); return; }
        toast.success("تم حفظ الرحلة");
        onSaved?.();
        router.push("/trips");
        return;
      } catch { /* Queue the same UUID if the request lost its connection. */ }
    }
    const photo = formData.get("photo");
    onSaved?.();
    await enqueueTrip({
      id: String(formData.get("id")), operation: "create", owner_id: ownerId,
      supplier_id: String(formData.get("supplier_id")), product_id: String(formData.get("product_id")), factory_id: String(formData.get("factory_id")) || null,
      status: "loaded", plate_number: String(formData.get("plate_number") ?? "").trim() || null,
      weight_kg: String(formData.get("weight_kg") ?? "").trim() ? Number(formData.get("weight_kg")) : null,
      price_per_kg: null, commission_pct: defaultCommissionPct,
      photo: photo instanceof File && photo.size > 0 ? photo : null, photo_blur: String(formData.get("photo_blur") ?? "") || null,
    });
    router.push("/~offline?queued=1");
  }
  return <form action={submit} className={`mt-5 space-y-4 ${modal ? "pb-0" : "pb-24 md:pb-0"}`}>
    <input type="hidden" name="id" value={tripId} />
    {error && <p role="alert" className="rounded-xl border border-orange-500 bg-orange-100 p-3 text-sm text-green-900">{error === "save" ? "تعذر حفظ الرحلة. تحقق من البيانات أو الاتصال." : "تعذر تجهيز نموذج الرحلة."}</p>}
    <div className="flex items-start gap-3 rounded-xl border border-orange-500 bg-orange-100 p-4 text-sm leading-6 text-green-900"><CircleAlert aria-hidden className="mt-0.5 shrink-0 text-orange-700" size={18} /><p>أكمل بيانات الحمولة وصورة الشحنة. يمكن حفظ الرحلة دون اتصال وستتم مزامنتها عند عودة الاتصال.</p></div>
    <section className="rounded-2xl border border-green-100 bg-white p-4 shadow-sm md:p-6"><header className="mb-5 flex items-center justify-between gap-3 border-b border-green-100 pb-4"><div className="flex items-center gap-3"><span className="flex h-10 w-10 items-center justify-center rounded-xl bg-green-100 text-green-700"><PackageCheck size={20} /></span><div><h2 className="font-bold">بيانات المحصول والتوريد</h2><p className="mt-1 text-xs text-green-900/70">اختَر المنتج ثم حدّد المورد والمصنع.</p></div></div><span className="rounded-full bg-green-50 px-3 py-1 text-xs font-bold text-green-700">الخطوة 1 من 3</span></header><div className="grid gap-4 md:grid-cols-2"><SearchableSelect label="المنتج" name="product_id" options={productOptions} onChange={setProductId} /><SearchableSelect label="المورد" name="supplier_id" options={supplierOptions} /><div className="md:col-span-2"><SearchableSelect label="المصنع المستلم" name="factory_id" options={factoryOptions} /></div></div></section>
    <section className="rounded-2xl border border-green-100 bg-white p-4 shadow-sm md:p-6"><header className="mb-5 flex items-center justify-between gap-3 border-b border-green-100 pb-4"><div className="flex items-center gap-3"><span className="flex h-10 w-10 items-center justify-center rounded-xl bg-green-100 text-green-700"><Truck size={20} /></span><div><h2 className="font-bold">بيانات الشاحنة والوزن</h2><p className="mt-1 text-xs text-green-900/70">أدخل الوزن ورقم لوحة السيارة.</p></div></div><span className="rounded-full bg-green-50 px-3 py-1 text-xs font-bold text-green-700">الخطوة 2 من 3</span></header><div className="grid gap-4 sm:grid-cols-2"><label className="block text-sm font-semibold">الوزن المبدئي (كجم)<input type="number" min="0.001" step="0.001" name="weight_kg" className="mt-2 w-full rounded-xl border border-green-100 ps-4 pe-4 py-3" /></label><label className="block text-sm font-semibold">رقم السيارة<input name="plate_number" className="mt-2 w-full rounded-xl border border-green-100 ps-4 pe-4 py-3" /></label></div></section>
    <section className="rounded-2xl border border-green-100 bg-white p-4 shadow-sm md:p-6"><header className="mb-5 flex items-center justify-between gap-3 border-b border-green-100 pb-4"><div className="flex items-center gap-3"><span className="flex h-10 w-10 items-center justify-center rounded-xl bg-green-100 text-green-700"><Camera size={20} /></span><div><h2 className="font-bold">صورة الحمولة</h2><p className="mt-1 text-xs text-green-900/70">أرفق صورة واضحة للتوثيق الميداني.</p></div></div><span className="rounded-full bg-green-50 px-3 py-1 text-xs font-bold text-green-700">الخطوة 3 من 3</span></header><TripPhotoInput /></section>
    <div className={modal ? "border-t border-green-100 bg-white pt-3" : "fixed inset-x-0 bottom-[4.5rem] z-30 border-t border-green-100 bg-white p-3 md:static md:border-0 md:bg-transparent md:p-0"}><div className="mx-auto flex max-w-2xl items-center gap-3"><p className="hidden flex-1 text-xs leading-5 text-green-900/70 md:block">حُفظت الرحلة بحالة «تم التحميل». عمولة الشركة تُنسخ تلقائيًا من صفحة المحاسبة.</p><FormSubmitButton disabled={!tripId} className="min-h-12 w-full rounded-xl border border-green-700 bg-white px-5 py-3 font-bold text-green-900 hover:bg-green-50 md:w-auto">حفظ الرحلة</FormSubmitButton></div></div>
  </form>;
}
