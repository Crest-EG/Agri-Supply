import Link from "next/link";
import { ArrowRight, Leaf } from "lucide-react";

export default function NotFound() {
  return <main dir="rtl" className="grid min-h-[70vh] place-items-center bg-[#F8FAF8] px-4 py-12">
    <section className="w-full max-w-xl rounded-3xl border border-green-100 bg-white p-8 text-center shadow-lg shadow-green-900/5 sm:p-12">
      <span className="mx-auto inline-flex h-16 w-16 items-center justify-center rounded-2xl bg-green-50 text-green-700"><Leaf aria-hidden size={30} /></span>
      <p className="mt-6 text-sm font-extrabold tracking-widest text-green-700" dir="ltr">404</p>
      <h1 className="mt-2 text-2xl font-extrabold text-green-900 sm:text-3xl">الصفحة غير موجودة</h1>
      <p className="mt-3 leading-7 text-green-900/70">قد يكون الرابط غير صحيح أو أن الصفحة نُقلت.</p>
      <Link href="/" className="mt-7 inline-flex min-h-12 items-center justify-center gap-2 rounded-xl border border-green-700 bg-white px-5 py-3 font-bold text-green-900 hover:bg-green-50">
        <ArrowRight aria-hidden size={18} />العودة للرئيسية
      </Link>
    </section>
  </main>;
}
