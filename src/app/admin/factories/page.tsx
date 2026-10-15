import { requireAdmin } from "@/lib/authz";
import { FactoryManager } from "./factory-manager";

export default async function FactoriesPage() {
  const { supabase } = await requireAdmin();
  const [{ data: factories }, { data: products }, { data: links }] = await Promise.all([
    supabase.from("factories").select("id, name, phone, address, notes, is_active").order("name"),
    supabase.from("products").select("id, name, state").eq("is_active", true).order("name"),
    supabase.from("factory_products").select("factory_id, product_id"),
  ]);
  return <>
    <div className="flex flex-wrap items-end justify-between gap-3"><div><p className="text-sm font-bold text-green-700">إدارة البيانات الأساسية / المصانع</p><h1 className="mt-2 text-2xl font-extrabold md:text-3xl">المصانع ومحطات الاستلام</h1><p className="mt-2 text-sm text-green-900/70">إدارة المصانع وربط المنتجات التي تستقبلها.</p></div><span className="rounded-full bg-green-100 px-3 py-2 text-xs font-bold text-green-900">بيانات مباشرة</span></div>
    <div className="mt-7"><FactoryManager factories={factories ?? []} products={products ?? []} links={links ?? []} /></div>
  </>;
}
