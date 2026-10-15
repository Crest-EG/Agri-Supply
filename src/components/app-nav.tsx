"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import { Factory, Home, Package, Users, Wallet } from "lucide-react";

const items = [["/trips", "الحركات", Home], ["/suppliers", "الموردون", Users]] as const;
const adminItems = [
  ["/trips", "الحركات", Home],
  ["/suppliers", "الموردون", Users],
  ["/admin/factories", "المصانع", Factory],
  ["/admin/products", "المنتجات", Package],
  ["/admin/accounting", "المحاسبة", Wallet],
] as const;

export function AppNav({ admin = false }: { admin?: boolean }) {
  const pathname = usePathname();
  const visible = admin ? adminItems : items;
  return <nav aria-label="التنقل الرئيسي" className={`fixed bottom-4 left-4 right-4 z-40 grid border rounded-2xl shadow-lg border-green-100 bg-white p-1.5 backdrop-blur-md md:hidden ${admin ? "grid-cols-5" : "grid-cols-2"}`}>
    {visible.map(([href, label, Icon]) => {
      const active = pathname === href || (href !== "/trips" && pathname.startsWith(`${href}/`));
      return <Link key={href} href={href} prefetch className={`flex min-h-12 min-w-0 flex-col items-center justify-center gap-1 rounded-xl text-[10px] sm:text-xs ${active ? "bg-green-700 text-white" : "text-green-700"}`} aria-current={active ? "page" : undefined}>
        <Icon aria-hidden size={18} /><span className="truncate">{label}</span>
      </Link>;
    })}
  </nav>;
}
