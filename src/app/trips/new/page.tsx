import { requireProfile } from "@/lib/authz";
import { TripForm } from "./trip-form";
import { OfflineCacheSnapshot } from "@/components/offline-cache-snapshot";
import { AppHeader } from "@/components/app-header";

const names = { setup: "تعذر قراءة إعدادات النظام. اطلب من المدير تهيئة قاعدة البيانات.", invalid: "أكمل الحقول المطلوبة وأدخل وزنًا صحيحًا.", save: "تعذر حفظ الرحلة. تحقق من البيانات أو الاتصال." };

export default async function NewTripPage({ searchParams }: { searchParams: Promise<{ error?: string }> }) {
  const { error } = await searchParams;
  const { supabase, user, profile } = await requireProfile();
  const [{ data: suppliers }, { data: products }, { data: factories }, { data: supplierLinks }, { data: factoryLinks }, { data: settings }, { data: prices }] = await Promise.all([
    supabase.from("suppliers").select("id, name").eq("is_active", true).order("name"),
    supabase.from("products").select("id, name, state").eq("is_active", true).order("name"),
    supabase.from("factories").select("id, name").eq("is_active", true).order("name"),
    supabase.from("supplier_products").select("supplier_id, product_id"),
    supabase.from("factory_products").select("factory_id, product_id"),
    supabase.from("settings").select("default_commission_pct").eq("id", true).maybeSingle(),
    supabase.from("product_current_price").select("product_id, price_per_kg, price_date, is_today, days_old"),
  ]);
  return <><AppHeader profile={profile} title="رحلة جديدة" /><main className="mx-auto min-h-screen max-w-[1440px] px-4 py-5 pb-24 md:px-8 md:py-8"><div className="mx-auto max-w-3xl">
    {error === "setup" && <p role="alert" className="mt-4 rounded-xl bg-orange-100 p-4 text-sm text-green-900">{names.setup}</p>}{error === "photo" && <p role="alert" className="mt-4 rounded-xl bg-orange-100 p-4 text-sm text-green-900">تعذر رفع الصورة. حاول اختيار صورة أخرى أو تحقق من الاتصال.</p>}
    <OfflineCacheSnapshot ownerId={user.id} entries={[{ kind: "suppliers", value: suppliers ?? [] }, { kind: "products", value: products ?? [] }, { kind: "factories", value: factories ?? [] }, { kind: "supplier_links", value: supplierLinks ?? [] }, { kind: "factory_links", value: factoryLinks ?? [] }, { kind: "settings", value: settings ?? { default_commission_pct: 0 } }, { kind: "product_prices", value: prices ?? [] }]} />
    <TripForm suppliers={suppliers ?? []} products={products ?? []} factories={factories ?? []} supplierLinks={supplierLinks ?? []} factoryLinks={factoryLinks ?? []} ownerId={user.id} defaultCommissionPct={settings?.default_commission_pct ?? 0} error={error} />
    {(!products?.length || !suppliers?.length) && <p className="mt-4 text-sm text-green-900/70">يلزم أن يضيف المدير المنتجات والموردين أولًا.</p>}
    </div></main></>;
}
