"use client";

import { useActionState, useEffect, useMemo, useState } from "react";
import { toast } from "sonner";
import { Dialog, useDialogClose } from "@/components/dialog";
import { FormSubmitButton } from "@/components/form-submit-button";
import { setFactoryActive, saveFactory, setFactoryProducts, type ProductActionState } from "../actions";
import { CircleCheck, CircleX, Pencil, Plus, Search } from "lucide-react";

type Factory = { id: string; name: string; phone: string | null; address: string | null; notes: string | null; is_active: boolean };
type Product = { id: string; name: string; state: string };
const initial: ProductActionState = { ok: null };
function Result({ state }: { state: ProductActionState }) { const close = useDialogClose(); useEffect(() => { if (state.ok) { toast.success("تم الحفظ"); close(); } else if (state.ok === false) toast.error("تعذر الحفظ. راجع البيانات والاتصال."); }, [state, close]); return null; }
function FactoryForm({ factory }: { factory?: Factory }) {
  const [state, action] = useActionState(saveFactory, initial);
  return <form action={action} className="grid gap-3"><Result state={state} />{factory && <input type="hidden" name="id" value={factory.id} />}
    <label className="grid gap-1 text-sm font-semibold">اسم المصنع<input required name="name" defaultValue={factory?.name} className="min-h-11 rounded-lg border border-green-100 px-3" /></label>
    <label className="grid gap-1 text-sm font-semibold">رقم الهاتف<input dir="ltr" name="phone" defaultValue={factory?.phone ?? ""} className="min-h-11 rounded-lg border border-green-100 px-3 text-start" /></label>
    <label className="grid gap-1 text-sm font-semibold">العنوان<input name="address" defaultValue={factory?.address ?? ""} className="min-h-11 rounded-lg border border-green-100 px-3" /></label>
    <label className="grid gap-1 text-sm font-semibold">ملاحظات الجودة<textarea name="notes" defaultValue={factory?.notes ?? ""} className="min-h-20 rounded-lg border border-green-100 px-3 py-2" /></label>
    <FormSubmitButton className="rounded-lg bg-green-700 px-4 py-2 font-semibold text-white">{factory ? "حفظ التعديلات" : "إضافة المصنع"}</FormSubmitButton>
  </form>;
}
function LinksForm({ factory, products, selected }: { factory: Factory; products: Product[]; selected: string[] }) {
  const [state, action] = useActionState(setFactoryProducts, initial);
  return <form action={action} className="mt-4 border-t border-green-100 pt-3"><Result state={state} /><input type="hidden" name="factory_id" value={factory.id} /><p className="text-sm font-semibold">المنتجات التي يستقبلها المصنع</p><div className="mt-2 grid grid-cols-2 gap-2 sm:grid-cols-3">{products.map((product) => <label key={product.id} className="flex min-h-11 items-center gap-2 rounded-lg bg-green-50 px-2 text-sm"><input type="checkbox" name="product_id" value={product.id} defaultChecked={selected.includes(product.id)} />{product.name}</label>)}</div><FormSubmitButton className="mt-3 rounded-lg border border-green-700 px-3 py-2 text-sm text-green-700">حفظ المنتجات</FormSubmitButton></form>;
}
function FactoryRow({ factory, products, selected }: { factory: Factory; products: Product[]; selected: string[] }) {
  const [state, action] = useActionState(setFactoryActive, initial);
  const selectedProducts = products.filter((item) => selected.includes(item.id));
  return <article className="grid gap-3 border-b border-green-100 p-4 last:border-0 hover:bg-green-50/70 md:grid-cols-[1.2fr_1fr_1.2fr_auto] md:items-center md:px-4"><Result state={state} /><div><h2 className="font-bold">{factory.name}</h2><span className={`mt-2 inline-flex rounded-full px-2.5 py-1 text-xs font-bold ${factory.is_active ? "bg-green-100 text-green-900" : "border border-orange-500 bg-orange-100 text-green-900"}`}>{factory.is_active ? "نشط" : "موقوف"}</span></div><div className="text-sm"><p><bdi dir="ltr">{factory.phone || "بدون هاتف"}</bdi></p><p className="mt-1 text-xs text-green-900/70">{factory.address || "بدون عنوان"}</p></div><div className="flex flex-wrap gap-1.5">{selectedProducts.slice(0, 3).map((item) => <span key={item.id} className="rounded-full bg-green-100 px-2.5 py-1 text-xs font-semibold">{item.name}</span>)}{selectedProducts.length > 3 && <span className="rounded-full bg-green-50 px-2 py-1 text-xs">+{selectedProducts.length - 3}</span>}{selectedProducts.length === 0 && <span className="text-xs text-green-900/70">لم تربط منتجات</span>}</div>
    <div className="flex flex-wrap gap-2"><Dialog title="تعديل بيانات المصنع" trigger={<button type="button" className="flex min-h-11 items-center gap-2 rounded-lg border border-green-100 px-3 text-sm text-green-700"><Pencil aria-hidden size={16} />تعديل</button>}><FactoryForm factory={factory} /><LinksForm factory={factory} products={products} selected={selected} /></Dialog>
      <form action={action}><input type="hidden" name="id" value={factory.id} /><input type="hidden" name="is_active" value={String(!factory.is_active)} /><button type="submit" aria-label={`${factory.is_active ? "إيقاف" : "تفعيل"} ${factory.name}`} className="inline-flex min-h-11 items-center gap-2 rounded-lg border border-green-700 bg-white px-3 text-sm font-semibold text-green-900 hover:bg-green-50">{factory.is_active ? <CircleX aria-hidden size={16} /> : <CircleCheck aria-hidden size={16} />}{factory.is_active ? "إيقاف" : "تفعيل"}</button></form></div>
  </article>;
}
export function FactoryManager({ factories, products, links }: { factories: Factory[]; products: Product[]; links: { factory_id: string; product_id: string }[] }) {
  const [search, setSearch] = useState("");
  const [filter, setFilter] = useState<"all" | "active" | "inactive">("all");
  const byFactory = new Map<string, string[]>();
  for (const link of links) byFactory.set(link.factory_id, [...(byFactory.get(link.factory_id) ?? []), link.product_id]);
  const visible = useMemo(() => factories.filter((item) => `${item.name} ${item.phone ?? ""} ${item.address ?? ""}`.toLowerCase().includes(search.toLowerCase()) && (filter === "all" || (filter === "active" ? item.is_active : !item.is_active))), [factories, search, filter]);
  return <><div className="mb-4 flex flex-wrap items-center justify-between gap-3 rounded-2xl border border-green-100 bg-white p-4 shadow-sm"><label className="relative min-w-[220px] flex-1"><span className="sr-only">ابحث عن مصنع</span><Search aria-hidden className="absolute inset-y-0 start-3 my-auto text-green-700" size={18} /><input value={search} onChange={(event) => setSearch(event.target.value)} placeholder="ابحث باسم المصنع أو الهاتف" className="w-full rounded-xl border border-green-100 ps-10 pe-4" /></label><div className="flex w-full gap-1 rounded-xl bg-green-50 p-1 sm:w-auto">{([ ["all", "الكل"], ["active", "نشط"], ["inactive", "موقوف"] ] as const).map(([key, label]) => <button type="button" key={key} onClick={() => setFilter(key)} className={`min-h-10 rounded-lg px-3 text-xs font-bold ${filter === key ? "bg-green-700 text-white" : "text-green-900 hover:bg-green-100"}`}>{label}</button>)}</div><Dialog title="إضافة مصنع" trigger={<button type="button" className="inline-flex min-h-12 w-full items-center justify-center gap-2 rounded-xl border border-green-700 bg-white px-5 font-bold text-green-900 hover:bg-green-50 sm:w-auto"><Plus aria-hidden size={17} />إضافة مصنع</button>}><FactoryForm /></Dialog></div>
    <div className="overflow-hidden rounded-2xl border border-green-100 bg-white shadow-sm"><div className="hidden grid-cols-[1.2fr_1fr_1.2fr_auto] gap-3 border-b-2 border-green-700 bg-green-50 px-4 py-3 text-xs font-bold md:grid"><span>المصنع</span><span>بيانات التواصل</span><span>المنتجات المستقبلة</span><span>إجراءات</span></div>{visible.length ? visible.map((factory) => <FactoryRow key={factory.id} factory={factory} products={products} selected={byFactory.get(factory.id) ?? []} />) : <div className="p-10 text-center"><h3 className="font-bold">لا توجد نتائج</h3><p className="mt-2 text-sm text-green-900/70">جرّب تعديل البحث أو الفلتر المحدد.</p></div>}</div></>;
}
