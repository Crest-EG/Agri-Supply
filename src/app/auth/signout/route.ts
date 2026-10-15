import { NextResponse, type NextRequest } from "next/server";
import { createServerClient } from "@supabase/ssr";
import type { SupabaseClient } from "@supabase/supabase-js";
import type { Database } from "@/lib/database.types";

export async function POST(request: NextRequest) {
  const response = NextResponse.redirect(new URL("/login", request.url), { status: 303 });
  const url = process.env.NEXT_PUBLIC_SUPABASE_URL;
  const key = process.env.NEXT_PUBLIC_SUPABASE_PUBLISHABLE_KEY;
  if (url && key) {
    const supabase = createServerClient(url, key, {
      cookies: {
        getAll: () => request.cookies.getAll(),
        setAll: (items) => items.forEach(({ name, value, options }) => response.cookies.set(name, value, options)),
      },
    });
    await (supabase as unknown as SupabaseClient<Database>).auth.signOut();
  }
  return response;
}
