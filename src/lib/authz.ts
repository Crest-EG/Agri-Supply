import { cache } from "react";
import { redirect } from "next/navigation";
import { createClient } from "@/lib/supabase/server";
import { timeSupabase } from "@/lib/supabase/timing";

export const requireProfile = cache(async function requireProfile() {
  const supabase = await createClient();
  const { data: { user } } = await timeSupabase("auth.getUser", supabase.auth.getUser());
  if (!user) redirect("/login");
  const { data: profile } = await timeSupabase("profiles.current", supabase.from("profiles").select("id, full_name, phone, role, is_active").eq("id", user.id).maybeSingle());
  if (!profile?.is_active) redirect("/login?error=credentials");
  return { supabase, user, profile };
});

export async function requireAdmin() {
  const session = await requireProfile();
  if (session.profile.role !== "admin") redirect("/trips");
  return session;
}
