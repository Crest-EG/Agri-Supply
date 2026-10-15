export default function AccountingLoading() {
  return <section aria-label="جارٍ تحميل المحاسبة" className="animate-pulse"><div className="h-8 w-56 rounded bg-green-100" /><div className="mt-5 h-24 rounded-2xl bg-green-100" /><div className="mt-4 grid gap-3 sm:grid-cols-2 lg:grid-cols-4">{[1, 2, 3, 4].map((item) => <div key={item} className="h-24 rounded-2xl bg-green-100" />)}</div></section>;
}
