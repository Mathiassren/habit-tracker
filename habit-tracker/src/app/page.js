"use client";

import { useEffect, useRef, useState } from "react";
import anime from "animejs";
import { useAuth } from "@/hooks/useAuth";
import { useRouter } from "next/navigation";
import { supabase } from "@/services/supabase";

export default function Home() {
  const gridRef = useRef(null);
  const router = useRouter();

  // Auth API from your hook (Google login + current user)
  const { user, loginWithGoogle } = useAuth();

  // UI state
  const [mode, setMode] = useState("login"); // "login" | "signup"
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [loading, setLoading] = useState(false);
  const [authError, setAuthError] = useState(null);
  const [infoMsg, setInfoMsg] = useState(null);

  useEffect(() => {
    // Let supabase read the hash (detectSessionInUrl=true by default)
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

  // Staggered grid animation
  useEffect(() => {
    if (!gridRef.current) return;
    anime({
      targets: ".staggering-grid .el",
      scale: [
        { value: 0.5, easing: "easeOutSine", duration: 800 },
        { value: 1, easing: "easeInOutQuad", duration: 800 },
      ],
      opacity: [
        { value: 0.3, easing: "easeOutSine", duration: 800 },
        { value: 1, easing: "easeInOutQuad", duration: 800 },
      ],
      delay: anime.stagger(150, { grid: [6, 6], from: "center" }),
      loop: true,
      direction: "alternate",
    });
  }, []);

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
        // Redirect happens via useEffect(user)
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

  function switchMode() {
    setMode((m) => (m === "login" ? "signup" : "login"));
    setAuthError(null);
    setInfoMsg(null);
  }

  return (
    <div className="min-h-screen flex flex-col justify-start items-start bg-gray-900 text-white p-8">
      {/* Main Content */}
      <main className="z-10 max-w-md w-full">
        <h1 className="text-4xl font-bold text-white">
          Happily track your habits daily with Habify
        </h1>
        <p className="mt-4 text-2xl text-gray-300">
          Build consistency and improve your routine.
        </p>
        <p className="text-gray-400 opacity-50 text-xs mt-4">
          Free to use. No credit card required.
        </p>

        {/* Auth form */}
        <form onSubmit={handleSubmit} className="mt-6">
          <div className="mb-4">
            <label htmlFor="email" className="block mb-2 text-sm text-gray-300">
              Email
            </label>
            <input
              id="email"
              type="email"
              required
              value={email}
              onChange={(e) => setEmail(e.target.value)}
              className="w-full rounded-sm border border-gray-600 bg-transparent px-3 py-2 outline-none focus:border-purple-500"
              placeholder="you@example.com"
              autoComplete="email"
              aria-invalid={!!authError}
            />
          </div>

          <div className="mb-2">
            <div className="flex items-center justify-between mb-2">
              <label htmlFor="password" className="text-sm text-gray-300">
                Password
              </label>
              {mode === "login" && (
                <button
                  type="button"
                  className="text-xs underline underline-offset-4 text-gray-400 hover:text-gray-200"
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
              className="w-full rounded-sm border border-gray-600 bg-transparent px-3 py-2 outline-none focus:border-purple-500"
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
            <p className="mt-3 text-sm text-red-400" role="alert">
              {authError}
            </p>
          )}
          {infoMsg && (
            <p className="mt-3 text-sm text-emerald-400" role="status">
              {infoMsg}
            </p>
          )}

          <button
            type="submit"
            disabled={loading}
            className="mt-6 w-full bg-blue-600 disabled:opacity-60 disabled:cursor-not-allowed text-white py-2 px-6 rounded-lg shadow-lg transition-transform duration-300 transform hover:scale-105 hover:bg-blue-700"
          >
            {loading
              ? mode === "login"
                ? "Logging in..."
                : "Creating account..."
              : mode === "login"
              ? "Login"
              : "Create Account"}
          </button>
        </form>

        {/* Divider */}
        <div className="flex items-center my-4">
          <div className="flex-grow border-t border-gray-700"></div>
          <span className="mx-3 text-gray-400">OR</span>
          <div className="flex-grow border-t border-gray-700"></div>
        </div>

        {/* Google OAuth */}
        <button
          onClick={loginWithGoogle}
          className="w-full flex items-center justify-center gap-3 border border-gray-600 text-white py-2 px-6 rounded-lg shadow-lg transition-transform duration-300 transform hover:scale-105 hover:bg-gray-800"
          aria-label={
            mode === "login" ? "Continue with Google" : "Sign up with Google"
          }
        >
          <svg
            className="w-5 h-5"
            viewBox="0 0 533.5 544.3"
            xmlns="http://www.w3.org/2000/svg"
            aria-hidden="true"
          >
            <path
              fill="#4285F4"
              d="M533.5 278.4c0-17.4-1.6-34-4.6-50.2H272v95.1h146.9c-6.4 34.3-25.4 63.4-54.2 82.9l87.6 68c51.1-47.1 81.2-116.4 81.2-195.8z"
            />
            <path
              fill="#34A853"
              d="M272 544.3c73.5 0 135-24.3 180-66l-87.6-68c-24.4 16.4-55.5 26-92.4 26-71.1 0-131.3-48-152.8-112.4l-90.5 69.9c43.9 87.5 135.3 150.5 243.3 150.5z"
            />
            <path
              fill="#FBBC05"
              d="M119.2 323.9c-10.2-30.5-10.2-63.5 0-94l-90.5-69.9C-21.8 212.7-21.8 331.6 28.7 415.8l90.5-69.9z"
            />
            <path
              fill="#EA4335"
              d="M272 107.7c39.9 0 75.8 13.7 104.1 40.8l77.8-77.8C407 24.2 345.5 0 272 0 164 0 72.6 63 28.7 152.1l90.5 69.9C140.7 155.7 200.9 107.7 272 107.7z"
            />
          </svg>
          {mode === "login" ? "Continue with Google" : "Sign up with Google"}
        </button>

        {/* Mode switch text */}
        <p className="mt-4 text-sm text-gray-400">
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
      </main>

      {/* Animated Grid */}
      <div className="mt-20">
        <div ref={gridRef} className="staggering-grid grid grid-cols-12 gap-2">
          {Array.from({ length: 36 }).map((_, index) => (
            <div
              key={index}
              className="el w-6 h-6 bg-blue-500 rounded-md opacity-50"
            />
          ))}
        </div>
      </div>
    </div>
  );
}
