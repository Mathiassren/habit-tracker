// middleware.js
import { NextResponse } from "next/server";
import { createServerClient } from "@supabase/ssr";

export async function middleware(req) {
  const res = NextResponse.next({ request: { headers: req.headers } });
  const isProd = process.env.NODE_ENV === "production";

  const supabase = createServerClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL,
    process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY,
    {
      cookies: {
        get: (name) => req.cookies.get(name)?.value,
        set: (name, value, options) => {
          res.cookies.set({
            name,
            value,
            path: "/",
            sameSite: "lax",
            secure: isProd,
            ...options,
          });
        },
        remove: (name, options) => {
          res.cookies.set({
            name,
            value: "",
            path: "/",
            sameSite: "lax",
            secure: isProd,
            maxAge: 0,
            ...options,
          });
        },
      },
    }
  );

  // Triggers silent refresh if needed and syncs cookies
  await supabase.auth.getUser();

  return res;
}

export const config = {
  matcher: [
    "/((?!_next/static|_next/image|favicon.ico|icons|images|manifest.json|robots.txt|sitemap.xml).*)",
  ],
};
