import { requireAdmin } from "@/lib/authz";
import { AppHeader } from "@/components/app-header";

export default async function AdminLayout({ children }: Readonly<{ children: React.ReactNode }>) {
  const { profile } = await requireAdmin();
  return <div className="min-h-screen"><AppHeader profile={profile} title="لوحة الإدارة" /><main className="mx-auto min-h-screen max-w-[1440px] px-4 py-5 pb-24 md:px-8 md:py-8 md:pb-10"><section>{children}</section></main></div>;
}
