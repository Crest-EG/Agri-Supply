import { requireAdmin } from "@/lib/authz";
import { UserManager } from "./user-manager";

export default async function UsersPage() {
  const { supabase, user } = await requireAdmin();
  const { data: users } = await supabase.from("profiles").select("id, full_name, phone, role, is_active").order("created_at", { ascending: false });
  return <>
    <div className="flex flex-wrap items-end justify-between gap-3"><div><p className="text-sm font-bold text-green-700">إدارة النظام / المستخدمون</p><h1 className="mt-2 text-2xl font-extrabold md:text-3xl">إدارة المستخدمين والمهندسين</h1><p className="mt-2 text-sm text-green-900/70">إضافة الحسابات، متابعة حالتها، وإعادة تعيين كلمات المرور.</p></div><span className="rounded-full bg-green-100 px-3 py-2 text-xs font-bold text-green-900">محدّث من النظام</span></div>
    <div className="mt-7"><UserManager users={users ?? []} currentUserId={user.id} /></div>
  </>;
}
