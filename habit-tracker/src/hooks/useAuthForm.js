"use client";

import { useState } from "react";
import { supabase } from "@/services/supabase";
import { useRouter } from "next/navigation";

export function useAuthForm() {
  const router = useRouter();
  const [mode, setMode] = useState("login"); // "login" | "signup"
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [loading, setLoading] = useState(false);
  const [authError, setAuthError] = useState(null);
  const [infoMsg, setInfoMsg] = useState(null);

  function switchMode() {
    setMode((m) => (m === "login" ? "signup" : "login"));
    setAuthError(null);
    setInfoMsg(null);
  }

  async function handleSubmit(e) {
    e.preventDefault();
    setLoading(true);
    setAuthError(null);
    setInfoMsg(null);

    try {
      if (mode === "login") {
        const { error } = await supabase.auth.signInWithPassword({
          email,
          password,
        });
        if (error) throw error;
        // redirect to dashboard on login
        router.push("/dashboard");
      } else {
        const { error } = await supabase.auth.signUp({ email, password });
        if (error) throw error;
        setInfoMsg("Check your inbox to confirm your email before logging in.");
      }
    } catch (err) {
      setAuthError(err?.message || "Something went wrong. Try again.");
    } finally {
      setLoading(false);
    }
  }

  async function handleForgotPassword() {
    setAuthError(null);
    setInfoMsg(null);
    if (!email) {
      setAuthError("Enter your email above, then click Forgot password.");
      return;
    }
    try {
      const redirectTo = `${window.location.origin}/reset`;
      const { error } = await supabase.auth.resetPasswordForEmail(email, {
        redirectTo,
      });
      if (error) throw error;
      setInfoMsg("Password reset link sent. Check your email.");
    } catch (err) {
      setAuthError(err?.message || "Could not send reset email.");
    }
  }

  return {
    // state
    mode,
    email,
    password,
    loading,
    authError,
    infoMsg,
    // setters
    setEmail,
    setPassword,
    // actions
    handleSubmit,
    handleForgotPassword,
    switchMode,
  };
}
