"use server";

import { revalidatePath } from "next/cache";
import { requireAdmin, requireProfile } from "@/lib/authz";
import { normalizeEgyptianPhone } from "@/lib/phone";
import { createAdminClient } from "@/lib/supabase/admin";

function value(data: FormData, key: string) { return String(data.get(key) ?? "").trim(); }
function isUuid(value: string) { return /^[0-9a-f]{8}-[0-9a-f]{4}-[1-8][0-9a-f]{3}-[89ab][0-9a-f]{3}-[0-9a-f]{12}$/i.test(value); }

export type ProductActionState = { ok: boolean | null; error?: string };

export async function saveProduct(_state: ProductActionState, formData: FormData): Promise<ProductActionState> {
  const { supabase } = await requireAdmin();
  const id = value(formData, "id");
  const name = value(formData, "name");
  const state = value(formData, "state");
  if (!name || !["fresh", "frozen"].includes(state)) return { ok: false, error: "invalid" };
  const payload = { name, state: state as "fresh" | "frozen" };
  const query = id && isUuid(id) ? supabase.from("products").update(payload).eq("id", id) : supabase.from("products").insert(payload);
  const { error } = await query;
  revalidatePath("/admin/products");
  return error ? { ok: false, error: "save" } : { ok: true };
}

export async function deactivateProduct(_state: ProductActionState, formData: FormData): Promise<ProductActionState> {
  const { supabase } = await requireAdmin();
  const id = value(formData, "id");
  if (!isUuid(id)) return { ok: false, error: "invalid" };
  const { error } = await supabase.from("products").update({ is_active: false }).eq("id", id);
  revalidatePath("/admin/products");
  return error ? { ok: false, error: "save" } : { ok: true };
}

export async function setProductActive(_state: ProductActionState, formData: FormData): Promise<ProductActionState> {
  const { supabase } = await requireAdmin();
  const id = value(formData, "id");
  const active = value(formData, "is_active");
  if (!isUuid(id) || !["true", "false"].includes(active)) return { ok: false, error: "invalid" };
  const { error } = await supabase.from("products").update({ is_active: active === "true" }).eq("id", id);
  revalidatePath("/admin/products");
  revalidatePath("/trips/new");
  return error ? { ok: false, error: "save" } : { ok: true };
}

export async function addDailyPrice(_state: ProductActionState, formData: FormData): Promise<ProductActionState> {
  const { supabase, user } = await requireAdmin();
  const productId = value(formData, "product_id");
  const amount = Number(value(formData, "price_per_kg"));
  const date = value(formData, "date_override") || value(formData, "price_date");
  if (!isUuid(productId) || !Number.isFinite(amount) || amount < 0 || !/^\d{4}-\d{2}-\d{2}$/.test(date)) return { ok: false, error: "invalid" };
  const { error } = await supabase.from("product_prices").upsert({ product_id: productId, price_per_kg: amount, price_date: date, created_by: user.id }, { onConflict: "product_id,price_date" });
  revalidatePath("/admin/products");
  revalidatePath("/trips/new");
  return error ? { ok: false, error: "price" } : { ok: true };
}

export async function saveFactory(_state: ProductActionState, formData: FormData): Promise<ProductActionState> {
  const { supabase } = await requireAdmin();
  const id = value(formData, "id");
  const name = value(formData, "name");
  const fields = { name, phone: value(formData, "phone") || null, address: value(formData, "address") || null, notes: value(formData, "notes") || null };
  if (!name) return { ok: false, error: "invalid" };
  const query = id && isUuid(id) ? supabase.from("factories").update(fields).eq("id", id) : supabase.from("factories").insert(fields);
  const { error } = await query;
  revalidatePath("/admin/factories");
  return error ? { ok: false, error: "save" } : { ok: true };
}

export async function deactivateFactory(_state: ProductActionState, formData: FormData): Promise<ProductActionState> {
  const { supabase } = await requireAdmin();
  const id = value(formData, "id");
  if (!isUuid(id)) return { ok: false, error: "invalid" };
  const { error } = await supabase.from("factories").update({ is_active: false }).eq("id", id);
  revalidatePath("/admin/factories");
  return error ? { ok: false, error: "save" } : { ok: true };
}

export async function setFactoryActive(_state: ProductActionState, formData: FormData): Promise<ProductActionState> {
  const { supabase } = await requireAdmin();
  const id = value(formData, "id");
  const active = value(formData, "is_active");
  if (!isUuid(id) || !["true", "false"].includes(active)) return { ok: false, error: "invalid" };
  const { error } = await supabase.from("factories").update({ is_active: active === "true" }).eq("id", id);
  revalidatePath("/admin/factories");
  revalidatePath("/trips/new");
  return error ? { ok: false, error: "save" } : { ok: true };
}

export async function setFactoryProducts(_state: ProductActionState, formData: FormData): Promise<ProductActionState> {
  const { supabase } = await requireAdmin();
  const factoryId = value(formData, "factory_id");
  const productIds = formData.getAll("product_id").map(String).filter(isUuid);
  if (!isUuid(factoryId)) return { ok: false, error: "invalid" };
  const { error: deleteError } = await supabase.from("factory_products").delete().eq("factory_id", factoryId);
  if (deleteError) return { ok: false, error: "links" };
  if (productIds.length) {
    const { error } = await supabase.from("factory_products").insert(productIds.map((product_id) => ({ factory_id: factoryId, product_id })));
    if (error) return { ok: false, error: "links" };
  }
  revalidatePath("/admin/factories");
  return { ok: true };
}

export async function saveDefaultCommission(_state: ProductActionState, formData: FormData): Promise<ProductActionState> {
  const { supabase } = await requireAdmin();
  const amount = Number(value(formData, "default_commission_pct"));
  if (!Number.isFinite(amount) || amount < 0 || amount > 100) return { ok: false, error: "invalid" };
  const { error } = await supabase.from("settings").update({ default_commission_pct: amount }).eq("id", true);
  revalidatePath("/admin/settings");
  revalidatePath("/admin/accounting");
  return error ? { ok: false, error: "save" } : { ok: true };
}

export async function createEngineer(_state: ProductActionState, formData: FormData): Promise<ProductActionState> {
  await requireAdmin();
  const fullName = value(formData, "full_name");
  const password = value(formData, "password");
  let phone: string;
  try { phone = normalizeEgyptianPhone(value(formData, "phone")); } catch { return { ok: false, error: "phone" }; }
  if (!fullName || password.length < 10) return { ok: false, error: "invalid" };
  const admin = createAdminClient();
  const { data, error } = await admin.auth.admin.createUser({ email: `${phone.replace(/\D/g, "")}@crest.local`, password, email_confirm: true });
  if (error) return { ok: false, error: "create" };
  const { error: profileError } = await admin.from("profiles").insert({ id: data.user.id, full_name: fullName, phone, role: "engineer", is_active: true });
  if (profileError) {
    await admin.auth.admin.deleteUser(data.user.id);
    return { ok: false, error: "create" };
  }
  revalidatePath("/admin/users");
  return { ok: true };
}

export async function resetEngineerPassword(_state: ProductActionState, formData: FormData): Promise<ProductActionState> {
  await requireAdmin();
  const id = value(formData, "id");
  const password = value(formData, "password");
  if (!isUuid(id) || password.length < 10) return { ok: false, error: "invalid" };
  const { error } = await createAdminClient().auth.admin.updateUserById(id, { password });
  revalidatePath("/admin/users");
  return error ? { ok: false, error: "update" } : { ok: true };
}

export async function deactivateEngineer(_state: ProductActionState, formData: FormData): Promise<ProductActionState> {
  const { user } = await requireAdmin();
  const id = value(formData, "id");
  if (!isUuid(id) || id === user.id) return { ok: false, error: "invalid" };
  const { error } = await createAdminClient().from("profiles").update({ is_active: false }).eq("id", id).eq("role", "engineer");
  revalidatePath("/admin/users");
  return error ? { ok: false, error: "update" } : { ok: true };
}

export async function setEngineerActive(_state: ProductActionState, formData: FormData): Promise<ProductActionState> {
  const { user } = await requireAdmin();
  const id = value(formData, "id");
  const active = value(formData, "is_active");
  if (!isUuid(id) || !["true", "false"].includes(active) || (id === user.id && active === "false")) return { ok: false, error: "invalid" };
  const { error } = await createAdminClient().from("profiles").update({ is_active: active === "true" }).eq("id", id).eq("role", "engineer");
  revalidatePath("/admin/users");
  return error ? { ok: false, error: "update" } : { ok: true };
}

export async function saveSupplier(_state: ProductActionState, formData: FormData): Promise<ProductActionState> {
  const { supabase } = await requireProfile();
  const id = value(formData, "id");
  const name = value(formData, "name");
  const fields = { name, phone: value(formData, "phone") || null, address: value(formData, "address") || null, notes: value(formData, "notes") || null };
  if (!name) return { ok: false, error: "invalid" };
  const query = id && isUuid(id) ? supabase.from("suppliers").update(fields).eq("id", id) : supabase.from("suppliers").insert(fields);
  const { error } = await query;
  revalidatePath("/suppliers");
  return error ? { ok: false, error: "save" } : { ok: true };
}

export async function setSupplierProducts(_state: ProductActionState, formData: FormData): Promise<ProductActionState> {
  const { supabase } = await requireProfile();
  const supplierId = value(formData, "supplier_id");
  const productIds = formData.getAll("product_id").map(String).filter(isUuid);
  if (!isUuid(supplierId)) return { ok: false, error: "invalid" };
  const { error: deleteError } = await supabase.from("supplier_products").delete().eq("supplier_id", supplierId);
  if (deleteError) return { ok: false, error: "links" };
  if (productIds.length) {
    const { error } = await supabase.from("supplier_products").insert(productIds.map((product_id) => ({ supplier_id: supplierId, product_id })));
    if (error) return { ok: false, error: "links" };
  }
  revalidatePath("/suppliers");
  return { ok: true };
}

export async function deactivateSupplier(_state: ProductActionState, formData: FormData): Promise<ProductActionState> {
  const { supabase } = await requireAdmin();
  const id = value(formData, "id");
  if (!isUuid(id)) return { ok: false, error: "invalid" };
  const { error } = await supabase.from("suppliers").update({ is_active: false }).eq("id", id);
  revalidatePath("/suppliers");
  return error ? { ok: false, error: "save" } : { ok: true };
}

export async function setSupplierActive(_state: ProductActionState, formData: FormData): Promise<ProductActionState> {
  const { supabase } = await requireAdmin();
  const id = value(formData, "id");
  const active = value(formData, "is_active");
  if (!isUuid(id) || !["true", "false"].includes(active)) return { ok: false, error: "invalid" };
  const { error } = await supabase.from("suppliers").update({ is_active: active === "true" }).eq("id", id);
  revalidatePath("/suppliers");
  revalidatePath("/trips/new");
  return error ? { ok: false, error: "save" } : { ok: true };
}
