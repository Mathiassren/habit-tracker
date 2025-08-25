import { NextResponse } from "next/server";
import { createClient } from "../../../services/supabase/server";

export async function POST(req) {
  let body = {};
  try {
    body = await req.json();
  } catch {}
  const { event, session } = body;
  if (!event || !session) return NextResponse.json({ ok: true });

  const supabase = createClient();
  await supabase.auth.setSession({
    access_token: session.access_token,
    refresh_token: session.refresh_token,
  });

  return NextResponse.json({ ok: true });
}
