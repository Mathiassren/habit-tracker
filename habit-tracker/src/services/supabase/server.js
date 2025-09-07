// src/services/supabase/server.js
import { cookies } from "next/headers";
import { NextResponse } from "next/server";
import { createServerClient } from "@supabase/ssr";

const isProd = process.env.NODE_ENV === "production";

/** RSC/pages (server components). MUST await cookies() */
export async function createRscClient() {
  const store = await cookies();
  return createServerClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL,
    process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY,
    {
      cookies: {
        get(name) {
          return store.get(name)?.value;
        },
        set() {}, // no writes in RSC
        remove() {}, // writes belong in route handlers
      },
    }
  );
}

/** Route handlers: await cookies(), attach writes to the response */
export async function createRouteHandlerClient() {
  const store = await cookies();
  const res = new NextResponse(null, { status: 200 });

  const supabase = createServerClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL,
    process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY,
    {
      cookies: {
        get: (name) => store.get(name)?.value,
        set: (name, value, options) => {
          res.cookies.set({
            name,
            value,
            ...options,
            httpOnly: true,
            sameSite: "lax",
            secure: isProd,
            path: "/",
          });
        },
        remove: (name, options) => {
          res.cookies.set({
            name,
            value: "",
            ...options,
            httpOnly: true,
            sameSite: "lax",
            secure: isProd,
            path: "/",
            expires: new Date(0),
          });
        },
      },
    }
  );

  return { supabase, res };
}
