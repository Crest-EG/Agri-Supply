import { requireProfile } from "@/lib/authz";
import type { Database } from "@/lib/database.types";
import type { QueuedTrip } from "@/lib/offline/types";

type TripInsert = Database["public"]["Tables"]["trips"]["Insert"];
export type SyncResult = { ok: true; trip: Pick<TripInsert, "id" | "trip_date" | "engineer_id" | "supplier_id" | "product_id" | "factory_id" | "status" | "plate_number" | "photo_path" | "photo_blur" | "weight_kg" | "price_per_kg" | "commission_pct"> & { trip_no: number | null; gross_amount: number | null; commission_amount: number | null; supplier_payable: number | null } } | { ok: false; reason: string; retryable: boolean };
export type SyncSession = Awaited<ReturnType<typeof requireProfile>>;
const uuidPattern = /^[0-9a-f]{8}-[0-9a-f]{4}-[1-8][0-9a-f]{3}-[89ab][0-9a-f]{3}-[0-9a-f]{12}$/i;

function permanentMessage(message: string) {
  return /row-level security|not allowed|permission|violat|locked|foreign key|check constraint|invalid|not found|does not exist|json object requested|0 rows/i.test(message);
}

export async function syncQueuedTrip(payload: QueuedTrip, session?: SyncSession): Promise<SyncResult> {
  try {
    const { supabase, user, profile } = session ?? await requireProfile();
    if (!uuidPattern.test(payload.id) || payload.owner_id !== user.id) return { ok: false, reason: "الحساب الحالي لا يطابق صاحب الرحلة.", retryable: false };
    if (!uuidPattern.test(payload.supplier_id) || !uuidPattern.test(payload.product_id) || (payload.factory_id && !uuidPattern.test(payload.factory_id))) return { ok: false, reason: "بيانات المورد أو المنتج أو المصنع غير صالحة.", retryable: false };
    const isAdmin = profile.role === "admin";
    const { data: current, error: readError } = await supabase.from("trips").select("id, trip_no, trip_date, engineer_id, supplier_id, product_id, factory_id, status, plate_number, photo_path, photo_blur, weight_kg, price_per_kg, commission_pct, analysis_note, notes, gross_amount, commission_amount, supplier_payable").eq("id", payload.id).maybeSingle();
    if (readError) return { ok: false, reason: readError.message, retryable: !permanentMessage(readError.message) };
    if (payload.operation === "create" && current) return { ok: true, trip: current };
    if (payload.operation === "update" && !current) return { ok: false, reason: "الرحلة غير موجودة على الخادم.", retryable: false };
    if (payload.operation === "update" && current && !isAdmin && !["loaded", "in_transit", "arrived"].includes(current.status)) return { ok: false, reason: "الرحلة مقفلة بعد قبول المصنع.", retryable: false };
    if (payload.operation === "update" && !isAdmin) {
      const nextByStatus: Record<string, string[]> = { loaded: ["loaded", "in_transit"], in_transit: ["in_transit", "arrived"], arrived: ["arrived", "factory_accepted"] };
      if (!nextByStatus[current!.status]?.includes(payload.status)) return { ok: false, reason: "انتقال الحالة غير مسموح.", retryable: false };
    }
    const [{ data: supplierLinks }, { data: factoryLinks }] = await Promise.all([
      supabase.from("supplier_products").select("supplier_id").eq("product_id", payload.product_id),
      supabase.from("factory_products").select("factory_id").eq("product_id", payload.product_id),
    ]);
    if (supplierLinks?.length && !supplierLinks.some((link) => link.supplier_id === payload.supplier_id)) return { ok: false, reason: "المورد غير مرتبط بهذا المنتج.", retryable: false };
    if (payload.factory_id && factoryLinks?.length && !factoryLinks.some((link) => link.factory_id === payload.factory_id)) return { ok: false, reason: "المصنع غير مرتبط بهذا المنتج.", retryable: false };

    let photoPath = current?.photo_path ?? null;
    let photoBlur = current?.photo_blur ?? null;
    if (payload.photo) {
      if (payload.photo.type !== "image/webp" || payload.photo.size > 8 * 1024 * 1024) return { ok: false, reason: "الصورة ليست WebP صالحة.", retryable: false };
      if (current?.photo_path && !isAdmin) return { ok: false, reason: "المهندس لا يمكنه استبدال صورة محفوظة.", retryable: false };
      const engineerId = isAdmin && payload.engineer_id ? payload.engineer_id : user.id;
      if (!uuidPattern.test(engineerId)) return { ok: false, reason: "معرّف المهندس غير صالح.", retryable: false };
      photoPath = `${engineerId}/${payload.id}.webp`;
      const bucket = supabase.storage.from("trip-photos");
      const { data: existing, error: listError } = await bucket.list(engineerId, { search: `${payload.id}.webp` });
      if (listError) return { ok: false, reason: listError.message, retryable: true };
      if (isAdmin || !existing?.some((item) => item.name === `${payload.id}.webp`)) {
        const { error } = await bucket.upload(photoPath, payload.photo, { contentType: "image/webp", upsert: isAdmin });
        if (error) return { ok: false, reason: error.message, retryable: !permanentMessage(error.message) };
      }
      photoBlur = payload.photo_blur?.startsWith("data:image/webp;base64,") && payload.photo_blur.length < 20_000 ? payload.photo_blur : null;
    }

    let commission = current?.commission_pct;
    if (payload.operation === "create") {
      const { data: settings, error } = await supabase.from("settings").select("default_commission_pct").eq("id", true).maybeSingle();
      if (error || !settings) return { ok: false, reason: error?.message ?? "تعذر قراءة نسبة العمولة.", retryable: true };
      commission = settings.default_commission_pct;
    } else if (isAdmin && payload.commission_pct !== undefined) commission = payload.commission_pct;

    const nextTrip: TripInsert = {
      id: payload.id,
      trip_date: isAdmin && payload.trip_date ? payload.trip_date : current?.trip_date,
      engineer_id: isAdmin && payload.engineer_id ? payload.engineer_id : current?.engineer_id ?? user.id,
      supplier_id: payload.supplier_id,
      product_id: payload.product_id,
      factory_id: payload.factory_id,
      status: payload.operation === "create" ? "loaded" : payload.status as Database["public"]["Enums"]["trip_status"],
      plate_number: payload.plate_number,
      photo_path: photoPath,
      photo_blur: photoBlur,
      weight_kg: payload.weight_kg,
      price_per_kg: isAdmin || payload.status === "factory_accepted" ? payload.price_per_kg : current?.price_per_kg,
      commission_pct: commission,
      analysis_note: isAdmin ? payload.analysis_note ?? current?.analysis_note : current?.analysis_note,
      notes: isAdmin ? payload.notes ?? current?.notes : current?.notes,
    };
    const { data: saved, error } = await supabase.from("trips").upsert(nextTrip, { onConflict: "id" }).select("id, trip_no, trip_date, engineer_id, supplier_id, product_id, factory_id, status, plate_number, photo_path, photo_blur, weight_kg, price_per_kg, commission_pct, gross_amount, commission_amount, supplier_payable").single();
    if (error || !saved) return { ok: false, reason: error?.message ?? "تعذر حفظ الرحلة.", retryable: error ? !permanentMessage(error.message) : true };
    return { ok: true, trip: saved };
  } catch (error) {
    return { ok: false, reason: error instanceof Error ? error.message : "تعذر مزامنة الرحلة.", retryable: true };
  }
}
