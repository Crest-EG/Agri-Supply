import Image from "next/image";
import Link from "next/link";
import { AdminNav } from "@/components/admin-nav";
import { AppNav } from "@/components/app-nav";
import { SignOutButton } from "@/components/signout-button";

export function GuestHeader({ title, actionHref = "/login", actionLabel = "تسجيل الدخول" }: { title: string; actionHref?: string; actionLabel?: string }) {
  return <header className="sticky top-0 z-40 border-b border-green-100 bg-white/95 shadow-sm backdrop-blur"><div className="mx-auto flex min-h-16 max-w-[1440px] items-center justify-between gap-3 px-4 py-2 md:px-8"><div className="flex min-w-0 items-center gap-3"><Link href="/" aria-label="Crest Agri" className="shrink-0"><Image src="/logo black- horizontal.png" alt="Crest Agri" width={160} height={46} priority className="h-9 w-auto object-contain" /></Link><span aria-hidden className="hidden h-8 border-s border-green-100 sm:block" /><p className="truncate text-sm font-bold sm:text-base">{title}</p></div><Link href={actionHref} className="inline-flex min-h-11 shrink-0 items-center rounded-lg border border-green-700 bg-white px-4 text-sm font-semibold text-green-900 hover:bg-green-50">{actionLabel}</Link></div></header>;
}

export function AppHeader({ profile, title }: { profile: { full_name: string; role: "admin" | "engineer" }; title?: string }) {
  const admin = profile.role === "admin";
  return <>
    <header className="sticky top-0 z-40 border-b border-green-100 bg-white/95 shadow-sm backdrop-blur">
      <div className="mx-auto max-w-[1440px] px-4 md:px-8">
        <div className="flex min-h-16 items-center justify-between gap-3 py-2">
          <div className="flex min-w-0 items-center gap-3"><Link href="/trips" aria-label="Crest Agri" className="shrink-0"><Image src="/logo black- horizontal.png" alt="Crest Agri" width={160} height={46} priority className="h-9 w-auto object-contain" /></Link><span aria-hidden className="hidden h-8 border-s border-green-100 sm:block" /><div className="hidden min-w-0 sm:block"><p className="truncate text-sm font-bold">{title ?? (admin ? "لوحة الإدارة" : "إدارة التوريدات")}</p><p className="truncate text-xs text-green-900/70">{profile.full_name}</p></div></div>
          <div className="flex shrink-0 items-center gap-2"><span className="hidden rounded-full bg-green-50 px-3 py-2 text-xs font-semibold sm:inline-flex">{profile.full_name}</span><SignOutButton /></div>
        </div>
        <div className="hidden overflow-x-auto border-t border-green-100 py-2 md:block">{admin ? <AdminNav /> : <nav aria-label="أقسام التطبيق" className="flex min-w-max items-center gap-1 text-sm"><Link href="/trips" className="rounded-lg px-3 py-2 text-xs font-bold hover:bg-green-50">الرحلات</Link><Link href="/suppliers" className="rounded-lg px-3 py-2 text-xs font-bold hover:bg-green-50">الموردون</Link></nav>}</div>
      </div>
    </header>
    <AppNav admin={admin} />
  </>;
}
