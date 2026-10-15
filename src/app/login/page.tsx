import Link from "next/link";
import Image from "next/image";
import { signIn } from "./actions";
import { GuestHeader } from "@/components/app-header";

const errors: Record<string, string> = {
  phone: "رقم الهاتف غير صحيح. استخدم رقمًا مصريًا.",
  credentials: "رقم الهاتف أو كلمة المرور غير صحيحة.",
  missing: "أدخل كلمة المرور.",
};

export default async function LoginPage({ searchParams }: { searchParams: Promise<{ error?: string }> }) {
  const { error } = await searchParams;
  return <><GuestHeader title="تسجيل الدخول إلى المنظومة" actionHref="/" actionLabel="الرئيسية" /><main className="relative grid min-h-[calc(100vh-64px)] place-items-center overflow-hidden bg-[#F8FAF8] ps-4 pe-4 py-10">
    <div aria-hidden className="pointer-events-none absolute -top-28 -start-28 h-80 w-80 rounded-full bg-green-100/80 blur-3xl" />
    <div aria-hidden className="pointer-events-none absolute -bottom-36 -end-28 h-96 w-96 rounded-full bg-orange-100/70 blur-3xl" />
    <section className="relative w-full max-w-md rounded-3xl border border-green-100 bg-white p-7 shadow-lg shadow-green-900/5 md:p-9">
      <Link href="/" className="flex flex-col items-center text-center"><Image src="/Crest-Agri.png" alt="Crest Agri" width={105} height={90} priority className="h-[76px] w-auto object-contain" /><span className="mt-3 text-sm font-bold text-green-700">منظومة متابعة التوريدات الزراعية</span></Link>
      <div className="mt-7 rounded-2xl bg-green-50 p-5 text-center"><h1 className="text-2xl font-extrabold">تسجيل الدخول إلى المنظومة</h1><p className="mt-2 text-sm leading-6 text-green-900/70">أدخل بيانات حسابك لمتابعة الرحلات والتوريدات.</p></div>
      {error && <p role="alert" className="mt-5 rounded-xl border border-orange-500 bg-orange-100 p-3 text-sm text-green-900">{errors[error] ?? "تعذر تسجيل الدخول."}</p>}
      <form action={signIn} className="mt-6 space-y-4">
        <label className="block text-sm font-semibold">رقم الهاتف<input name="phone" type="tel" inputMode="tel" autoComplete="tel" required className="mt-2 w-full rounded-xl border border-green-100 ps-4 pe-4 py-3" placeholder="01012345678" /></label>
        <label className="block text-sm font-semibold">كلمة المرور<input name="password" type="password" autoComplete="current-password" required className="mt-2 w-full rounded-xl border border-green-100 ps-4 pe-4 py-3" /></label>
        <button className="mt-2 min-h-12 w-full rounded-xl border border-green-700 bg-white ps-4 pe-4 py-3 font-bold text-green-900 hover:bg-green-50">تسجيل الدخول</button>
      </form>
      <p className="mt-5 rounded-xl bg-green-50 p-3 text-center text-xs leading-6 text-green-900/70">دخول مخصص لفريق Crest Supply. تواصل مع مدير النظام عند مواجهة مشكلة في حسابك.</p>
    </section>
    <footer className="relative mt-6 text-center text-xs text-green-900/70">Crest Agri · منظومة إدارة التوريدات الزراعية</footer>
  </main></>;
}
