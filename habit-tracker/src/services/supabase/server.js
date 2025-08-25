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
        get: (name) => cookieStore.get(name)?.value,

        // Next 14: set(name, value, options)
        set: (name, value, options) => {
          cookieStore.set(name, value, {
            path: "/",
            sameSite: "lax",
            secure: isProd,
            ...options,
          });
        },

        // Next 14: set(name, "", { maxAge: 0, ... })
        remove: (name, options) => {
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
