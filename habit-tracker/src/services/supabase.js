// src/services/supabase.js
"use client";
import { createClient } from "@supabase/supabase-js";

export const supabase = createClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL,
  process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY,
  {
    auth: {
      persistSession: true, // store in localStorage
      autoRefreshToken: true,
      // DO NOT set detectSessionInUrl:false — PKCE needs it
    },
  }
);
