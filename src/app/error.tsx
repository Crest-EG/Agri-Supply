"use client";

import Link from "next/link";
import { CircleAlert, RotateCcw } from "lucide-react";

export default function ErrorPage({ reset }: { error: Error & { digest?: string }; reset: () => void }) {
  return <main dir="rtl" className="grid min-h-[70vh] place-items-center bg-[#F8FAF8] px-4 py-12">
    <section className="w-full max-w-xl rounded-3xl border border-green-100 bg-white p-8 text-center shadow-lg shadow-green-900/5 sm:p-12">
      <span className="mx-auto inline-flex h-16 w-16 items-center justify-center rounded-2xl bg-orange-100 text-green-900"><CircleAlert aria-hidden size={30} /></span>
      <h1 className="mt-6 text-2xl font-extrabold text-green-900 sm:text-3xl">حصلت مشكلة أثناء تحميل الصفحة</h1>
      <p className="mt-3 leading-7 text-green-900/70">جرّب تحميل الصفحة مرة أخرى. لو استمرت المشكلة، ارجع للرئيسية وحاول من جديد.</p>
      <div className="mt-7 flex flex-wrap justify-center gap-3">
        <button type="button" onClick={() => reset()} className="inline-flex min-h-12 items-center justify-center gap-2 rounded-xl border border-green-700 bg-white px-5 py-3 font-bold text-green-900 hover:bg-green-50">
          <RotateCcw aria-hidden size={18} />إعادة المحاولة
        </button>
        <Link href="/" className="inline-flex min-h-12 items-center justify-center rounded-xl bg-green-700 px-5 py-3 font-bold text-white hover:bg-green-900">الرئيسية</Link>
      </div>
    </section>
  </main>;
}
