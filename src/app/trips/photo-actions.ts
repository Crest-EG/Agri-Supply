"use server";

import { requireProfile } from "@/lib/authz";

export async function getTripPhotoUrl(tripId: string): Promise<{ url?: string; error?: string }> {
  if (!/^[0-9a-f]{8}-[0-9a-f]{4}-[1-8][0-9a-f]{3}-[89ab][0-9a-f]{3}-[0-9a-f]{12}$/i.test(tripId)) return { error: "رقم الرحلة غير صالح." };
  const { supabase } = await requireProfile();
  const { data: trip } = await supabase.from("trips").select("photo_path").eq("id", tripId).maybeSingle();
  if (!trip?.photo_path) return { error: "لا توجد صورة لهذه الرحلة." };
  const { data, error } = await supabase.storage.from("trip-photos").createSignedUrl(trip.photo_path, 60);
  if (error || !data?.signedUrl) return { error: "تعذر إنشاء رابط آمن للصورة." };
  return { url: data.signedUrl };
}
