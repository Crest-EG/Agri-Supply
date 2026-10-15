"use client";

import { useActionState, useEffect } from "react";
import { useRouter } from "next/navigation";
import { LogOut } from "lucide-react";
import { signOutAction } from "@/app/auth/actions";

export function SignOutButton() {
  const router = useRouter();
  const [result, action, pending] = useActionState(signOutAction, { ok: false });
  useEffect(() => { if (result.ok) router.replace("/login"); }, [result, router]);
  return <form action={action}><button type="submit" disabled={pending} aria-label="تسجيل الخروج" className="inline-flex min-h-11 items-center gap-2 rounded-lg px-3 text-sm text-green-700 disabled:opacity-50"><LogOut aria-hidden size={18} /><span className="hidden sm:inline">{pending ? "جارٍ الخروج" : "تسجيل الخروج"}</span></button></form>;
}
