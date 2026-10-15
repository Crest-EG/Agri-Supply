"use client";

import { useActionState, useEffect, useState } from "react";
import { toast } from "sonner";
import { addDailyPrice, setProductActive, saveProduct, type ProductActionState } from "../actions";
import { Dialog, useDialogClose } from "@/components/dialog";
import { FormSubmitButton } from "@/components/form-submit-button";
import { BadgeCheck, CalendarDays, CircleCheck, CircleX, Pencil, Plus, Search } from "lucide-react";

type Product = { id: string; name: string; state: "fresh" | "frozen"; is_active: boolean };
type Price = { product_id: string; price_per_kg: number | null; price_date: string | null; is_today: boolean | null; days_old: number | null };
const initial: ProductActionState = { ok: null };

function useResult(state: ProductActionState) {
  const close = useDialogClose();
  useEffect(() => {
    if (state.ok === true) { toast.success("تم الحفظ بنجاح"); close(); }
    if (state.ok === false) toast.error("تعذر الحفظ. راجع البيانات والاتصال.");
  }, [state, close]);
}

function ProductForm({ product }: { product?: Product }) {
  const [state, action] = useActionState(saveProduct, initial);
  useResult(state);
  return <form action={action} className="grid gap-3">
    {product && <input type="hidden" name="id" value={product.id} />}
    <label className="grid gap-1 text-sm font-semibold">اسم المنتج<input name="name" required defaultValue={product?.name} className="min-h-11 rounded-lg border border-green-100 px-3" /></label>
    <label className="grid gap-1 text-sm font-semibold">نوع المنتج<select name="state" defaultValue={product?.state ?? "fresh"} className="min-h-11 rounded-lg border border-green-100 bg-white px-3"><option value="fresh">طازج</option><option value="frozen">مجمد</option></select></label>
    <FormSubmitButton className="rounded-lg bg-green-700 px-4 py-2 font-semibold text-white">{product ? "حفظ التعديلات" : "إضافة المنتج"}</FormSubmitButton>
  </form>;
}

function PriceEntry({ product, price, today }: { product: Product; price?: Price; today: string }) {
  const [state, action] = useActionState(addDailyPrice, initial);
  useResult(state);
  return <form action={action} className="flex flex-wrap items-center gap-2">
    <input type="hidden" name="product_id" value={product.id} />
    <input type="hidden" name="price_date" value={today} />
    <label className="sr-only" htmlFor={`price-${product.id}`}>سعر {product.name} اليوم</label>
    <input id={`price-${product.id}`} dir="ltr" name="price_per_kg" type="number" min="0" step="0.01" required defaultValue={price?.price_per_kg ?? ""} placeholder="أدخل سعر اليوم" onKeyDown={(event) => { if (event.key === "Enter") { event.preventDefault(); event.currentTarget.form?.requestSubmit(); } }} onBlur={(event) => { if (event.currentTarget.value !== "" && event.currentTarget.value !== String(price?.price_per_kg ?? "")) event.currentTarget.form?.requestSubmit(); }} className="min-h-11 w-36 rounded-lg border border-green-100 px-3 text-start" />
    <label className="flex items-center gap-2 text-xs font-semibold">تاريخ آخر تحديث<input aria-label={`تاريخ آخر تحديث لسعر ${product.name}`} type="text" dir="ltr" value={price?.price_date ?? "—"} readOnly className="min-h-11 w-32 rounded-lg border border-green-100 px-2 text-start" /></label>
    <span className={`inline-flex items-center gap-1 rounded-full px-2 py-1 text-xs ${price?.is_today ? "bg-green-500 text-green-900" : "bg-orange-100 text-green-900"}`}>
      {price?.is_today ? <BadgeCheck aria-hidden size={14} /> : <CalendarDays aria-hidden size={14} />}
      {price?.is_today ? "سعر اليوم" : price ? `آخر تحديث منذ ${price.days_old} يوم` : "لا يوجد سعر"}
    </span>
  </form>;
}

function ProductRow({ product, price, today }: { product: Product; price?: Price; today: string }) {
  const [state, action] = useActionState(setProductActive, initial);
  useResult(state);
  return <article className="grid gap-3 border-b border-green-100 p-3 last:border-0 md:grid-cols-[minmax(170px,1fr)_minmax(250px,1.2fr)_auto] md:items-center md:px-4">
    <div><h2 className="font-semibold">{product.name}</h2><p className="mt-1 flex items-center gap-1 text-sm text-green-900/70">{product.state === "fresh" ? "طازج" : "مجمد"}<span aria-hidden>·</span>{product.is_active ? "نشط" : "موقوف"}</p></div>
    {product.is_active ? <PriceEntry product={product} price={price} today={today} /> : <span className="text-sm text-green-900/70">متوقف</span>}
    <div className="flex items-center gap-2">
      <Dialog title="تعديل المنتج" trigger={<button type="button" className="flex min-h-11 items-center gap-2 rounded-lg border border-green-100 px-3 text-sm text-green-700"><Pencil aria-hidden size={16} />تعديل</button>}><ProductForm product={product} /></Dialog>
      <form action={action}><input type="hidden" name="id" value={product.id} /><input type="hidden" name="is_active" value={String(!product.is_active)} /><button type="submit" aria-label={`${product.is_active ? "إيقاف" : "تفعيل"} ${product.name}`} className="inline-flex min-h-11 items-center gap-2 rounded-lg border border-green-700 bg-white px-3 text-sm font-semibold text-green-900 hover:bg-green-50">{product.is_active ? <CircleX aria-hidden size={16} /> : <CircleCheck aria-hidden size={16} />}{product.is_active ? "إيقاف" : "تفعيل"}</button></form>
    </div>
  </article>;
}

export function ProductManager({ products, prices, today }: { products: Product[]; prices: Price[]; today: string }) {
  const [search, setSearch] = useState("");
  const [filter, setFilter] = useState<"all" | "fresh" | "frozen">("all");
  const priceByProduct = new Map(prices.map((price) => [price.product_id, price]));
  const visible = products.filter((item) => item.name.toLowerCase().includes(search.toLowerCase()) && (filter === "all" || item.state === filter));
  return <div>
    <div className="mb-4 flex flex-wrap items-center gap-3 rounded-2xl border border-green-100 bg-white p-4 shadow-sm"><label className="relative min-w-[220px] flex-1"><span className="sr-only">ابحث عن منتج</span><Search aria-hidden className="absolute inset-y-0 start-3 my-auto text-green-700" size={18} /><input value={search} onChange={(event) => setSearch(event.target.value)} placeholder="ابحث باسم المنتج" className="w-full rounded-xl border border-green-100 ps-10 pe-4" /></label><div className="flex w-full gap-1 rounded-xl bg-green-50 p-1 sm:w-auto">{([ ["all", "الكل"], ["fresh", "طازج"], ["frozen", "مجمد"] ] as const).map(([key, label]) => <button type="button" key={key} onClick={() => setFilter(key)} className={`min-h-10 rounded-lg px-3 text-xs font-bold ${filter === key ? "bg-green-700 text-white" : "text-green-900 hover:bg-green-100"}`}>{label}</button>)}</div><Dialog title="إضافة منتج" trigger={<button type="button" className="inline-flex min-h-12 w-full shrink-0 items-center justify-center gap-2 rounded-xl border border-green-700 bg-white px-5 font-bold text-green-900 hover:bg-green-50 sm:w-auto"><Plus aria-hidden size={17} />إضافة منتج</button>}><ProductForm /></Dialog></div>
    <div className="overflow-hidden rounded-2xl border border-green-100 bg-white shadow-sm"><div className="hidden grid-cols-[minmax(170px,1fr)_minmax(250px,1.2fr)_auto] items-center gap-3 border-b-2 border-green-700 bg-green-50 px-4 py-3 text-xs font-bold md:grid"><span>المنتج</span><span>السعر اليومي</span><span>إجراءات</span></div>
      {visible.length ? visible.map((product) => <ProductRow key={product.id} product={product} price={priceByProduct.get(product.id)} today={today} />) : <div className="p-10 text-center"><h3 className="font-bold">لا توجد نتائج</h3><p className="mt-2 text-sm text-green-900/70">أضف منتجًا أو عدّل كلمات البحث.</p></div>}
    </div>
  </div>;
}
