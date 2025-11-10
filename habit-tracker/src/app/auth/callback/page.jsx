// src/app/auth/callback/page.jsx
"use client";

import { useEffect, useState } from "react";
import { useRouter } from "next/navigation";
import { motion, AnimatePresence } from "framer-motion";
import { supabase } from "@/services/supabase";
import Logo from "@/app/components/Logo";

export default function OAuthCallback() {
  const router = useRouter();
  const [status, setStatus] = useState("processing"); // "processing" | "success" | "error"
  const [showContent, setShowContent] = useState(false);

  useEffect(() => {
    // Show content after a brief delay
    const contentTimer = setTimeout(() => {
      setShowContent(true);
    }, 200);

    (async () => {
      try {
        // Handle deep link callback from mobile app
        // If we're in Capacitor and the URL has the custom scheme, convert it to https
        let callbackUrl = window.location.href;
        if (typeof window !== 'undefined' && window.Capacitor) {
          // Replace custom scheme with https for Supabase
          callbackUrl = callbackUrl.replace(/^com\.rytmo\.app:\/\//, 'https://habify1-5lwwsyfgu-mathiassrens-projects.vercel.app/');
        }

        // Optional debug: confirm PKCE is present
        // console.log("hasVerifier?", !!localStorage.getItem("sb-pkce-code-verifier"));

        // Keep status as "processing" while authenticating
        const { data, error } = await supabase.auth.exchangeCodeForSession(
          callbackUrl
        );

        // Check if we actually have a session (even if error is present, session might still exist)
        const { data: { session } } = await supabase.auth.getSession();
        
        // Only show error if there's NO session AND there's an error
        if (error && !session && !data?.session) {
          // Wait a bit to ensure it's not a transient error
          await new Promise(resolve => setTimeout(resolve, 300));
          
          // Final check - if still no session, it's a real error
          const { data: { session: finalSession } } = await supabase.auth.getSession();
          if (!finalSession) {
            setStatus("error");
            setTimeout(() => {
              router.replace("/?auth=error");
            }, 2000);
            return;
          }
        }

        // If we have a session (either from exchangeCodeForSession or getSession), success!
        if (session || data?.session) {
          setStatus("success");
        } else {
          // No session and no error? Keep processing
          // This shouldn't happen, but just in case
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

        // Show success animation briefly before redirecting
        setTimeout(() => {
          router.replace("/dashboard");
        }, 1500);
      } catch (err) {
        // Only show error if we're still in processing state (not already succeeded)
        // This prevents showing error if something fails after success
        setStatus((currentStatus) => {
          if (currentStatus === "processing") {
            return "error";
          }
          return currentStatus;
        });
        
        // Double-check session before showing error
        const { data: { session } } = await supabase.auth.getSession();
        if (!session) {
          setTimeout(() => {
            router.replace("/?auth=error");
          }, 2000);
        } else {
          // Session exists, so authentication actually succeeded
          setStatus("success");
          setTimeout(() => {
            router.replace("/dashboard");
          }, 1500);
        }
      }
    })();

    return () => clearTimeout(contentTimer);
  }, [router]);

  return (
    <div className="fixed inset-0 z-[99999] flex items-center justify-center bg-gradient-to-br from-slate-950 via-indigo-950/20 to-slate-950">
      {/* Background Pattern */}
      <div className="absolute inset-0 bg-[radial-gradient(circle_at_1px_1px,_rgba(99,102,241,0.15)_1px,_transparent_0)] bg-[size:24px_24px] opacity-40"></div>
      <div className="absolute inset-0 bg-gradient-to-br from-indigo-900/10 via-transparent to-cyan-900/10"></div>
      
      {/* Animated gradient orbs */}
      <motion.div
        className="absolute top-1/4 left-1/4 w-96 h-96 bg-indigo-500/20 rounded-full blur-3xl"
        animate={{
          scale: [1, 1.2, 1],
          opacity: [0.3, 0.5, 0.3],
        }}
        transition={{
          duration: 4,
          repeat: Infinity,
          ease: "easeInOut",
        }}
      />
      <motion.div
        className="absolute bottom-1/4 right-1/4 w-96 h-96 bg-cyan-500/20 rounded-full blur-3xl"
        animate={{
          scale: [1, 1.2, 1],
          opacity: [0.3, 0.5, 0.3],
        }}
        transition={{
          duration: 4,
          repeat: Infinity,
          ease: "easeInOut",
          delay: 1,
        }}
      />

      {/* Content */}
      <AnimatePresence mode="wait">
        {showContent && (
          <motion.div
            key={status}
            initial={{ opacity: 0, scale: 0.8, y: 20 }}
            animate={{ opacity: 1, scale: 1, y: 0 }}
            exit={{ opacity: 0, scale: 0.9 }}
            transition={{ duration: 0.6, ease: "easeOut" }}
            className="relative z-10 flex flex-col items-center gap-6"
          >
            {/* Logo/Icon with glow */}
            <motion.div
              animate={{
                scale: status === "success" ? [1, 1.1, 1] : [1, 1.05, 1],
              }}
              transition={{
                duration: status === "success" ? 0.6 : 2,
                repeat: status === "success" ? 0 : Infinity,
                ease: "easeInOut",
              }}
              className="relative"
            >
              {/* Glow effect */}
              <div className={`absolute inset-0 bg-gradient-to-r from-indigo-500 via-blue-500 to-cyan-500 rounded-2xl blur-2xl opacity-50 ${status === "success" ? "" : "animate-pulse"}`}></div>
              
              {/* Icon container */}
              <div className="relative bg-gradient-to-br from-slate-800/40 via-slate-800/30 to-slate-800/40 backdrop-blur-xl rounded-2xl border border-slate-700/50 shadow-2xl shadow-indigo-900/20 p-8">
                {status === "success" ? (
                  <motion.div
                    initial={{ scale: 0 }}
                    animate={{ scale: 1 }}
                    transition={{ type: "spring", stiffness: 200, damping: 15 }}
                    className="w-16 h-16 rounded-full bg-gradient-to-r from-emerald-500 to-green-500 flex items-center justify-center"
                  >
                    <svg className="w-10 h-10 text-white" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={3} d="M5 13l4 4L19 7" />
                    </svg>
                  </motion.div>
                ) : status === "error" ? (
                  <motion.div
                    initial={{ scale: 0 }}
                    animate={{ scale: 1 }}
                    transition={{ type: "spring", stiffness: 200, damping: 15 }}
                    className="w-16 h-16 rounded-full bg-gradient-to-r from-red-500 to-rose-500 flex items-center justify-center"
                  >
                    <svg className="w-10 h-10 text-white" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={3} d="M6 18L18 6M6 6l12 12" />
                    </svg>
                  </motion.div>
                ) : (
                  <Logo size="lg" />
                )}
              </div>
            </motion.div>

            {/* Loading dots - only show when processing */}
            {status === "processing" && (
              <motion.div
                className="flex items-center gap-2"
                initial={{ opacity: 0 }}
                animate={{ opacity: 1 }}
                transition={{ delay: 0.4 }}
              >
                {[0, 1, 2].map((i) => (
                  <motion.div
                    key={i}
                    className="w-2 h-2 bg-indigo-400 rounded-full"
                    animate={{
                      scale: [1, 1.5, 1],
                      opacity: [0.5, 1, 0.5],
                    }}
                    transition={{
                      duration: 1,
                      repeat: Infinity,
                      delay: i * 0.2,
                      ease: "easeInOut",
                    }}
                  />
                ))}
              </motion.div>
            )}

            {/* Text */}
            <motion.p
              initial={{ opacity: 0, y: 10 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: 0.6 }}
              className={`text-lg font-semibold ${
                status === "success" ? "text-emerald-400" : 
                status === "error" ? "text-red-400" : 
                "text-white"
              }`}
            >
              {status === "success" 
                ? "Welcome back!" 
                : status === "error"
                ? "Authentication failed"
                : "Signing you in…"}
            </motion.p>
            <motion.p
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              transition={{ delay: 0.8 }}
              className="text-sm text-slate-400"
            >
              {status === "success"
                ? "Redirecting to your dashboard..."
                : status === "error"
                ? "Please try again"
                : "Please wait while we complete your sign-in"}
            </motion.p>
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  );
}
