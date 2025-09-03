// src/app/auth/callback/route.js
import { NextResponse } from "next/server";
import { createRscClient } from "@/services/supabase/server";

export async function GET(req) {
  const { searchParams, origin } = new URL(req.url);
  const code = searchParams.get("code");

  if (!code) {
    return NextResponse.redirect(`${origin}/?auth=missing_code`);
  }

  const supabase = createRscClient();
  const { error } = await supabase.auth.exchangeCodeForSession(code);

  if (error) {
    return NextResponse.redirect(`${origin}/?auth=error`);
  }

  return NextResponse.redirect(`${origin}/dashboard`);
}
