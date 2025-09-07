// src/app/auth/callback/page.jsx
"use client";

import { useEffect } from "react";
import { useRouter } from "next/navigation";
import { supabase } from "@/services/supabase";

export default function OAuthCallback() {
  const router = useRouter();

  useEffect(() => {
    (async () => {
      // Optional debug: confirm PKCE is present
      // console.log("hasVerifier?", !!localStorage.getItem("sb-pkce-code-verifier"));

      const { error } = await supabase.auth.exchangeCodeForSession(
        window.location.href
      );

      if (error) {
        router.replace("/?auth=error");
        return;
      }

      try {
        await fetch("/auth/refresh", { method: "POST" });
      } catch {}
      router.replace("/dashboard");
    })();
  }, [router]);

  return <p style={{ padding: 24 }}>Signing you in…</p>;
}
