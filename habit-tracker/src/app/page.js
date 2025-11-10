"use client";

import { useEffect, useState } from "react";
import { motion } from "framer-motion";
import Lottie from "lottie-react";
import { useAuth } from "@/hooks/useAuth";
import { useRouter } from "next/navigation";
import Link from "next/link";
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
  const [confirmPassword, setConfirmPassword] = useState("");
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
        // ⬇️ change: grab data.session, then sync cookies server-side
        const { data, error } = await supabase.auth.signInWithPassword({
          email,
          password,
        });
        if (error) throw error;

        await fetch("/auth/refresh", {
          method: "POST",
          headers: { "content-type": "application/json" },
          body: JSON.stringify({ event: "SIGNED_IN", session: data.session }),
        });

        // redirect after cookies are set so SSR/nav are correct
        window.location.href = "/dashboard";
        return; // ensure we don't run the rest of the block
      } else {
        // Signup mode - validate password confirmation
        if (password !== confirmPassword) {
          setAuthError("Passwords do not match. Please try again.");
          setLoading(false);
          return;
        }
        if (password.length < 6) {
          setAuthError("Password must be at least 6 characters long.");
          setLoading(false);
          return;
        }
        const { error } = await supabase.auth.signUp({ email, password });
        if (error) throw error;
        setInfoMsg("Check your inbox to confirm your email before logging in.");
        // Clear form after successful signup
        setPassword("");
        setConfirmPassword("");
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
    setPassword("");
    setConfirmPassword("");
  }

  return (
    <div className="min-h-screen w-full bg-gradient-to-br from-slate-950 via-indigo-950/20 to-slate-950 flex flex-col items-center justify-center px-6 relative overflow-hidden" style={{ paddingTop: 'env(safe-area-inset-top)', paddingBottom: 'env(safe-area-inset-bottom)' }}>
      {/* Skip to main content link for accessibility */}
      <a href="#main-content" className="skip-to-main">
        Skip to main content
      </a>
      
      {/* Background Pattern */}
      <div className="absolute inset-0 bg-[radial-gradient(circle_at_1px_1px,_rgba(99,102,241,0.15)_1px,_transparent_0)] bg-[size:24px_24px] opacity-40"></div>
      <div className="absolute inset-0 bg-gradient-to-br from-indigo-900/10 via-transparent to-cyan-900/10"></div>
      
      {/* Animated gradient orbs */}
      <div className="absolute top-1/4 left-1/4 w-96 h-96 bg-indigo-500/20 rounded-full blur-3xl animate-pulse"></div>
      <div className="absolute bottom-1/4 right-1/4 w-96 h-96 bg-cyan-500/20 rounded-full blur-3xl animate-pulse" style={{ animationDelay: '1s' }}></div>

      {/* Title */}
      <motion.div
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.6, ease: "easeOut" }}
        className="mb-8 text-center relative z-10"
      >
        <h1 className="text-6xl font-extrabold tracking-wide mb-3">
          <span className="bg-gradient-to-r from-indigo-400 via-blue-400 to-cyan-400 bg-clip-text text-transparent">
            Rytmo
          </span>
        </h1>
        <p className="text-lg text-slate-400 font-medium">
          Small steps. Real progress.
        </p>
      </motion.div>

      {/* Auth Card (centered) */}
      <motion.div
        id="main-content"
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.5, delay: 0.1, ease: "easeOut" }}
        className="w-full max-w-md bg-gradient-to-br from-slate-800/40 via-slate-800/30 to-slate-800/40 backdrop-blur-xl rounded-2xl border border-slate-700/50 shadow-2xl shadow-indigo-900/20 p-8 relative z-10"
      >
        {/* Mode Toggle */}
        <div className="flex items-center gap-2 mb-6 p-1 bg-slate-700/30 rounded-xl border border-slate-600/30">
          <button
            type="button"
            onClick={() => {
              if (mode !== "login") switchMode();
            }}
            className={`flex-1 py-2 px-4 rounded-lg text-sm font-medium transition-all duration-300 ${
              mode === "login"
                ? "bg-gradient-to-r from-indigo-600 via-blue-600 to-cyan-600 text-white shadow-lg shadow-indigo-500/30"
                : "text-slate-400 hover:text-white"
            }`}
          >
            Login
          </button>
          <button
            type="button"
            onClick={() => {
              if (mode !== "signup") switchMode();
            }}
            className={`flex-1 py-2 px-4 rounded-lg text-sm font-medium transition-all duration-300 ${
              mode === "signup"
                ? "bg-gradient-to-r from-indigo-600 via-blue-600 to-cyan-600 text-white shadow-lg shadow-indigo-500/30"
                : "text-slate-400 hover:text-white"
            }`}
          >
            Sign Up
          </button>
        </div>

        <form onSubmit={handleSubmit} className="space-y-4">
          <div>
            <label htmlFor="email" className="mb-2 block text-sm font-medium text-slate-300">
              Email Address
            </label>
            <input
              id="email"
              type="email"
              required
              value={email}
              onChange={(e) => setEmail(e.target.value)}
              className="w-full rounded-xl border border-slate-600/30 bg-slate-700/30 px-4 py-3 text-sm text-white placeholder-slate-400 outline-none focus:border-indigo-500 focus:ring-2 focus:ring-indigo-500/50 transition-all"
              placeholder="you@example.com"
              autoComplete="email"
              aria-invalid={!!authError}
            />
          </div>

          <div>
            <div className="mb-2 flex items-center justify-between">
              <label htmlFor="password" className="text-sm font-medium text-slate-300">
                Password
              </label>
              {mode === "login" && (
                <button
                  type="button"
                  className="text-xs text-indigo-400 hover:text-indigo-300 transition-colors font-medium"
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
              className="w-full rounded-xl border border-slate-600/30 bg-slate-700/30 px-4 py-3 text-sm text-white placeholder-slate-400 outline-none focus:border-indigo-500 focus:ring-2 focus:ring-indigo-500/50 transition-all"
              placeholder={
                mode === "signup" ? "Create a strong password (min. 6 characters)" : "Enter your password"
              }
              autoComplete={
                mode === "signup" ? "new-password" : "current-password"
              }
              aria-invalid={!!authError}
            />
          </div>

          {/* Confirm Password Field - Only shown in signup mode */}
          {mode === "signup" && (
            <div>
              <label htmlFor="confirmPassword" className="mb-2 block text-sm font-medium text-slate-300">
                Confirm Password
              </label>
              <input
                id="confirmPassword"
                type="password"
                required
                minLength={6}
                value={confirmPassword}
                onChange={(e) => setConfirmPassword(e.target.value)}
                className="w-full rounded-xl border border-slate-600/30 bg-slate-700/30 px-4 py-3 text-sm text-white placeholder-slate-400 outline-none focus:border-indigo-500 focus:ring-2 focus:ring-indigo-500/50 transition-all"
                placeholder="Confirm your password"
                autoComplete="new-password"
                aria-invalid={!!authError || (confirmPassword && password !== confirmPassword)}
              />
              {confirmPassword && password !== confirmPassword && (
                <p className="mt-2 text-xs text-red-400">Passwords do not match</p>
              )}
            </div>
          )}

          {authError && (
            <div className="rounded-xl border border-red-500/40 bg-red-500/10 px-4 py-3 text-sm text-red-300 flex items-center gap-2">
              <span>⚠️</span>
              <span>{authError}</span>
            </div>
          )}
          {infoMsg && (
            <div className="rounded-xl border border-emerald-500/40 bg-emerald-500/10 px-4 py-3 text-sm text-emerald-300 flex items-center gap-2">
              <span>✓</span>
              <span>{infoMsg}</span>
            </div>
          )}

          <button
            type="submit"
            disabled={loading}
            className="mt-4 w-full rounded-xl bg-gradient-to-r from-indigo-600 via-blue-600 to-cyan-600 hover:from-indigo-500 hover:via-blue-500 hover:to-cyan-500 px-6 py-3 text-sm font-semibold text-white shadow-lg shadow-indigo-500/30 hover:shadow-xl hover:shadow-indigo-500/50 transition-all duration-300 disabled:cursor-not-allowed disabled:opacity-50 disabled:hover:from-indigo-600 disabled:hover:via-blue-600 disabled:hover:to-cyan-600 transform hover:scale-[1.02] active:scale-[0.98]"
          >
            {loading ? (
              <motion.span 
                className="flex items-center justify-center gap-2"
                initial={{ opacity: 0 }}
                animate={{ opacity: 1 }}
                transition={{ duration: 0.3 }}
              >
                <motion.span 
                  className="w-4 h-4 border-2 border-white/30 border-t-white rounded-full"
                  animate={{ rotate: 360 }}
                  transition={{ 
                    duration: 1, 
                    repeat: Infinity, 
                    ease: "linear" 
                  }}
                />
                <motion.span
                  animate={{ 
                    opacity: [1, 0.5, 1],
                  }}
                  transition={{ 
                    duration: 1.5, 
                    repeat: Infinity,
                    ease: "easeInOut"
                  }}
                >
                  {mode === "login" ? "Signing you in…" : "Creating account…"}
                </motion.span>
              </motion.span>
            ) : (
              mode === "login" ? "Sign In" : "Create Account"
            )}
          </button>
        </form>

        <div className="relative my-6">
          <div className="absolute inset-0 flex items-center">
            <div className="w-full border-t border-slate-700/50"></div>
          </div>
          <div className="relative flex justify-center text-xs uppercase">
            <span className="bg-slate-800/40 px-4 text-slate-400 font-medium tracking-wider">Or continue with</span>
          </div>
        </div>

        <button
          onClick={loginWithGoogle}
          disabled={loading}
          className="group w-full inline-flex items-center justify-center gap-3 rounded-xl border border-slate-600/30 bg-slate-700/30 hover:bg-slate-700/50 px-6 py-3 text-sm font-medium text-white transition-all duration-300 hover:border-indigo-500/50 shadow-lg hover:shadow-indigo-500/20 disabled:cursor-not-allowed disabled:opacity-50 disabled:hover:bg-slate-700/30"
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
          <span className="group-hover:text-indigo-300 transition-colors">
            {mode === "login" ? "Continue with Google" : "Sign up with Google"}
          </span>
        </button>
      </motion.div>

      {/* Lottie Animation */}
      {animationData && (
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.6, delay: 0.3 }}
          className="w-full max-w-md mt-8 relative z-10"
        >
          <Lottie
            animationData={animationData}
            loop
            autoplay
            aria-hidden="true"
          />
        </motion.div>
      )}

      {/* Footer Links */}
      <motion.div
        initial={{ opacity: 0 }}
        animate={{ opacity: 1 }}
        transition={{ duration: 0.6, delay: 0.5 }}
        className="mt-12 relative z-10 flex flex-wrap items-center justify-center gap-4 text-sm text-slate-400"
      >
        <Link
          href="/privacy"
          className="hover:text-indigo-400 transition-colors"
        >
          Privacy Policy
        </Link>
        <span className="text-slate-600">•</span>
        <Link
          href="/terms"
          className="hover:text-indigo-400 transition-colors"
        >
          Terms of Service
        </Link>
      </motion.div>
    </div>
  );
}
