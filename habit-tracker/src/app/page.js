"use client";

import { useEffect, useState } from "react";
import { motion } from "framer-motion";
import Lottie from "lottie-react";
import { useAuth } from "@/hooks/useAuth";
import { useRouter } from "next/navigation";
import { supabase } from "@/services/supabase";

export default function Home() {
  const router = useRouter();
  const { user, loginWithGoogle } = useAuth();

  // Lottie data (loaded from /public)
  const [animationData, setAnimationData] = useState(null);

  // UI state
  const [mode, setMode] = useState("login"); // "login" | "signup"
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [loading, setLoading] = useState(false);
  const [authError, setAuthError] = useState(null);
  const [infoMsg, setInfoMsg] = useState(null);

  // Load Lottie JSON from /public (so you can keep /public/animations/login.json)
  useEffect(() => {
    fetch("/animations/login.json")
      .then((r) => r.json())
      .then(setAnimationData)
      .catch(() => setAnimationData(null));
  }, []);

  // Clean OAuth hash once
  useEffect(() => {
    supabase.auth.getSession().finally(() => {
      if (
        typeof window !== "undefined" &&
        window.location.hash.includes("access_token")
      ) {
        const cleanUrl =
          window.location.origin +
          window.location.pathname +
          window.location.search;
        window.history.replaceState({}, document.title, cleanUrl);
      }
    });
  }, []);

  // Redirect if logged in
  useEffect(() => {
    if (user) router.push("/dashboard");
  }, [user, router]);

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
      const origin =
        typeof window !== "undefined"
          ? window.location.origin
          : process.env.NEXT_PUBLIC_SITE_URL;
      const { error } = await supabase.auth.resetPasswordForEmail(email, {
        redirectTo: `${origin}/reset`,
      });
      if (error) throw error;
      setInfoMsg("Password reset link sent. Check your email.");
    } catch (err) {
      setAuthError(err?.message || "Could not send reset email.");
    }
  }

  function switchMode() {
    setMode((m) => (m === "login" ? "signup" : "login"));
    setAuthError(null);
    setInfoMsg(null);
  }

  return (
    <div className="min-h-screen w-full bg-[#0b0b0f] text-white flex flex-col items-center justify-center px-6">
      {/* Title */}
      <motion.div
        initial={{ opacity: 0, y: 8 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.6, ease: "easeOut" }}
        className="mb-6 text-center"
      >
        <h1 className="text-5xl font-extrabold tracking-wide">
          <span className="bg-gradient-to-r from-[#2980B9] via-[#6DD5FA] to-[#FFFFFF] bg-clip-text text-transparent">
            Habify
          </span>
        </h1>
        <p className="mt-2 text-sm text-gray-400">
          Small steps. Real progress.
        </p>
      </motion.div>

      {/* Auth Card (centered) */}
      <motion.div
        initial={{ opacity: 0, y: 8 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.5, delay: 0.1, ease: "easeOut" }}
        className="w-full max-w-md rounded-2xl border border-gray-800/70 bg-gray-900/60 p-6 backdrop-blur"
      >
        <form onSubmit={handleSubmit} className="space-y-3">
          <div>
            <label htmlFor="email" className="mb-1 block text-xs text-gray-400">
              Email
            </label>
            <input
              id="email"
              type="email"
              required
              value={email}
              onChange={(e) => setEmail(e.target.value)}
              className="w-full rounded-lg border border-gray-700 bg-gray-800/70 px-3 py-2 text-sm text-gray-100 outline-none focus:border-purple-500"
              placeholder="you@example.com"
              autoComplete="email"
              aria-invalid={!!authError}
            />
          </div>

          <div>
            <div className="mb-1 flex items-center justify-between">
              <label htmlFor="password" className="text-xs text-gray-400">
                Password
              </label>
              {mode === "login" && (
                <button
                  type="button"
                  className="text-xs text-gray-400 underline underline-offset-4 hover:text-gray-200"
                  onClick={handleForgotPassword}
                >
                  Forgot password?
                </button>
              )}
            </div>
            <input
              id="password"
              type="password"
              required
              minLength={6}
              value={password}
              onChange={(e) => setPassword(e.target.value)}
              className="w-full rounded-lg border border-gray-700 bg-gray-800/70 px-3 py-2 text-sm text-gray-100 outline-none focus:border-purple-500"
              placeholder={
                mode === "signup" ? "Create a strong password" : "Your password"
              }
              autoComplete={
                mode === "signup" ? "new-password" : "current-password"
              }
              aria-invalid={!!authError}
            />
          </div>

          {authError && (
            <div className="rounded-md border border-red-500/40 bg-red-500/10 px-3 py-2 text-sm text-red-300">
              {authError}
            </div>
          )}
          {infoMsg && (
            <div className="rounded-md border border-emerald-500/40 bg-emerald-500/10 px-3 py-2 text-sm text-emerald-300">
              {infoMsg}
            </div>
          )}

          <button
            type="submit"
            disabled={loading}
            className="mt-2 w-full rounded-lg bg-gradient-to-r from-[#2980B9] via-[#6DD5FA] to-[#FFFFFF] px-4 py-2 text-sm font-semibold text-white shadow transition hover:brightness-110 disabled:cursor-not-allowed disabled:opacity-60"
          >
            {loading
              ? mode === "login"
                ? "Logging in…"
                : "Creating account…"
              : mode === "login"
              ? "Login"
              : "Create Account"}
          </button>
        </form>

        <div className="my-4 text-center text-xs uppercase tracking-wide text-gray-500">
          or
        </div>

        <button
          onClick={loginWithGoogle}
          className="group inline-flex w-full items-center justify-center gap-2 rounded-lg border border-gray-700 bg-gray-800/70 px-4 py-2 text-sm font-medium text-gray-100 transition hover:bg-gray-800"
          aria-label={
            mode === "login" ? "Continue with Google" : "Sign up with Google"
          }
        >
          <svg
            viewBox="0 0 24 24"
            aria-hidden="true"
            className="h-5 w-5"
            fill="currentColor"
          >
            <path d="M21.35 11.1h-9.18v2.92h5.28c-.23 1.5-1.78 4.4-5.28 4.4-3.18 0-5.78-2.63-5.78-5.86s2.6-5.86 5.78-5.86c1.81 0 3.02.77 3.71 1.43l2.53-2.45C16.85 3.5 14.67 2.5 12.17 2.5 6.99 2.5 2.75 6.74 2.75 11.96s4.24 9.46 9.42 9.46c5.41 0 8.98-3.8 8.98-9.17 0-.62-.06-1.09-.2-1.55z" />
          </svg>
          {mode === "login" ? "Continue with Google" : "Sign up with Google"}
        </button>

        <p className="mt-4 text-center text-sm text-gray-400">
          {mode === "login" ? (
            <>
              No account?{" "}
              <button
                type="button"
                onClick={switchMode}
                className="underline underline-offset-4 hover:text-gray-200"
              >
                Sign up
              </button>
            </>
          ) : (
            <>
              Already have an account?{" "}
              <button
                type="button"
                onClick={switchMode}
                className="underline underline-offset-4 hover:text-gray-200"
              >
                Log in
              </button>
            </>
          )}
        </p>
      </motion.div>

      {/* Lottie sits UNDER the card in normal flow */}
      {animationData && (
        <div className="w-full max-w-md mt-8">
          <Lottie
            animationData={animationData}
            loop
            autoplay
            aria-hidden="true"
          />
        </div>
      )}
    </div>
  );
}
