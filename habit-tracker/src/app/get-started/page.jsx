"use client";

import { useEffect, useRef } from "react";
import anime from "animejs";
import { useAuth } from "@/hooks/useAuth"; // <-- your hook exactly as you sent
import { useRouter } from "next/navigation";

import AuthForm from "@/app/components/AuthForm";
import GoogleButton from "@/app/components/GoogleButton";

import { useAuthForm } from "@/hooks/useAuthForm";

export default function Home() {
  const gridRef = useRef(null);
  const router = useRouter();

  // From your useAuth: exposes { user, loginWithGoogle }
  const { user, loginWithGoogle } = useAuth();

  // Local email/password form state & handlers
  const {
    mode,
    email,
    password,
    loading,
    authError,
    infoMsg,
    setEmail,
    setPassword,
    handleSubmit,
    handleForgotPassword,
    switchMode,
  } = useAuthForm();

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

  return (
    <div className="min-h-screen flex flex-col justify-start items-start bg-gray-900 text-white p-8">
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

        {/* Email/password auth */}
        <AuthForm
          mode={mode}
          email={email}
          password={password}
          setEmail={setEmail}
          setPassword={setPassword}
          loading={loading}
          authError={authError}
          infoMsg={infoMsg}
          onSubmit={handleSubmit}
          onForgotPassword={handleForgotPassword}
          onSwitchMode={switchMode}
        />

        {/* Divider */}
        <div className="flex items-center my-4">
          <div className="flex-grow border-t border-gray-700"></div>
          <span className="mx-3 text-gray-400">OR</span>
          <div className="flex-grow border-t border-gray-700"></div>
        </div>

        {/* Google OAuth – from your useAuth */}
        <GoogleButton
          label={
            mode === "login" ? "Continue with Google" : "Sign up with Google"
          }
          onClick={loginWithGoogle}
        />
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
