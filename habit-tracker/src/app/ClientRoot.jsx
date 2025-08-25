// src/app/ClientRoot.jsx
"use client";
import { useEffect, useState } from "react";
import { supabase } from "../services/supabase";
import Nav from "../app/components/nav";

export default function ClientRoot({ children, user }) {
  const [mounted, setMounted] = useState(false);

  useEffect(() => {
    setMounted(true);

    const {
      data: { subscription },
    } = supabase.auth.onAuthStateChange(async (event, session) => {
      if (event === "SIGNED_IN" || event === "TOKEN_REFRESHED") {
        await fetch("/auth/refresh", {
          method: "POST",
          headers: { "content-type": "application/json" },
          body: JSON.stringify({ event, session }),
        });
      }
    });

    return () => subscription?.unsubscribe();
  }, []);

  return (
    <>
      {/* hydration-safe: render placeholder on SSR, real Nav after mount */}
      <div suppressHydrationWarning>
        {mounted ? <Nav initialUser={user} /> : <nav className="p-4" />}
      </div>
      {children}
    </>
  );
}
