"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";

const items = [["/trips", "الرحلات"], ["/suppliers", "الموردون"], ["/admin/factories", "المصانع"], ["/admin/products", "المنتجات والأسعار"], ["/admin/users", "المستخدمون"], ["/admin/accounting", "المحاسبة"]];

export function AdminNav() {
  const pathname = usePathname();
  return <nav aria-label="أقسام الإدارة" className="flex w-max min-w-full items-center gap-1 text-sm">{items.map(([href, text]) => {
    const active = pathname === href || pathname.startsWith(`${href}/`);
    return <Link key={href} href={href} prefetch aria-current={active ? "page" : undefined} className={`flex min-h-10 shrink-0 items-center rounded-lg ps-3 pe-3 py-2 text-xs font-bold transition-colors md:text-sm ${active ? "bg-green-700 text-white" : "text-green-900 hover:bg-green-100"}`}>{text}</Link>;
  })}</nav>;
}
