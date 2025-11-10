// src/app/ClientRoot.jsx
"use client";
import { useEffect, useState } from "react";
import { useRouter } from "next/navigation";
import { supabase } from "../services/supabase"; // -> re-exports browser client
import Nav from "../app/components/nav";
import { Toaster } from "react-hot-toast";

export default function ClientRoot({ children, user }) {
  const [mounted, setMounted] = useState(false);
  const router = useRouter();

  useEffect(() => {
    setMounted(true);

    const {
      data: { subscription },
    } = supabase.auth.onAuthStateChange(async (event, session) => {
      try {
        if (
          event === "SIGNED_IN" ||
          event === "TOKEN_REFRESHED" ||
          event === "USER_UPDATED"
        ) {
          await fetch("/auth/refresh", {
            method: "POST",
            headers: {
              "Content-Type": "application/json",
              "Cache-Control": "no-store",
            },
            credentials: "same-origin",
            body: JSON.stringify({ event, session }),
          });
          router.refresh(); // make SSR see the new session immediately
        } else if (event === "SIGNED_OUT") {
          await fetch("/auth/refresh", {
            method: "POST",
            headers: {
              "Content-Type": "application/json",
              "Cache-Control": "no-store",
            },
            credentials: "same-origin",
            body: JSON.stringify({ event }),
          });
          router.refresh(); // clear SSR state immediately
        }
      } catch (e) {
        console.warn("Auth state sync failed:", e?.message || e);
      }
    });

    return () => subscription?.unsubscribe();
  }, [router]);

  return (
    <>
      {/* hydration-safe: render placeholder on SSR, real Nav after mount */}
      <div suppressHydrationWarning style={{ position: 'relative', zIndex: 9999 }}>
        {mounted ? <Nav /> : <nav className="p-4" />}
      </div>
      {children}
      <Toaster
        position="top-center"
        toastOptions={{
          duration: 4000,
          style: {
            background: '#1e293b',
            color: '#fff',
            border: '1px solid rgba(99, 102, 241, 0.3)',
            borderRadius: '12px',
          },
          success: {
            iconTheme: {
              primary: '#10b981',
              secondary: '#fff',
            },
          },
          error: {
            iconTheme: {
              primary: '#ef4444',
              secondary: '#fff',
            },
          },
        }}
      />
    </>
  );
}
