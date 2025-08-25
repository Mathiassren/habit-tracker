import { NextResponse } from "next/server";
import { createClient } from "../../../services/supabase/server";

export async function GET(req) {
  const url = new URL(req.url);
  const code = url.searchParams.get("code");
  const origin = url.origin;

  if (!code) return NextResponse.redirect(`${origin}/?auth=missing_code`);

  const supabase = createClient();
  const { error } = await supabase.auth.exchangeCodeForSession(code);
  if (error) return NextResponse.redirect(`${origin}/?auth=error`);

  return NextResponse.redirect(`${origin}/dashboard`);
}
