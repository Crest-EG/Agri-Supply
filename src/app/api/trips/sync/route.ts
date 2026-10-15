import { NextResponse } from "next/server";
import { createClient } from "@/lib/supabase/server";
import { syncQueuedTrip } from "@/lib/offline/sync";
import type { QueuedTrip } from "@/lib/offline/types";

export async function POST(request: Request) {
  const supabase = await createClient();
  const { data: { user } } = await supabase.auth.getUser();
  if (!user) return NextResponse.json({ ok: false, reason: "انتهت جلسة الدخول.", retryable: false }, { status: 401 });

  const { data: profile } = await supabase.from("profiles").select("id, full_name, phone, role, is_active").eq("id", user.id).maybeSingle();
  if (!profile?.is_active) return NextResponse.json({ ok: false, reason: "الحساب غير نشط.", retryable: false }, { status: 403 });

  let payload: QueuedTrip;
  try {
    const form = await request.formData();
    const rawPayload = form.get("payload");
    if (typeof rawPayload !== "string") return NextResponse.json({ ok: false, reason: "بيانات المزامنة غير صالحة.", retryable: false }, { status: 400 });
    payload = JSON.parse(rawPayload) as QueuedTrip;
    const photo = form.get("photo");
    payload.photo = photo instanceof File ? photo : null;
  } catch {
    return NextResponse.json({ ok: false, reason: "تعذر قراءة بيانات المزامنة.", retryable: false }, { status: 400 });
  }

  const result = await syncQueuedTrip(payload, { supabase, user, profile });
  return NextResponse.json(result);
}
