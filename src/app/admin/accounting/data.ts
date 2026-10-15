import { requireAdmin } from "@/lib/authz";
import type { Database } from "@/lib/database.types";

export type AccountingRow = Database["public"]["Views"]["trips_accounting"]["Row"];
export type AccountingFilters = { date_from?: string; date_to?: string; factory_id?: string; product_id?: string; supplier_id?: string };

export async function getAccountingRows(filters: AccountingFilters) {
  const { supabase } = await requireAdmin();
  let query = supabase.from("trips_accounting").select("*").order("trip_date", { ascending: false }).order("trip_no", { ascending: false });
  if (filters.date_from) query = query.gte("trip_date", filters.date_from);
  if (filters.date_to) query = query.lte("trip_date", filters.date_to);
  if (filters.factory_id) query = query.eq("factory_id", filters.factory_id);
  if (filters.product_id) query = query.eq("product_id", filters.product_id);
  if (filters.supplier_id) query = query.eq("supplier_id", filters.supplier_id);
  return query;
}

export function parseAccountingFilters(params: URLSearchParams): AccountingFilters {
  return {
    date_from: params.get("date_from") || undefined,
    date_to: params.get("date_to") || undefined,
    factory_id: params.get("factory_id") || undefined,
    product_id: params.get("product_id") || undefined,
    supplier_id: params.get("supplier_id") || undefined,
  };
}

export function csvCell(value: string | number | null) {
  const text = value == null ? "" : String(value);
  return `"${text.replaceAll('"', '""')}"`;
}
