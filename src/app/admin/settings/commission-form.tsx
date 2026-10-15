"use client";

import { useActionState, useEffect } from "react";
import { toast } from "sonner";
import { saveDefaultCommission, type ProductActionState } from "../actions";
import { FormSubmitButton } from "@/components/form-submit-button";

export function CommissionForm({ initialValue }: { initialValue: number }) {
  const [state, action] = useActionState(saveDefaultCommission, { ok: null } satisfies ProductActionState);
  useEffect(() => { if (state.ok) toast.success("تم حفظ العمولة"); else if (state.ok === false) toast.error("أدخل نسبة صحيحة بين 0 و100."); }, [state]);
  return <form action={action} className="flex flex-wrap items-end justify-between gap-4 rounded-2xl border border-green-100 bg-white p-4 shadow-sm md:p-5">
    <div className="min-w-[200px] flex-1"><h2 className="font-bold">عمولة الشركة الافتراضية</h2><p className="mt-1 text-xs text-green-900/70">تُطبق على الحركات الجديدة فقط.</p></div>
    <div className="flex flex-wrap items-end gap-3"><label className="block text-sm font-semibold">النسبة (%)<input dir="ltr" required type="number" min="0" max="100" step="0.01" name="default_commission_pct" defaultValue={initialValue} className="mt-1 w-36 rounded-xl border border-green-100 px-3 py-2 text-start" /></label><FormSubmitButton className="min-h-12 rounded-xl border border-green-700 bg-white px-5 py-3 font-bold text-green-900 hover:bg-green-50">حفظ</FormSubmitButton></div>
  </form>;
}
