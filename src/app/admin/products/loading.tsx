export default function LoadingProducts() {
  return <main aria-label="جارٍ تحميل المنتجات" className="mx-auto min-h-screen max-w-6xl space-y-4 ps-4 pe-4 py-6 md:ps-8 md:pe-8">
    <div className="h-16 animate-pulse rounded-2xl bg-green-100" />
    {[0, 1, 2, 3].map((item) => <div key={item} className="h-28 animate-pulse rounded-2xl border border-green-100 bg-white" />)}
  </main>;
}
