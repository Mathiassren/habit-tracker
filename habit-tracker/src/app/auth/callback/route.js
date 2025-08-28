// src/app/auth/callback/route.js
import { NextResponse } from "next/server";
import { createRouteHandlerClient } from "../../../services/supabase/server";

export async function GET(req) {
  const url = new URL(req.url);
  const code = url.searchParams.get("code");
  const next = url.searchParams.get("next") || "/dashboard";
  if (!code) return NextResponse.redirect(`${url.origin}/?auth=missing_code`);

  const supabase = await createRouteHandlerClient();
  const { error } = await supabase.auth.exchangeCodeForSession(code);
  if (error) return NextResponse.redirect(`${url.origin}/?auth=error`);
  return NextResponse.redirect(`${url.origin}${next}`);
}
