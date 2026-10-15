"use client";

import { useActionState, useEffect } from "react";
import { toast } from "sonner";
import { createEngineer, setEngineerActive, resetEngineerPassword, type ProductActionState } from "../actions";
import { Dialog, useDialogClose } from "@/components/dialog";
import { FormSubmitButton } from "@/components/form-submit-button";
import { CircleCheck, CircleX, KeyRound, Plus } from "lucide-react";

type User = { id: string; full_name: string; phone: string | null; role: string; is_active: boolean };
const initial: ProductActionState = { ok: null };
function Result({ state }: { state: ProductActionState }) {
  const close = useDialogClose();
  useEffect(() => { if (state.ok) { toast.success("تم الحفظ"); close(); } else if (state.ok === false) toast.error(state.error === "phone" ? "رقم الهاتف غير صحيح" : "تعذر الحفظ. راجع البيانات والاتصال."); }, [state, close]);
  return null;
}
function CreateUser() {
  const [state, action] = useActionState(createEngineer, initial);
  return <form action={action} className="grid gap-3"><Result state={state} />
    <label className="grid gap-1 text-sm font-semibold">اسم المهندس<input required name="full_name" className="min-h-11 rounded-lg border border-green-100 px-3" /></label>
    <label className="grid gap-1 text-sm font-semibold">رقم الهاتف المصري<input required dir="ltr" type="tel" name="phone" className="min-h-11 rounded-lg border border-green-100 px-3 text-start" /></label>
    <label className="grid gap-1 text-sm font-semibold">كلمة مرور مؤقتة<input required minLength={10} type="password" name="password" className="min-h-11 rounded-lg border border-green-100 px-3" /></label>
    <p className="text-xs text-green-900/70">سيُستخدم رقم الهاتف لإنشاء بريد داخلي للحساب.</p>
    <FormSubmitButton className="rounded-lg bg-green-700 px-4 py-2 font-semibold text-white">إنشاء الحساب</FormSubmitButton>
  </form>;
}
function ResetPassword({ user }: { user: User }) {
  const [state, action] = useActionState(resetEngineerPassword, initial);
  return <form action={action} className="grid gap-3"><Result state={state} /><input type="hidden" name="id" value={user.id} /><label className="grid gap-1 text-sm font-semibold">كلمة المرور الجديدة<input required minLength={10} type="password" name="password" className="min-h-11 rounded-lg border border-green-100 px-3" /></label><FormSubmitButton className="rounded-lg bg-green-700 px-4 py-2 font-semibold text-white">حفظ كلمة المرور</FormSubmitButton></form>;
}
function UserRow({ user, currentUserId }: { user: User; currentUserId: string }) {
  const [state, action] = useActionState(setEngineerActive, initial);
  return <article className="grid gap-3 border-b border-green-100 p-4 last:border-0 hover:bg-green-50/70 md:grid-cols-[1.4fr_1fr_0.7fr_auto] md:items-center md:px-5"><Result state={state} />
    <div><h2 className="font-bold">{user.full_name}</h2><p className="mt-1 text-xs text-green-900/70">معرّف الحساب <bdi dir="ltr">{user.id.slice(0, 8)}</bdi></p></div>
    <div className="text-sm"><span className="md:hidden text-green-900/70">الهاتف: </span><bdi dir="ltr">{user.phone ?? "بدون هاتف"}</bdi></div>
    <div className="flex items-center gap-2"><span className="rounded-full bg-green-100 px-2.5 py-1 text-xs font-bold text-green-900">{user.role === "admin" ? "مدير" : "مهندس"}</span><span className={`rounded-full px-2.5 py-1 text-xs font-bold ${user.is_active ? "bg-green-700 text-white" : "border border-orange-500 bg-orange-100 text-green-900"}`}>{user.is_active ? "نشط" : "موقوف"}</span></div>
    {user.role === "engineer" && <div className="flex flex-wrap gap-2">{(user.id !== currentUserId || !user.is_active) && <form action={action}><input type="hidden" name="id" value={user.id} /><input type="hidden" name="is_active" value={String(!user.is_active)} /><button type="submit" aria-label={`${user.is_active ? "إيقاف" : "تفعيل"} ${user.full_name}`} className="inline-flex min-h-11 items-center gap-2 rounded-lg border border-green-700 bg-white px-3 text-sm font-semibold text-green-900 hover:bg-green-50">{user.is_active ? <CircleX aria-hidden size={16} /> : <CircleCheck aria-hidden size={16} />}{user.is_active ? "إيقاف" : "تفعيل"}</button></form>}
      <Dialog title="إعادة تعيين كلمة المرور" trigger={<button type="button" aria-label={`إعادة تعيين كلمة مرور ${user.full_name}`} className="inline-flex min-h-11 items-center gap-2 rounded-lg border border-green-700 bg-white px-3 text-sm font-semibold text-green-900 hover:bg-green-50"><KeyRound aria-hidden size={18} />كلمة المرور</button>}><ResetPassword user={user} /></Dialog></div>}
  </article>;
}
export function UserManager({ users, currentUserId }: { users: User[]; currentUserId: string }) {
  return <><div className="mb-4 flex flex-wrap items-center justify-between gap-3 rounded-2xl border border-green-100 bg-white p-4"><div><h2 className="font-bold">دليل المستخدمين</h2><p className="mt-1 text-xs text-green-900/70">التحكم في الحسابات متاح للمدير فقط</p></div><Dialog title="إنشاء حساب مهندس جديد" trigger={<button type="button" className="inline-flex min-h-12 items-center gap-2 rounded-xl border border-green-700 bg-white px-5 font-bold text-green-900 hover:bg-green-50"><Plus aria-hidden size={17} />إضافة مهندس</button>}><CreateUser /></Dialog></div>
    <div className="overflow-hidden rounded-2xl border border-green-100 bg-white shadow-sm"><div className="hidden grid-cols-[1.4fr_1fr_0.7fr_auto] gap-3 border-b-2 border-green-700 bg-green-50 px-5 py-3 text-xs font-bold md:grid"><span>الاسم والحساب</span><span>رقم الهاتف</span><span>الدور والحالة</span><span>الإجراءات</span></div>{users.length ? users.map((user) => <UserRow key={user.id} user={user} currentUserId={currentUserId} />) : <p className="p-8 text-center text-sm text-green-900/70">لا يوجد مستخدمون بعد. أضف أول حساب مهندس للبدء.</p>}</div></>;
}
