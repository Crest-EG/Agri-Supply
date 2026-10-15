import { requireAdmin } from "@/lib/authz";
import { formatWeight, formatDate, statusLabels } from "@/lib/format";
import { getAccountingRows, type AccountingRow } from "./data";
import { Wallet } from "lucide-react";
import { CommissionForm } from "@/app/admin/settings/commission-form";

export default async function AccountingPage() {
  const { supabase } = await requireAdmin();
  const [{ data, error }, { data: settings }] = await Promise.all([
    getAccountingRows({}),
    supabase.from("settings").select("default_commission_pct").eq("id", true).maybeSingle(),
  ]);
  const rows = (data ?? []) as AccountingRow[];
  const commission = settings?.default_commission_pct ?? 0;

  return <>
    <div className="flex flex-wrap items-end justify-between gap-4"><div><p className="text-sm font-bold text-green-700">التقارير / المحاسبة</p><h1 className="mt-2 flex items-center gap-3 text-2xl font-extrabold md:text-3xl"><span className="flex h-11 w-11 items-center justify-center rounded-xl bg-green-100 text-green-700"><Wallet size={22} /></span>المحاسبة والماليات والتدقيق</h1><p className="mt-2 text-sm text-green-900/70">العمولة الافتراضية وتقارير جميع الحركات.</p></div><a href="/admin/accounting/export" className="inline-flex min-h-12 items-center gap-2 rounded-xl border border-green-700 bg-white px-5 font-bold text-green-900 hover:bg-green-50">تصدير السجل المالي CSV</a></div>
    <div className="mt-5"><CommissionForm initialValue={commission} /></div>
    {error ? <p role="alert" className="mt-5 rounded-xl bg-orange-100 p-4 text-orange-700">تعذر تحميل بيانات المحاسبة. تحقق من الاتصال والصلاحيات.</p> : <>
      {rows.length ? <>
        <div className="mt-4 space-y-3 md:hidden">{rows.map((row) => <article key={row.id} className="rounded-xl border border-green-100 bg-white p-3"><div className="flex items-center justify-between gap-2"><h2 className="font-semibold">رحلة #{row.trip_no} · {row.product_name}</h2><span className="rounded-full bg-green-100 px-2 py-1 text-xs">{statusLabels[row.status] ?? row.status}</span></div><p className="mt-2 text-sm">{row.supplier_name} · {row.factory_name ?? "—"}</p><p dir="ltr" className="mt-1 text-xs text-green-900/70">{formatDate(row.trip_date)}</p><div className="mt-3 grid grid-cols-2 gap-2 border-t border-green-100 pt-3 text-sm"><p>الوزن: {row.weight_kg == null ? "—" : formatWeight(row.weight_kg)}</p><p>الإجمالي: {row.status === "analysis_accepted" ? row.gross_amount?.toFixed(2) ?? "—" : "—"}</p><p>العمولة: {row.status === "analysis_accepted" ? row.commission_amount?.toFixed(2) ?? "—" : "—"}</p><p>مستحق المورد: {row.status === "analysis_accepted" ? row.supplier_payable?.toFixed(2) ?? "—" : "—"}</p></div></article>)}</div>
        <div className="mt-4 hidden overflow-x-auto rounded-xl border border-green-100 bg-white md:block"><table className="w-full text-start text-sm"><thead className="bg-green-50"><tr>{["الرحلة", "التاريخ", "الحالة", "المورد", "المصنع", "المنتج", "الوزن", "الإجمالي", "العمولة", "مستحق المورد"].map((label) => <th key={label} className="border-b border-green-100 px-3 py-3 font-semibold">{label}</th>)}</tr></thead><tbody>{rows.map((row) => <tr key={row.id} className="border-b border-green-50 last:border-0"><td className="px-3 py-3">#{row.trip_no}</td><td dir="ltr" className="px-3 py-3">{formatDate(row.trip_date)}</td><td className="px-3 py-3">{statusLabels[row.status] ?? row.status}</td><td className="px-3 py-3">{row.supplier_name}</td><td className="px-3 py-3">{row.factory_name ?? "—"}</td><td className="px-3 py-3">{row.product_name}</td><td className="px-3 py-3">{row.weight_kg == null ? "—" : formatWeight(row.weight_kg)}</td><td className="px-3 py-3">{row.status === "analysis_accepted" ? row.gross_amount?.toFixed(2) ?? "—" : "—"}</td><td className="px-3 py-3">{row.status === "analysis_accepted" ? row.commission_amount?.toFixed(2) ?? "—" : "—"}</td><td className="px-3 py-3">{row.status === "analysis_accepted" ? row.supplier_payable?.toFixed(2) ?? "—" : "—"}</td></tr>)}</tbody></table></div>
      </> : <section className="mt-5 rounded-2xl border border-dashed border-green-100 bg-white p-8 text-center"><h2 className="font-semibold">لا توجد رحلات مطابقة</h2><p className="mt-2 text-sm text-green-900/70">غيّر الفترة أو أزل بعض الفلاتر.</p></section>}
    </>}
  </>;
}
