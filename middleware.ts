import { createServerClient } from "@supabase/ssr";
import type { SupabaseClient } from "@supabase/supabase-js";
import { NextResponse, type NextRequest } from "next/server";
import type { Database } from "@/lib/database.types";
import { timeSupabase } from "@/lib/supabase/timing";

export async function middleware(request: NextRequest) {
  let response = NextResponse.next({ request });
  const url = process.env.NEXT_PUBLIC_SUPABASE_URL;
  const key = process.env.NEXT_PUBLIC_SUPABASE_PUBLISHABLE_KEY;
  if (!url || !key) return response;

  const supabase = createServerClient(url, key, {
    cookies: {
      getAll: () => request.cookies.getAll(),
      setAll(cookiesToSet) {
        cookiesToSet.forEach(({ name, value }) => request.cookies.set(name, value));
        response = NextResponse.next({ request });
        cookiesToSet.forEach(({ name, value, options }) => response.cookies.set(name, value, options));
      },
    },
  });
  const typedSupabase = supabase as unknown as SupabaseClient<Database>;

  const { data: claims } = await timeSupabase("middleware.auth.getClaims", typedSupabase.auth.getClaims());
  if (request.nextUrl.pathname.startsWith("/trips") && !claims?.claims?.sub) {
    return NextResponse.redirect(new URL("/login", request.url));
  }
  return response;
}

export const config = { matcher: ["/trips/:path*"] };
