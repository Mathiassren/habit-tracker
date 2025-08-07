"use client";

import { useState, useEffect } from "react";
import { supabase } from "@/services/supabase";

export function useAuth() {
  const [user, setUser] = useState(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const checkUser = async () => {
      const {
        data: { user: authUser },
      } = await supabase.auth.getUser();

      if (authUser) {
        // ✅ Fetch additional profile data
        const { data: profile, error: profileError } = await supabase
          .from("profiles")
          .select("full_name, avatar_url")
          .eq("id", authUser.id)
          .single();

        if (profile) {
          // Merge profile data into user object
          authUser.user_metadata.full_name = profile.full_name;
          authUser.user_metadata.avatar_url = profile.avatar_url;
        } else if (profileError) {
          console.error("Profile fetch error:", profileError.message);
        }

        setUser(authUser);
      } else {
        setUser(null);
      }

      setLoading(false);
    };

    checkUser();

    const { data: authListener } = supabase.auth.onAuthStateChange(
      (_, session) => {
        if (session?.user) {
          setUser(session.user);
        } else {
          setUser(null);
        }
      }
    );

    return () => authListener?.subscription.unsubscribe();
  }, []);

  const loginWithGoogle = async () => {
    const { error } = await supabase.auth.signInWithOAuth({
      provider: "google",
      options: {
        redirectTo: `${window.location.origin}`, // or `${window.location.origin}/auth/callback`
      },
    });
    if (error) alert(error.message);
  };

  const logout = async () => {
    await supabase.auth.signOut();
    setUser(null);
  };

  return { user, setUser, loading, loginWithGoogle, logout };
}
