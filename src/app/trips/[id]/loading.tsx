export default function LoadingTrip() {
  return <main aria-label="جارٍ تحميل الرحلة" className="mx-auto min-h-screen max-w-4xl space-y-4 ps-4 pe-4 py-6 md:ps-8 md:pe-8">
    <div className="h-16 animate-pulse rounded-2xl bg-green-100" />
    <div className="h-72 animate-pulse rounded-2xl border border-green-100 bg-white" />
    <div className="h-40 animate-pulse rounded-2xl bg-green-50" />
  </main>;
}
