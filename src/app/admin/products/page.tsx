import { requireAdmin } from "@/lib/authz";
import { timeSupabase } from "@/lib/supabase/timing";
import { ProductManager } from "./product-manager";

export default async function ProductsPage({ searchParams }: { searchParams: Promise<{ error?: string; saved?: string }> }) {
  const [{ supabase }, params] = await Promise.all([requireAdmin(), searchParams]);
  const [{ data: products }, { data: prices }] = await Promise.all([
    timeSupabase("products.products", supabase.from("products").select("id, name, state, is_active").order("name")),
    timeSupabase("products.current_prices", supabase.from("product_current_price").select("product_id, price_per_kg, price_date, is_today, days_old")),
  ]);
  const today = new Intl.DateTimeFormat("en-CA", { timeZone: "Africa/Cairo", year: "numeric", month: "2-digit", day: "2-digit" }).format(new Date());
  return <>
    <div className="flex flex-wrap items-end justify-between gap-3"><div><p className="text-sm font-bold text-green-700">إدارة البيانات الأساسية / المنتجات</p><h1 className="mt-2 text-2xl font-extrabold md:text-3xl">المنتجات والأسعار اليومية</h1><p className="mt-2 text-sm text-green-900/70">تحديث مرجع سعر الكيلو وربط بيانات المنتجات المتاحة.</p></div><span className="rounded-full bg-green-100 px-3 py-2 text-xs font-bold text-green-900">أسعار اليوم · <bdi dir="ltr">{today}</bdi></span></div>
    {params.error && <p role="alert" className="mt-3 rounded-xl bg-orange-100 p-3 text-sm text-green-900">تعذر حفظ البيانات. راجع القيم والاتصال.</p>}
    <div className="mt-7"><ProductManager products={products ?? []} prices={prices ?? []} today={today} /></div>
  </>;
}
