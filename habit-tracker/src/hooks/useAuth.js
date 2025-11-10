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
    // Detect if running in Capacitor (mobile app)
    const isCapacitor = typeof window !== 'undefined' && window.Capacitor;
    
    // Use app's custom scheme for mobile, regular URL for web
    let redirectTo;
    if (isCapacitor) {
      // Use the app's custom URL scheme for deep linking back to the app
      redirectTo = `com.rytmo.app://auth/callback`;
    } else {
      redirectTo = `${window.location.origin}/auth/callback`;
    }
    
    const { error, data } = await supabase.auth.signInWithOAuth({
      provider: "google",
      options: { 
        redirectTo, 
        queryParams: { prompt: "select_account" },
      },
    });
    
    if (error) {
      toast.error(error.message || "Failed to sign in with Google");
      return;
    }
    
    // If in Capacitor and we have a URL, open it in the in-app browser
    // This prevents opening external Chrome browser
    if (isCapacitor && data?.url) {
      try {
        // Dynamically import Capacitor Browser plugin
        const { Browser } = await import('@capacitor/browser');
        await Browser.open({
          url: data.url,
          presentationStyle: 'popover', // Opens as modal overlay, better UX
        });
        // Note: When OAuth completes, it will redirect to com.rytmo.app://auth/callback
        // The App plugin will handle this deep link and navigate to /auth/callback
        // The callback page will then process the authentication
      } catch (err) {
        // Fallback: if Browser plugin not available, let Supabase handle it
        // This will still work but might open external browser
      }
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