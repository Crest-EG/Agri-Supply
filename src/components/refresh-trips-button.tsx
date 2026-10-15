"use client";

import { useRouter } from "next/navigation";
import { useTransition } from "react";
import { RefreshCw } from "lucide-react";

export function RefreshTripsButton() {
  const router = useRouter();
  const [pending, startTransition] = useTransition();
  return <button
    type="button"
    onClick={() => startTransition(() => router.refresh())}
    disabled={pending}
    aria-label="تحديث قائمة الرحلات"
    title="تحديث الرحلات"
    className="inline-flex min-h-12 items-center justify-center gap-2 rounded-xl border border-green-700 bg-white px-4 font-semibold text-green-900 hover:bg-green-50 disabled:opacity-60"
  >
    <RefreshCw aria-hidden size={18} className={pending ? "animate-spin" : ""} />
    <span>تحديث</span>
  </button>;
}
