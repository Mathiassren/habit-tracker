"use client";

import { useState, useEffect, useCallback } from "react";
import { supabase } from "@/services/supabase";

export function useAuth() {
  const [user, setUser] = useState(null);
  const [loading, setLoading] = useState(true);

  const loadUserWithProfile = useCallback(async () => {
    setLoading(true);

    const { data, error } = await supabase.auth.getSession();
    if (error) {
      console.warn("getSession warning:", error.message);
    }

    const session = data?.session || null;
    const authUser = session?.user || null;

    if (!authUser) {
      setUser(null);
      setLoading(false);
      return null;
    }

    const { data: profile, error: profileError } = await supabase
      .from("profiles")
      .select("full_name, avatar_url")
      .eq("id", authUser.id)
      .maybeSingle();

    if (profileError) {
      console.warn("Profile fetch error:", profileError.message);
    }

    const merged = {
      ...authUser,
      user_metadata: {
        ...authUser.user_metadata,
        ...(profile?.full_name ? { full_name: profile.full_name } : {}),
        ...(profile?.avatar_url ? { avatar_url: profile.avatar_url } : {}),
      },
    };

    setUser(merged);
    setLoading(false);
    return merged;
  }, []);

  useEffect(() => {
    // Initial load
    loadUserWithProfile();

    // Listen for auth changes and reload profile
    const {
      data: { subscription },
    } = supabase.auth.onAuthStateChange(async (event) => {
      if (event === "SIGNED_OUT") {
        setUser(null);
        setLoading(false);
        return;
      }
      setLoading(true);
      await loadUserWithProfile();
    });

    return () => subscription?.unsubscribe();
  }, [loadUserWithProfile]);

  const loginWithGoogle = async () => {
    const { error } = await supabase.auth.signInWithOAuth({
      provider: "google",
      options: {
        redirectTo: `${window.location.origin}/auth/callback`,
        queryParams: { prompt: "select_account" }, // force chooser
      },
    });
    if (error) alert(error.message);
  };

  const logout = async () => {
    try {
      // 1) Clear SSR cookie on server
      await fetch("/auth/sign-out", { method: "POST" });

      // 2) Clear local + revoke provider so Google shows chooser next time
      await supabase.auth.signOut({ scope: "global" }).catch(() => {});

      // 3) Reset state and hard redirect
      setUser(null);
      window.location.assign("/");
    } catch (err) {
      console.error("Logout failed:", err?.message || err);
      alert(err?.message || "Logout failed");
    }
  };

  const refresh = async () => {
    setLoading(true);
    await loadUserWithProfile();
  };

  return { user, setUser, loading, loginWithGoogle, logout, refresh };
}
