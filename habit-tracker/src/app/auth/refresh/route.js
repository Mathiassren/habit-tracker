// src/app/auth/refresh/route.js
import { NextResponse } from "next/server";
import { createRouteHandlerClient } from "../../../services/supabase/server";

export async function POST(req) {
  const supabase = await createRouteHandlerClient();
  const { event, session } = (await req.json().catch(() => ({}))) || {};

  // Always 200 to avoid blocking UI
  if (!event) return NextResponse.json({ ok: true });

  try {
    if (event === "SIGNED_OUT") {
      // Proactively clear HttpOnly cookies
      await supabase.auth.signOut();
      return NextResponse.json({ ok: true });
    }

    if (
      session &&
      (event === "SIGNED_IN" ||
        event === "TOKEN_REFRESHED" ||
        event === "USER_UPDATED")
    ) {
      await supabase.auth.setSession({
        access_token: session.access_token,
        refresh_token: session.refresh_token,
      });
    }
  } catch (e) {
    console.error("refresh route error:", e?.message || e);
  }

  return NextResponse.json({ ok: true });
}
