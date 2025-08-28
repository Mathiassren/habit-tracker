// src/app/auth/refresh/route.js
import { NextResponse } from "next/server";
import { createRouteHandlerClient } from "../../../services/supabase/server";

export async function POST(req) {
  const supabase = await createRouteHandlerClient();
  const { event, session } = (await req.json().catch(() => ({}))) || {};
  if (!event || !session) return NextResponse.json({ ok: true });

  await supabase.auth.setSession({
    access_token: session.access_token,
    refresh_token: session.refresh_token,
  });

  return NextResponse.json({ ok: true });
}
