"use client";

import { useActionState, useEffect, useMemo, useState } from "react";
import { toast } from "sonner";
import { Dialog, useDialogClose } from "@/components/dialog";
import { FormSubmitButton } from "@/components/form-submit-button";
import { setSupplierActive, saveSupplier, setSupplierProducts, type ProductActionState } from "@/app/admin/actions";
import { CircleCheck, CircleX, Pencil, Plus, Search } from "lucide-react";

type Supplier = { id: string; name: string; phone: string | null; address: string | null; notes: string | null; is_active: boolean };
type Product = { id: string; name: string; state: string };
const initial: ProductActionState = { ok: null };
function Result({ state }: { state: ProductActionState }) {
  const close = useDialogClose();
  useEffect(() => { if (state.ok) { toast.success("تم الحفظ"); close(); } else if (state.ok === false) toast.error("تعذر الحفظ. راجع البيانات والاتصال."); }, [state, close]);
  return null;
}
function SupplierForm({ supplier }: { supplier?: Supplier }) {
  const [state, action] = useActionState(saveSupplier, initial);
  return <form action={action} className="grid gap-3"><Result state={state} />
    {supplier && <input type="hidden" name="id" value={supplier.id} />}
    <label className="grid gap-1 text-sm font-semibold">اسم المورد<input required name="name" defaultValue={supplier?.name} className="min-h-11 rounded-lg border border-green-100 px-3" /></label>
    <label className="grid gap-1 text-sm font-semibold">رقم الهاتف<input dir="ltr" name="phone" defaultValue={supplier?.phone ?? ""} className="min-h-11 rounded-lg border border-green-100 px-3 text-start" /></label>
    <label className="grid gap-1 text-sm font-semibold">العنوان<input name="address" defaultValue={supplier?.address ?? ""} className="min-h-11 rounded-lg border border-green-100 px-3" /></label>
    <label className="grid gap-1 text-sm font-semibold">ملاحظات الجودة<textarea name="notes" defaultValue={supplier?.notes ?? ""} className="min-h-20 rounded-lg border border-green-100 px-3 py-2" /></label>
    <FormSubmitButton className="rounded-lg bg-green-700 px-4 py-2 font-semibold text-white">{supplier ? "حفظ التعديلات" : "إضافة المورد"}</FormSubmitButton>
  </form>;
}
function ProductLinks({ supplier, products, selected }: { supplier: Supplier; products: Product[]; selected: string[] }) {
  const [state, action] = useActionState(setSupplierProducts, initial);
  return <form action={action} className="mt-3 border-t border-green-100 pt-3"><Result state={state} /><input type="hidden" name="supplier_id" value={supplier.id} /><p className="text-sm font-semibold">المنتجات المتاحة</p><div className="mt-2 grid grid-cols-2 gap-2 sm:grid-cols-3">{products.map((product) => <label key={product.id} className="flex min-h-11 items-center gap-2 rounded-lg bg-green-50 px-2 text-sm"><input type="checkbox" name="product_id" value={product.id} defaultChecked={selected.includes(product.id)} />{product.name}</label>)}</div><FormSubmitButton className="mt-3 rounded-lg border border-green-700 px-3 py-2 text-sm text-green-700">حفظ المنتجات</FormSubmitButton></form>;
}
function SupplierRow({ supplier, products, selected, admin }: { supplier: Supplier; products: Product[]; selected: string[]; admin: boolean }) {
  const [state, action] = useActionState(setSupplierActive, initial);
  const selectedProducts = products.filter((item) => selected.includes(item.id));
  return <article className="grid gap-3 border-b border-green-100 p-4 last:border-0 hover:bg-green-50/70 md:grid-cols-[1.1fr_1fr_1.1fr_1.2fr_auto] md:items-center md:px-4"><Result state={state} /><div><h2 className="font-bold">{supplier.name}</h2><span className={`mt-2 inline-flex rounded-full px-2.5 py-1 text-xs font-bold ${supplier.is_active ? "bg-green-100 text-green-900" : "border border-orange-500 bg-orange-100 text-green-900"}`}>{supplier.is_active ? "نشط" : "موقوف"}</span></div><div className="text-sm"><p><bdi dir="ltr">{supplier.phone || "بدون هاتف"}</bdi></p><p className="mt-1 text-xs text-green-900/70">{supplier.address || "بدون عنوان"}</p></div><div className="flex flex-wrap gap-1.5">{selectedProducts.slice(0, 3).map((item) => <span key={item.id} className="rounded-full bg-green-100 px-2.5 py-1 text-xs font-semibold">{item.name}</span>)}{selectedProducts.length > 3 && <span className="rounded-full bg-green-50 px-2 py-1 text-xs">+{selectedProducts.length - 3}</span>}{selectedProducts.length === 0 && <span className="text-xs text-green-900/70">لم تربط منتجات</span>}</div><p className="text-sm leading-6 text-green-900/70"><span className="font-semibold text-green-900">ملاحظات: </span>{supplier.notes?.trim() || "لا توجد ملاحظات"}</p>
    <div className="flex flex-wrap gap-2"><Dialog title="تعديل بيانات المورد" trigger={<button className="flex min-h-11 items-center gap-2 rounded-lg border border-green-100 px-3 text-sm text-green-700"><Pencil aria-hidden size={16} />تعديل</button>}><SupplierForm supplier={supplier} /><ProductLinks supplier={supplier} products={products} selected={selected} /></Dialog>
      {admin && <form action={action}><input type="hidden" name="id" value={supplier.id} /><input type="hidden" name="is_active" value={String(!supplier.is_active)} /><button type="submit" aria-label={`${supplier.is_active ? "إيقاف" : "تفعيل"} ${supplier.name}`} className="inline-flex min-h-11 items-center gap-2 rounded-lg border border-green-700 bg-white px-3 text-sm font-semibold text-green-900 hover:bg-green-50">{supplier.is_active ? <CircleX aria-hidden size={16} /> : <CircleCheck aria-hidden size={16} />}{supplier.is_active ? "إيقاف" : "تفعيل"}</button></form>}</div>
  </article>;
}
export function SupplierManager({ suppliers, products, links, admin }: { suppliers: Supplier[]; products: Product[]; links: { supplier_id: string; product_id: string }[]; admin: boolean }) {
  const [search, setSearch] = useState("");
  const [filter, setFilter] = useState<"all" | "active" | "inactive">("all");
  const productsBySupplier = new Map<string, string[]>();
  for (const link of links) productsBySupplier.set(link.supplier_id, [...(productsBySupplier.get(link.supplier_id) ?? []), link.product_id]);
  const visible = useMemo(() => suppliers.filter((item) => `${item.name} ${item.phone ?? ""} ${item.address ?? ""}`.toLowerCase().includes(search.toLowerCase()) && (filter === "all" || (filter === "active" ? item.is_active : !item.is_active))), [suppliers, search, filter]);
  return <><div className="mb-4 flex flex-wrap items-center justify-between gap-3 rounded-2xl border border-green-100 bg-white p-4 shadow-sm"><label className="relative min-w-[220px] flex-1"><span className="sr-only">ابحث عن مورد</span><Search aria-hidden className="absolute inset-y-0 start-3 my-auto text-green-700" size={18} /><input value={search} onChange={(event) => setSearch(event.target.value)} placeholder="ابحث باسم المورد أو الهاتف" className="w-full rounded-xl border border-green-100 ps-10 pe-4" /></label><div className="flex w-full gap-1 rounded-xl bg-green-50 p-1 sm:w-auto">{([ ["all", "الكل"], ["active", "نشط"], ["inactive", "موقوف"] ] as const).map(([key, label]) => <button type="button" key={key} onClick={() => setFilter(key)} className={`min-h-10 rounded-lg px-3 text-xs font-bold ${filter === key ? "bg-green-700 text-white" : "text-green-900 hover:bg-green-100"}`}>{label}</button>)}</div><Dialog title="إضافة مورد" trigger={<button className="inline-flex min-h-12 w-full items-center justify-center gap-2 rounded-xl border border-green-700 bg-white px-5 font-bold text-green-900 hover:bg-green-50 sm:w-auto"><Plus aria-hidden size={17} />إضافة مورد</button>}><SupplierForm /></Dialog></div>
    <div className="overflow-hidden rounded-2xl border border-green-100 bg-white shadow-sm"><div className="hidden grid-cols-[1.1fr_1fr_1.1fr_1.2fr_auto] gap-3 border-b-2 border-green-700 bg-green-50 px-4 py-3 text-xs font-bold md:grid"><span>المورد</span><span>بيانات التواصل</span><span>المنتجات المرتبطة</span><span>ملاحظات</span><span>إجراءات</span></div>{visible.length ? visible.map((supplier) => <SupplierRow key={supplier.id} supplier={supplier} products={products} selected={productsBySupplier.get(supplier.id) ?? []} admin={admin} />) : <div className="p-10 text-center"><h3 className="font-bold">لا توجد نتائج</h3><p className="mt-2 text-sm text-green-900/70">جرّب تعديل البحث أو الفلتر المحدد.</p></div>}</div></>;
}
