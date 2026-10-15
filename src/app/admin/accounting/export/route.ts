import { getAccountingRows, parseAccountingFilters, csvCell, type AccountingRow } from "../data";

export async function GET(request: Request) {
  const filters = parseAccountingFilters(new URL(request.url).searchParams);
  const { data, error } = await getAccountingRows(filters);
  if (error) return new Response("تعذر تحميل البيانات", { status: 500 });
  const rows = (data ?? []) as AccountingRow[];
  const headers = ["رقم الرحلة", "التاريخ", "الحالة", "المهندس", "المورد", "المصنع", "المنتج", "الوزن كجم", "السعر جنيه/كجم", "الإجمالي", "العمولة", "مستحق المورد"];
  const lines = rows.map((row) => {
    const final = row.status === "analysis_accepted";
    return [row.trip_no, row.trip_date, row.status, row.engineer_name, row.supplier_name, row.factory_name, row.product_name, row.weight_kg, row.price_per_kg, final ? row.gross_amount : null, final ? row.commission_amount : null, final ? row.supplier_payable : null].map(csvCell).join(",");
  });
  const csv = `\uFEFF${[headers.map(csvCell).join(","), ...lines].join("\r\n")}`;
  return new Response(csv, { headers: { "Content-Type": "text/csv; charset=utf-8", "Content-Disposition": 'attachment; filename="crest-accounting.csv"', "Cache-Control": "private, no-store" } });
}
