import { redirect } from "next/navigation";
import { createClient } from "@/lib/supabase/server";

export default async function HomePage(): Promise<never> {
  let destination = "/login";
  try {
    const supabase = await createClient();
    const { data: { user } } = await supabase.auth.getUser();
    if (user) {
      const { data: profile } = await supabase.from("profiles").select("is_active").eq("id", user.id).maybeSingle();
      if (profile?.is_active) destination = "/trips";
    }
  } catch {
    destination = "/login";
  }
  redirect(destination);
}
