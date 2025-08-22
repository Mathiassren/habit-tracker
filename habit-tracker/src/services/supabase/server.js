// src/services/supabase/server.js
import { cookies } from "next/headers";
import { createServerClient } from "@supabase/ssr";

export function createClient() {
  const cookieStore = cookies();
  const isProd = process.env.NODE_ENV === "production";

  return createServerClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL,
    process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY,
    {
      cookies: {
        get(name) {
          return cookieStore.get(name)?.value;
        },
        set(name, value, options) {
          cookieStore.set(name, value, {
            path: "/", // ✅ critical
            sameSite: "lax", // ✅ recommended
            secure: isProd, // ✅ in prod
            ...options,
          });
        },
        remove(name, options) {
          cookieStore.set(name, "", {
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
}
