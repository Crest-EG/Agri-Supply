import { createClient } from "@supabase/supabase-js";
import type { Database } from "../src/lib/database.types.ts";
import { createInterface } from "node:readline/promises";
import { stdin as input, stdout as output } from "node:process";

const url = process.env.NEXT_PUBLIC_SUPABASE_URL;
const serviceKey = process.env.SUPABASE_SERVICE_ROLE_KEY;
if (!url || !serviceKey) throw new Error("Set NEXT_PUBLIC_SUPABASE_URL and SUPABASE_SERVICE_ROLE_KEY in .env.local.");

const rl = createInterface({ input, output });
const ask = (label: string) => rl.question(label);
try {
  const fullName = (await ask("Admin full name: ")).trim();
  let phone = (await ask("Egyptian phone: ")).replace(/\D/g, "");
  if (phone.startsWith("0")) phone = `20${phone.slice(1)}`;
  else if (!phone.startsWith("20")) phone = `20${phone}`;
  if (!/^20\d{10}$/.test(phone) || !fullName) throw new Error("Enter a name and a valid Egyptian phone number.");
  const password = await ask("Temporary password: ");
  if (password.length < 10) throw new Error("Use a temporary password with at least 10 characters.");

  const supabase = createClient<Database>(url, serviceKey, { auth: { persistSession: false, autoRefreshToken: false } });
  const { data, error } = await supabase.auth.admin.createUser({ email: `${phone}@crest.local`, password, email_confirm: true });
  if (error) throw error;
  const { error: profileError } = await supabase.from("profiles").insert({ id: data.user.id, full_name: fullName, phone, role: "admin", is_active: true });
  if (profileError) {
    await supabase.auth.admin.deleteUser(data.user.id);
    throw profileError;
  }
  console.log(`Admin created for ${phone}.`);
} finally {
  rl.close();
}
