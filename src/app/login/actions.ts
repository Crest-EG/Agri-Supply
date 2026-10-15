"use server";

import { redirect } from "next/navigation";
import { createClient } from "@/lib/supabase/server";
import { phoneLoginEmail, normalizeEgyptianPhone } from "@/lib/phone";

export async function signIn(formData: FormData) {
  const phoneInput = String(formData.get("phone") ?? "");
  const password = String(formData.get("password") ?? "");
  let email: string;
  try {
    email = phoneLoginEmail(normalizeEgyptianPhone(phoneInput));
  } catch {
    redirect("/login?error=phone");
  }
  if (!password) redirect("/login?error=missing");
  const supabase = await createClient();
  const { error } = await supabase.auth.signInWithPassword({ email, password });
  if (error) redirect("/login?error=credentials");
  redirect("/trips");
}
