// src/services/supabase/server.js
import { cookies } from "next/headers";
import { createServerClient } from "@supabase/ssr";

const URL = process.env.NEXT_PUBLIC_SUPABASE_URL;
const KEY = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY;
const isProd = process.env.NODE_ENV === "production";

/**
 * WRITE-CAPABLE — use ONLY in Route Handlers / Server Actions
 * Must await cookies() in those environments.
 */
export async function createRouteHandlerClient() {
  const cookieStore = await cookies();
  return createServerClient(URL, KEY, {
    cookies: {
      get: (name) => cookieStore.get(name)?.value,
      set: (name, value, options) =>
        cookieStore.set(name, value, {
          path: "/",
          sameSite: "lax",
          httpOnly: true,
          secure: isProd,
          ...options,
        }),
      remove: (name, options) =>
        cookieStore.set(name, "", {
          path: "/",
          sameSite: "lax",
          httpOnly: true,
          secure: isProd,
          maxAge: 0,
          ...options,
        }),
    },
  });
}

/**
 * READ-ONLY — use in Server Components (layouts/pages).
 * Block cookie writes to avoid RSC errors.
 */
export async function createRscClient() {
  const cookieStore = await cookies();
  return createServerClient(URL, KEY, {
    cookies: {
      get: (name) => cookieStore.get(name)?.value,
      set: () => {}, // no-op in RSC
      remove: () => {}, // no-op in RSC
    },
  });
}
