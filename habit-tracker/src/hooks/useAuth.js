// src/hooks/useAuth.js
"use client";

import { useState, useEffect, useCallback } from "react";
import { supabase } from "@/services/supabase";
import toast from "react-hot-toast";

export function useAuth() {
  const [user, setUser] = useState(null);
  const [loading, setLoading] = useState(true);
  const [authReady, setAuthReady] = useState(false);

  const load = useCallback(async () => {
    setLoading(true);
    const { data, error } = await supabase.auth.getSession();
    if (error) console.warn("getSession:", error.message);
    setUser(data?.session?.user ?? null);
    setLoading(false);
  }, []);

  useEffect(() => {
    let mounted = true;

    load().finally(() => {
      if (mounted) setAuthReady(true);
    });

    const { data } = supabase.auth.onAuthStateChange((_evt, session) => {
      setUser(session?.user ?? null);
    });

    return () => {
      mounted = false;
      data?.subscription?.unsubscribe?.();
    };
  }, [load]);

  const loginWithGoogle = async () => {
    const redirectTo = `${window.location.origin}/auth/callback`;
    const { error } = await supabase.auth.signInWithOAuth({
      provider: "google",
      options: { redirectTo, queryParams: { prompt: "select_account" } },
    });
    if (error) {
      toast.error(error.message || "Failed to sign in with Google");
    }
  };

  const logout = async () => {
    const { error } = await supabase.auth.signOut();
    if (error) {
      toast.error(error.message || "Failed to sign out");
      return;
    }
    toast.success("Signed out successfully");
    window.location.assign("/");
  };

  return { user, loading, authReady, loginWithGoogle, logout };
}