"use server";

import { revalidatePath } from "next/cache";
import { createClient } from "@/lib/supabase/server";
import { requireProfile } from "@/lib/authz";

const uuidPattern = /^[0-9a-f]{8}-[0-9a-f]{4}-[1-8][0-9a-f]{3}-[89ab][0-9a-f]{3}-[0-9a-f]{12}$/i;
const tripStatuses = ["loaded", "in_transit", "arrived", "factory_accepted", "analysis_accepted", "analysis_rejected", "rejected"] as const;
const editableStatuses = ["loaded", "in_transit", "arrived"];

async function validProductLinks(supabase: Awaited<ReturnType<typeof createClient>>, productId: string, supplierId: string, factoryId: string) {
  const [{ data: supplierLinks }, { data: factoryLinks }] = await Promise.all([
    supabase.from("supplier_products").select("supplier_id, product_id").eq("product_id", productId),
    supabase.from("factory_products").select("factory_id, product_id").eq("product_id", productId),
  ]);
  const supplierOptions = supplierLinks ?? [];
  const factoryOptions = factoryLinks ?? [];
  return (!supplierOptions.length || supplierOptions.some((link) => link.supplier_id === supplierId))
    && (!factoryId || !factoryOptions.length || factoryOptions.some((link) => link.factory_id === factoryId));
}

function postedPhoto(formData: FormData): File | null {
  const candidate = formData.get("photo");
  if (!(candidate instanceof File) || candidate.size === 0) return null;
  if (candidate.type !== "image/webp" || candidate.size > 8 * 1024 * 1024) return null;
  return candidate;
}

function postedBlur(formData: FormData): string | null {
  const candidate = String(formData.get("photo_blur") ?? "");
  return candidate.startsWith("data:image/webp;base64,") && candidate.length < 20_000 ? candidate : null;
}

export async function createTrip(formData: FormData): Promise<{ ok: boolean; error?: string }> {
  const supabase = await createClient();
  const { data: { user } } = await supabase.auth.getUser();
  if (!user) return { ok: false, error: "auth" };
  const id = String(formData.get("id") ?? "");
  const supplierId = String(formData.get("supplier_id") ?? "");
  const productId = String(formData.get("product_id") ?? "");
  const factoryId = String(formData.get("factory_id") ?? "");
  const plate = String(formData.get("plate_number") ?? "").trim();
  const weightRaw = String(formData.get("weight_kg") ?? "").trim();
  const weight = weightRaw ? Number(weightRaw) : null;
  const photoInput = formData.get("photo");
  if (photoInput instanceof File && photoInput.size > 0 && !postedPhoto(formData)) return { ok: false, error: "photo" };
  if (!uuidPattern.test(id) || !uuidPattern.test(supplierId) || !uuidPattern.test(productId) || (factoryId && !uuidPattern.test(factoryId)) || !supplierId || !productId || (weight !== null && (!Number.isFinite(weight) || weight <= 0))) {
    return { ok: false, error: "invalid" };
  }
  if (!await validProductLinks(supabase, productId, supplierId, factoryId)) return { ok: false, error: "links" };

  const [{ data: profile }, { data: settings }] = await Promise.all([
    supabase.from("profiles").select("role, is_active").eq("id", user.id).maybeSingle(),
    supabase.from("settings").select("default_commission_pct").eq("id", true).maybeSingle(),
  ]);
  if (!profile?.is_active || !settings) return { ok: false, error: "setup" };

  let photoPath: string | null = null;
  const photo = postedPhoto(formData);
  const photoBlur = photo ? postedBlur(formData) : null;
  if (photo) {
    photoPath = `${user.id}/${id}.webp`;
    const bucket = supabase.storage.from("trip-photos");
    const { data: existing, error: listError } = await bucket.list(user.id, { search: `${id}.webp` });
    if (listError) return { ok: false, error: "photo" };
    if (!existing?.some((item) => item.name === `${id}.webp`)) {
      const { error } = await bucket.upload(photoPath, photo, { contentType: "image/webp", upsert: false });
      if (error) return { ok: false, error: "photo" };
    }
  }

  const { error } = await supabase.from("trips").insert({
    id,
    engineer_id: user.id,
    supplier_id: supplierId,
    product_id: productId,
    factory_id: factoryId || null,
    plate_number: plate || null,
    weight_kg: weight,
    photo_path: photoPath,
    photo_blur: photoBlur,
    status: "loaded",
    commission_pct: settings.default_commission_pct,
  });
  if (error) return { ok: false, error: "save" };
  revalidatePath("/trips");
  return { ok: true };
}

export async function updateTrip(formData: FormData): Promise<{ ok: boolean; error?: string }> {
  const { supabase, profile } = await requireProfile();
  const id = String(formData.get("id") ?? "");
  if (!uuidPattern.test(id)) return { ok: false, error: "invalid" };
  const { data: current } = await supabase.from("trips").select("id, status, product_id, engineer_id, photo_path, photo_blur").eq("id", id).maybeSingle();
  if (!current) return { ok: false, error: "missing" };

  const isAdmin = profile.role === "admin";
  if (!isAdmin && !editableStatuses.includes(current.status)) return { ok: false, error: "locked" };
  const supplierId = String(formData.get("supplier_id") ?? "");
  const productId = String(formData.get("product_id") ?? "");
  const factoryId = String(formData.get("factory_id") ?? "");
  const weightRaw = String(formData.get("weight_kg") ?? "").trim();
  const weight = weightRaw ? Number(weightRaw) : null;
  const statusRaw = String(formData.get("status") ?? current.status);
  if (!uuidPattern.test(supplierId) || !uuidPattern.test(productId) || (factoryId && !uuidPattern.test(factoryId)) || !tripStatuses.includes(statusRaw as (typeof tripStatuses)[number]) || (weight !== null && (!Number.isFinite(weight) || weight <= 0))) return { ok: false, error: "invalid" };
  const status = statusRaw as (typeof tripStatuses)[number];
  const engineerFlow: Record<string, string[]> = { loaded: ["loaded", "in_transit"], in_transit: ["in_transit", "arrived"], arrived: ["arrived", "factory_accepted"] };
  if (!isAdmin && !engineerFlow[current.status]?.includes(status)) return { ok: false, error: "status" };
  if (!await validProductLinks(supabase, productId, supplierId, factoryId)) return { ok: false, error: "links" };

  const incomingPhoto = formData.get("photo");
  if (incomingPhoto instanceof File && incomingPhoto.size > 0 && !postedPhoto(formData)) return { ok: false, error: "photo" };
  const newPhoto = postedPhoto(formData);
  const targetEngineerId = isAdmin ? String(formData.get("engineer_id") ?? current.engineer_id) : current.engineer_id;
  if (!uuidPattern.test(targetEngineerId)) return { ok: false, error: "invalid" };
  if (!isAdmin && current.photo_path && newPhoto) return { ok: false, error: "photo" };

  let photoPath = current.photo_path;
  let photoBlur = current.photo_blur;
  let oldPhotoPathToRemove: string | null = null;
  const bucket = supabase.storage.from("trip-photos");
  const wantedPath = `${targetEngineerId}/${id}.webp`;
  if (newPhoto) {
    if (photoPath && photoPath !== wantedPath) oldPhotoPathToRemove = photoPath;
    photoPath = wantedPath;
    const { data: existing, error: listError } = await bucket.list(targetEngineerId, { search: `${id}.webp` });
    if (listError) return { ok: false, error: "photo" };
    if (isAdmin || !existing?.some((item) => item.name === `${id}.webp`)) {
      const { error } = await bucket.upload(photoPath, newPhoto, { contentType: "image/webp", upsert: isAdmin });
      if (error) return { ok: false, error: "photo" };
    }
    photoBlur = postedBlur(formData) ?? photoBlur;
  } else if (isAdmin && photoPath && photoPath !== wantedPath) {
    const { data: oldImage, error: downloadError } = await bucket.download(photoPath);
    if (downloadError || !oldImage) return { ok: false, error: "photo" };
    const { error: uploadError } = await bucket.upload(wantedPath, oldImage, { contentType: "image/webp", upsert: false });
    if (uploadError) return { ok: false, error: "photo" };
    oldPhotoPathToRemove = photoPath;
    photoPath = wantedPath;
  }

  const payload = {
    supplier_id: supplierId,
    product_id: productId,
    factory_id: factoryId || null,
    status,
    photo_path: photoPath,
    photo_blur: photoBlur,
    plate_number: String(formData.get("plate_number") ?? "").trim() || null,
    weight_kg: weight,
    notes: isAdmin ? String(formData.get("notes") ?? "").trim() || null : undefined,
    analysis_note: isAdmin ? String(formData.get("analysis_note") ?? "").trim() || null : undefined,
    trip_date: isAdmin ? String(formData.get("trip_date") ?? "") || undefined : undefined,
    engineer_id: isAdmin ? targetEngineerId : undefined,
    price_per_kg: isAdmin || status === "factory_accepted" ? (String(formData.get("price_per_kg") ?? "").trim() ? Number(formData.get("price_per_kg")) : null) : undefined,
    commission_pct: isAdmin && String(formData.get("commission_pct") ?? "").trim() ? Number(formData.get("commission_pct")) : undefined,
  };
  if (payload.price_per_kg !== undefined && payload.price_per_kg !== null && (!Number.isFinite(payload.price_per_kg) || payload.price_per_kg < 0)) return { ok: false, error: "invalid" };
  if (payload.commission_pct !== undefined && (!Number.isFinite(payload.commission_pct) || payload.commission_pct < 0 || payload.commission_pct > 100)) return { ok: false, error: "invalid" };

  const { error } = await supabase.from("trips").update(payload).eq("id", id);
  if (error) {
    if (oldPhotoPathToRemove && photoPath) await bucket.remove([photoPath]);
    return { ok: false, error: "save" };
  }
  if (oldPhotoPathToRemove) await bucket.remove([oldPhotoPathToRemove]);
  revalidatePath("/trips");
  revalidatePath(`/trips/${id}`);
  return { ok: true };
}
