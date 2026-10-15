import { requireProfile } from "@/lib/authz";
import { SupplierManager } from "./supplier-manager";
import { AppHeader } from "@/components/app-header";

export default async function SuppliersPage() {
  const { supabase, profile } = await requireProfile();
  const [{ data: suppliers }, { data: products }, { data: links }] = await Promise.all([
    supabase.from("suppliers").select("id, name, phone, address, notes, is_active").order("name"),
    supabase.from("products").select("id, name, state").eq("is_active", true).order("name"),
    supabase.from("supplier_products").select("supplier_id, product_id"),
  ]);
  return <><AppHeader profile={profile} title="إدارة الموردين والمزارع" /><main className="mx-auto min-h-screen max-w-[1440px] px-4 py-5 pb-24 md:px-8 md:py-8">
    <div className="flex flex-wrap items-end justify-between gap-3"><div><p className="text-sm font-bold text-green-700">إدارة البيانات الأساسية</p><h2 className="mt-2 text-2xl font-extrabold md:text-3xl">الموردون والمزارع</h2><p className="mt-2 text-sm text-green-900/70">تحديث بيانات المورد وربطه بالمحاصيل التي يوردها.</p></div><span className="rounded-full bg-green-100 px-3 py-2 text-xs font-bold text-green-900">بيانات مباشرة</span></div>
    <div className="mt-7"><SupplierManager suppliers={suppliers ?? []} products={products ?? []} links={links ?? []} admin={profile.role === "admin"} /></div>
  </main></>;
}
