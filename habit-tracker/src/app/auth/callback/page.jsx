// src/app/auth/callback/page.jsx
"use client";

import { useEffect } from "react";
import { useRouter } from "next/navigation";
import { supabase } from "@/services/supabase";

export default function OAuthCallback() {
  const router = useRouter();

  useEffect(() => {
    (async () => {
      // Handle deep link callback from mobile app
      // If we're in Capacitor and the URL has the custom scheme, convert it to https
      let callbackUrl = window.location.href;
      if (typeof window !== 'undefined' && window.Capacitor) {
        // Replace custom scheme with https for Supabase
        callbackUrl = callbackUrl.replace(/^com\.rytmo\.app:\/\//, 'https://habify1-5lwwsyfgu-mathiassrens-projects.vercel.app/');
      }

      // Optional debug: confirm PKCE is present
      // console.log("hasVerifier?", !!localStorage.getItem("sb-pkce-code-verifier"));

      const { error } = await supabase.auth.exchangeCodeForSession(
        callbackUrl
      );

      if (error) {
        router.replace("/?auth=error");
        return;
      }

      try {
        await fetch("/auth/refresh", { method: "POST" });
        
        // Restore custom avatar from profiles table if it exists
        // This prevents Google OAuth from overwriting custom avatars
        const { data: { user } } = await supabase.auth.getUser();
        if (user?.id) {
          const { data: profile } = await supabase
            .from("profiles")
            .select("avatar_url")
            .eq("id", user.id)
            .single();
          
          // If profiles table has a custom avatar (not Google's), restore it
          if (profile?.avatar_url) {
            const googleAvatar = user.user_metadata?.avatar_url;
            // Check if the profile avatar is different from Google's (custom upload)
            // Custom avatars are stored in Supabase storage, Google avatars are from googleusercontent.com
            if (profile.avatar_url.includes('supabase') || 
                (googleAvatar && profile.avatar_url !== googleAvatar)) {
              await supabase.auth.updateUser({
                data: { avatar_url: profile.avatar_url },
              });
            }
          }
        }
      } catch {}
      router.replace("/dashboard");
    })();
  }, [router]);

  return <p style={{ padding: 24 }}>Signing you in…</p>;
}
