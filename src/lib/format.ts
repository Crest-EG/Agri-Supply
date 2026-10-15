export function formatWeight(weightKg: number | string | null): string {
  if (weightKg === null) return "—";
  const value = Number(weightKg);
  if (!Number.isFinite(value)) return "—";
  return value >= 1000
    ? `${new Intl.NumberFormat("en", { maximumFractionDigits: 2 }).format(value / 1000)} طن`
    : `${new Intl.NumberFormat("en", { maximumFractionDigits: 3 }).format(value)} كجم`;
}

export function formatDate(date: string | null): string {
  if (!date) return "—";
  const [year, month, day] = date.slice(0, 10).split("-");
  return year && month && day ? `${day}/${month}/${year}` : date;
}

export const statusLabels: Record<string, string> = {
  loaded: "تم التحميل",
  in_transit: "في الطريق",
  arrived: "وصلت",
  factory_accepted: "قُبلت من المصنع",
  analysis_accepted: "اجتاز التحليل",
  analysis_rejected: "رُفض التحليل",
  rejected: "مرفوضة",
};
