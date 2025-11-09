"use client";

import { useState, useEffect, useRef } from "react";
import { useRouter, useSearchParams } from "next/navigation";
import { supabase } from "@/services/supabase";
import { motion } from "framer-motion";
import { Lock, Mail, CheckCircle, AlertCircle } from "lucide-react";
import Link from "next/link";

export default function ResetPassword() {
  const router = useRouter();
  const searchParams = useSearchParams();
  const [mode, setMode] = useState("request"); // "request" | "reset"
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [confirmPassword, setConfirmPassword] = useState("");
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState(null);
  const [success, setSuccess] = useState(null);
  const subscriptionRef = useRef(null);

  useEffect(() => {
    // Check if we have a password reset token in the URL (hash or query params)
    const checkResetToken = async () => {
      // Guard against SSR
      if (typeof window === 'undefined') return;
      
      // Check hash parameters first (Supabase uses hash for password reset links)
      const hash = window.location.hash.substring(1);
      const hashParams = new URLSearchParams(hash);
      const accessToken = hashParams.get("access_token");
      const type = hashParams.get("type");
      const code = hashParams.get("code");
      
      // Check query parameters (fallback)
      const queryParams = new URLSearchParams(window.location.search);
      const queryToken = queryParams.get("access_token");
      const queryType = queryParams.get("type");
      const queryCode = queryParams.get("code");

      // Check if we have recovery tokens/code in URL
      const hasRecoveryToken = (accessToken && type === "recovery") || 
                                (queryToken && queryType === "recovery") ||
                                (code && type === "recovery") ||
                                (queryCode && queryType === "recovery");
      
      if (hasRecoveryToken) {
        // Set mode to reset immediately so user sees the form
        setMode("reset");
        
        // Try to exchange code/token for session
        if (code || queryCode) {
          try {
            const { data, error: exchangeError } = await supabase.auth.exchangeCodeForSession(
              window.location.href
            );
            if (exchangeError) {
              setError("Invalid or expired reset link. Please request a new password reset.");
              setMode("request");
              return;
            }
            // Clean up the URL after successful exchange
            window.history.replaceState({}, document.title, window.location.pathname);
          } catch (err) {
            setError("Invalid or expired reset link. Please request a new password reset.");
            setMode("request");
            return;
          }
        } else if (accessToken || queryToken) {
          // If we have access_token, Supabase should process it automatically
          // Listen for auth state changes to detect when session is established
          
          // Clean up any existing subscription
          if (subscriptionRef.current) {
            subscriptionRef.current.unsubscribe();
          }
          
          const { data: { subscription } } = supabase.auth.onAuthStateChange(async (event, session) => {
            if (event === 'PASSWORD_RECOVERY' || (event === 'SIGNED_IN' && session)) {
              setMode("reset");
              // Clean up the URL
              if (typeof window !== 'undefined') {
                window.history.replaceState({}, document.title, window.location.pathname);
              }
              if (subscriptionRef.current) {
                subscriptionRef.current.unsubscribe();
                subscriptionRef.current = null;
              }
            }
          });
          
          subscriptionRef.current = subscription;
          
          // Also check session after a short delay
          setTimeout(async () => {
            const { data: { session } } = await supabase.auth.getSession();
            if (session) {
              setMode("reset");
              if (typeof window !== 'undefined') {
                window.history.replaceState({}, document.title, window.location.pathname);
              }
              if (subscriptionRef.current) {
                subscriptionRef.current.unsubscribe();
                subscriptionRef.current = null;
              }
            } else {
              // If still no session after 3 seconds, show error
              setTimeout(async () => {
                const { data: { session: finalSession } } = await supabase.auth.getSession();
                if (!finalSession) {
                  setError("Could not verify reset link. Please request a new password reset.");
                  setMode("request");
                  if (subscriptionRef.current) {
                    subscriptionRef.current.unsubscribe();
                    subscriptionRef.current = null;
                  }
                }
              }, 2000);
            }
          }, 1000);
          
          // Clean up subscription after 10 seconds
          setTimeout(() => {
            if (subscriptionRef.current) {
              subscriptionRef.current.unsubscribe();
              subscriptionRef.current = null;
            }
          }, 10000);
        }
      } else {
        // Check if we already have a session (might be from a previous reset attempt)
        const { data: { session } } = await supabase.auth.getSession();
        if (session) {
          // Check if this session is from password recovery by checking URL or session metadata
          // For now, if user is on /reset page with a session, assume it's for password reset
          setMode("reset");
        }
      }
    };

    checkResetToken();
    
    // Cleanup subscription on unmount
    return () => {
      if (subscriptionRef.current) {
        subscriptionRef.current.unsubscribe();
        subscriptionRef.current = null;
      }
    };
  }, []);

  async function handleRequestReset(e) {
    e.preventDefault();
    setLoading(true);
    setError(null);
    setSuccess(null);

    if (!email) {
      setError("Please enter your email address");
      setLoading(false);
      return;
    }

    try {
      const origin = window.location.origin;
      const { error } = await supabase.auth.resetPasswordForEmail(email, {
        redirectTo: `${origin}/reset`,
      });

      if (error) throw error;

      setSuccess("Password reset link sent! Check your email for instructions.");
      setEmail("");
    } catch (err) {
      setError(err?.message || "Could not send reset email. Please try again.");
    } finally {
      setLoading(false);
    }
  }

  async function handleResetPassword(e) {
    e.preventDefault();
    setLoading(true);
    setError(null);
    setSuccess(null);

    if (!password || !confirmPassword) {
      setError("Please fill in all fields");
      setLoading(false);
      return;
    }

    if (password.length < 6) {
      setError("Password must be at least 6 characters");
      setLoading(false);
      return;
    }

    if (password !== confirmPassword) {
      setError("Passwords do not match");
      setLoading(false);
      return;
    }

    try {
      // First, check if we have a session (required for password update)
      const { data: { session }, error: sessionError } = await supabase.auth.getSession();
      
      if (sessionError || !session) {
        // If no session, try to get it from URL tokens
        const hashParams = new URLSearchParams(window.location.hash.substring(1));
        const queryParams = new URLSearchParams(window.location.search);
        
        // Supabase should have already set the session when the page loaded with the reset token
        // But if not, we need to wait for it or show an error
        const { data: { session: newSession }, error: newSessionError } = await supabase.auth.getSession();
        
        if (newSessionError || !newSession) {
          throw new Error("Invalid or expired reset link. Please request a new password reset.");
        }
      }

      // Update password (requires an active session from the reset token)
      const { error } = await supabase.auth.updateUser({
        password: password,
      });

      if (error) {
        // If error is about session, provide helpful message
        if (error.message.includes("session") || error.message.includes("token")) {
          throw new Error("Invalid or expired reset link. Please request a new password reset.");
        }
        throw error;
      }

      setSuccess("Password updated successfully! Redirecting to login...");
      
      // Sign out after password reset (security best practice)
      await supabase.auth.signOut();
      
      // Redirect to login after a short delay
      setTimeout(() => {
        router.push("/");
      }, 2000);
    } catch (err) {
      setError(err?.message || "Could not update password. Please try again.");
    } finally {
      setLoading(false);
    }
  }

  return (
    <div className="min-h-screen w-full bg-gradient-to-br from-slate-950 via-indigo-950/20 to-slate-950 flex flex-col items-center justify-center px-6 relative overflow-hidden" style={{ paddingTop: 'env(safe-area-inset-top)', paddingBottom: 'env(safe-area-inset-bottom)' }}>
      {/* Background Pattern */}
      <div className="absolute inset-0 bg-[radial-gradient(circle_at_1px_1px,_rgba(99,102,241,0.15)_1px,_transparent_0)] bg-[size:24px_24px] opacity-40"></div>
      <div className="absolute inset-0 bg-gradient-to-br from-indigo-900/10 via-transparent to-cyan-900/10"></div>
      
      {/* Animated gradient orbs */}
      <div className="absolute top-1/4 left-1/4 w-96 h-96 bg-indigo-500/20 rounded-full blur-3xl animate-pulse"></div>
      <div className="absolute bottom-1/4 right-1/4 w-96 h-96 bg-cyan-500/20 rounded-full blur-3xl animate-pulse" style={{ animationDelay: '1s' }}></div>

      {/* Content */}
      <motion.div
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.6 }}
        className="w-full max-w-md bg-gradient-to-br from-slate-800/40 via-slate-800/30 to-slate-800/40 backdrop-blur-xl rounded-2xl border border-slate-700/50 shadow-2xl shadow-indigo-900/20 p-8 relative z-10"
      >
        {/* Icon */}
        <div className="flex justify-center mb-6">
          <div className="w-16 h-16 rounded-2xl bg-gradient-to-br from-indigo-500 via-blue-500 to-cyan-500 flex items-center justify-center shadow-lg shadow-indigo-500/30">
            <Lock className="w-8 h-8 text-white" />
          </div>
        </div>

        {/* Title */}
        <h1 className="text-3xl font-bold text-center text-white mb-2">
          {mode === "request" ? "Reset Password" : "Set New Password"}
        </h1>
        <p className="text-slate-400 text-center mb-8">
          {mode === "request"
            ? "Enter your email and we'll send you a reset link"
            : "Enter your new password"}
        </p>

        {/* Request Reset Form */}
        {mode === "request" && (
          <form onSubmit={handleRequestReset} className="space-y-4">
            <div>
              <label htmlFor="email" className="mb-2 block text-sm font-medium text-slate-300">
                Email Address
              </label>
              <div className="relative">
                <Mail className="absolute left-3 top-1/2 -translate-y-1/2 w-5 h-5 text-slate-400" />
                <input
                  id="email"
                  type="email"
                  required
                  value={email}
                  onChange={(e) => setEmail(e.target.value)}
                  className="w-full pl-10 rounded-xl border border-slate-600/30 bg-slate-700/30 px-4 py-3 text-sm text-white placeholder-slate-400 outline-none focus:border-indigo-500 focus:ring-2 focus:ring-indigo-500/50 transition-all"
                  placeholder="you@example.com"
                  autoComplete="email"
                />
              </div>
            </div>

            {error && (
              <div className="rounded-xl border border-red-500/40 bg-red-500/10 px-4 py-3 text-sm text-red-300 flex items-center gap-2">
                <AlertCircle className="w-5 h-5 flex-shrink-0" />
                <span>{error}</span>
              </div>
            )}

            {success && (
              <div className="rounded-xl border border-emerald-500/40 bg-emerald-500/10 px-4 py-3 text-sm text-emerald-300 flex items-center gap-2">
                <CheckCircle className="w-5 h-5 flex-shrink-0" />
                <span>{success}</span>
              </div>
            )}

            <button
              type="submit"
              disabled={loading}
              className="w-full rounded-xl bg-gradient-to-r from-indigo-600 via-blue-600 to-cyan-600 hover:from-indigo-500 hover:via-blue-500 hover:to-cyan-500 px-6 py-3 text-sm font-semibold text-white shadow-lg shadow-indigo-500/30 hover:shadow-xl hover:shadow-indigo-500/50 transition-all duration-300 disabled:cursor-not-allowed disabled:opacity-50 transform hover:scale-[1.02] active:scale-[0.98]"
            >
              {loading ? (
                <span className="flex items-center justify-center gap-2">
                  <span className="w-4 h-4 border-2 border-white/30 border-t-white rounded-full animate-spin"></span>
                  Sending...
                </span>
              ) : (
                "Send Reset Link"
              )}
            </button>
          </form>
        )}

        {/* Reset Password Form */}
        {mode === "reset" && (
          <form onSubmit={handleResetPassword} className="space-y-4">
            <div>
              <label htmlFor="password" className="mb-2 block text-sm font-medium text-slate-300">
                New Password
              </label>
              <input
                id="password"
                type="password"
                required
                minLength={6}
                value={password}
                onChange={(e) => setPassword(e.target.value)}
                className="w-full rounded-xl border border-slate-600/30 bg-slate-700/30 px-4 py-3 text-sm text-white placeholder-slate-400 outline-none focus:border-indigo-500 focus:ring-2 focus:ring-indigo-500/50 transition-all"
                placeholder="Enter new password (min. 6 characters)"
                autoComplete="new-password"
              />
            </div>

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
                placeholder="Confirm new password"
                autoComplete="new-password"
              />
            </div>

            {error && (
              <div className="rounded-xl border border-red-500/40 bg-red-500/10 px-4 py-3 text-sm text-red-300 flex items-center gap-2">
                <AlertCircle className="w-5 h-5 flex-shrink-0" />
                <span>{error}</span>
              </div>
            )}

            {success && (
              <div className="rounded-xl border border-emerald-500/40 bg-emerald-500/10 px-4 py-3 text-sm text-emerald-300 flex items-center gap-2">
                <CheckCircle className="w-5 h-5 flex-shrink-0" />
                <span>{success}</span>
              </div>
            )}

            <button
              type="submit"
              disabled={loading}
              className="w-full rounded-xl bg-gradient-to-r from-indigo-600 via-blue-600 to-cyan-600 hover:from-indigo-500 hover:via-blue-500 hover:to-cyan-500 px-6 py-3 text-sm font-semibold text-white shadow-lg shadow-indigo-500/30 hover:shadow-xl hover:shadow-indigo-500/50 transition-all duration-300 disabled:cursor-not-allowed disabled:opacity-50 transform hover:scale-[1.02] active:scale-[0.98]"
            >
              {loading ? (
                <span className="flex items-center justify-center gap-2">
                  <span className="w-4 h-4 border-2 border-white/30 border-t-white rounded-full animate-spin"></span>
                  Updating...
                </span>
              ) : (
                "Update Password"
              )}
            </button>
          </form>
        )}

        {/* Footer Links */}
        <div className="mt-6 pt-6 border-t border-slate-700/50">
          <div className="flex flex-col items-center gap-2 text-sm">
            <Link
              href="/"
              className="text-indigo-400 hover:text-indigo-300 transition-colors"
            >
              ← Back to Login
            </Link>
          </div>
        </div>
      </motion.div>
    </div>
  );
}

