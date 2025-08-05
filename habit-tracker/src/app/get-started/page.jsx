"use client";

import { useState } from "react";
import { supabase } from "@/services/supabase";
import { FcGoogle } from "react-icons/fc";

const AuthPage = () => {
  const [isSignUp, setIsSignUp] = useState(false); // Toggle between Login and Sign-Up
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [confirmPassword, setConfirmPassword] = useState("");
  const [message, setMessage] = useState("");

  // Handle Login
  const handleLogin = async () => {
    const { error } = await supabase.auth.signInWithPassword({
      email,
      password,
    });

    if (error) {
      setMessage(error.message);
    } else {
      setMessage("Logged in successfully!");
    }
  };

  // Handle Sign Up
  const handleSignUp = async () => {
    if (!email || !password) {
      setMessage("Please fill in all fields.");
      return;
    }

    if (password !== confirmPassword) {
      setMessage("Passwords do not match.");
      return;
    }

    const { error } = await supabase.auth.signUp({
      email,
      password,
    });

    if (error) {
      setMessage(error.message);
    } else {
      setMessage("Sign up successful! Please check your email.");
      setIsSignUp(false); // Redirect to Login after sign-up
    }
  };

  // Google OAuth
  const handleGoogleLogin = async () => {
    const { error } = await supabase.auth.signInWithOAuth({
      provider: "google",
    });

    if (error) {
      setMessage("Google login failed.");
    }
  };

  return (
    <div className="min-h-screen flex items-center justify-center bg-[#0E0B12] p-4">
      <div className="w-full max-w-md bg-[#1A161D] p-6 rounded-lg border border-[#625D66] shadow-lg">
        {/* Logo */}
        <div className="text-center mb-6">
          <h1 className="text-3xl font-bold text-white">Habify</h1>
        </div>

        {/* Title */}
        <h2 className="text-2xl font-bold text-white mb-4">
          {isSignUp ? "Sign up" : "Log in"}
        </h2>

        <p className="text-gray-400 mb-4">
          {isSignUp ? "Already have an account?" : "Don't have an account?"}{" "}
          <button
            className="text-purple-400 hover:underline"
            onClick={() => {
              setIsSignUp(!isSignUp);
              setMessage("");
            }}
          >
            {isSignUp ? "Log in" : "Sign up"}
          </button>
        </p>

        {/* Email Input */}
        <div className="mb-4">
          <label className="text-gray-300 block mb-1">Email:</label>
          <input
            type="email"
            placeholder="you@example.com"
            className="w-full p-2 rounded bg-gray-800 text-white border border-gray-700 focus:outline-none focus:ring-2 focus:ring-purple-500"
            value={email}
            onChange={(e) => setEmail(e.target.value)}
          />
        </div>

        {/* Password Input */}
        <div className="mb-4">
          <label className="text-gray-300 block mb-1">
            Password:{" "}
            {!isSignUp && (
              <a
                href="/forgot-password"
                className="text-purple-400 text-sm hover:underline float-right"
              >
                Forgot password?
              </a>
            )}
          </label>
          <input
            type="password"
            placeholder="Your password"
            className="w-full p-2 rounded bg-gray-800 text-white border border-gray-700 focus:outline-none focus:ring-2 focus:ring-purple-500"
            value={password}
            onChange={(e) => setPassword(e.target.value)}
          />
        </div>

        {/* Confirm Password (Sign Up Only) */}
        {isSignUp && (
          <div className="mb-4">
            <label className="text-gray-300 block mb-1">
              Confirm Password:
            </label>
            <input
              type="password"
              placeholder="Confirm your password"
              className="w-full p-2 rounded bg-gray-800 text-white border border-gray-700 focus:outline-none focus:ring-2 focus:ring-purple-500"
              value={confirmPassword}
              onChange={(e) => setConfirmPassword(e.target.value)}
            />
          </div>
        )}

        {/* Primary Button */}
        <button
          onClick={isSignUp ? handleSignUp : handleLogin}
          className="w-full bg-purple-600 hover:bg-purple-700 text-white py-2 rounded mb-4"
        >
          {isSignUp ? "Sign up" : "Log in"}
        </button>

        {/* OR Divider */}
        <div className="flex items-center mb-4">
          <div className="flex-grow h-px bg-gray-600"></div>
          <span className="px-2 text-gray-400">OR</span>
          <div className="flex-grow h-px bg-gray-600"></div>
        </div>

        {/* Google Login */}
        <button
          onClick={handleGoogleLogin}
          className="w-full flex items-center justify-center bg-gray-800 hover:bg-gray-700 text-white py-2 rounded"
        >
          <FcGoogle className="text-2xl mr-2" />
          Continue with Google
        </button>

        {/* Message */}
        {message && <p className="text-red-400 text-center mt-4">{message}</p>}
      </div>
    </div>
  );
};

export default AuthPage;
