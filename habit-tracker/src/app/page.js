"use client";

import { useEffect, useRef } from "react";
import anime from "animejs";
import { useAuth } from "@/hooks/useAuth"; // Import useAuth hook
import { useRouter } from "next/navigation"; // Import Next.js router

export default function Home() {
  const gridRef = useRef(null);
  const { user, loginWithGoogle } = useAuth(); // Get user state & login function
  const router = useRouter(); // Get Next.js router

  // Redirect if logged in
  useEffect(() => {
    if (user) {
      router.push("/dashboard"); // Redirect to dashboard
    }
  }, [user, router]); // Run when `user` changes

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
    <div className="relative min-h-screen flex flex-col justify-start items-start bg-gray-900 text-white p-8">
      {/* Main Content */}
      <main className="z-10 mt-10">
        <h1 className="text-4xl md:text-4xl font-bold text-white">
          Happily track your habits daily with Habify
        </h1>
        <p className="mt-4 text-2xl text-gray-300">
          Build consistency and improve your routine.
        </p>

        {/* "Get Started" button now logs in and redirects */}
        <button
          onClick={loginWithGoogle} // Calls Google OAuth login
          className="mt-6 bg-blue-600 text-white py-2 px-6 rounded-lg shadow-lg transition-transform duration-300 transform hover:scale-105 hover:bg-blue-700"
        >
          Get Started
        </button>
        <p className="text-gray-400 opacity-50 text-xs mt-4">
          Free to use. No credit card required.
        </p>
      </main>

      {/* Animated Grid Positioned at Bottom-Right */}
      <div className="absolute bottom-20 right-0 p-4">
        <div ref={gridRef} className="staggering-grid grid grid-cols-12 gap-2">
          {Array.from({ length: 36 }).map((_, index) => (
            <div
              key={index}
              className="el w-6 h-6 bg-blue-500 rounded-md opacity-50"
            ></div>
          ))}
        </div>
      </div>
    </div>
  );
}
