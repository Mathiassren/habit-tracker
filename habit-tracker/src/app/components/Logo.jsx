"use client";

import Image from "next/image";

export default function Logo({ size = "md", className = "" }) {
  const sizes = {
    sm: { 
      container: "w-8 h-8", 
      text: "text-sm",
      imageSize: 24
    },
    md: { 
      container: "w-12 h-12", 
      text: "text-lg",
      imageSize: 32
    },
    lg: { 
      container: "w-16 h-16", 
      text: "text-xl",
      imageSize: 48
    }
  };

  const currentSize = sizes[size];

  return (
    <div className={`flex items-center gap-3 ${className}`}>
      {/* Logo Icon */}
      <div className={`${currentSize.container} rounded-xl bg-gradient-to-br from-purple-600 to-purple-800 shadow-lg flex items-center justify-center overflow-hidden`}>
        <svg
          viewBox="0 0 24 24"
          fill="none"
          className="w-2/3 h-2/3 text-white"
        >
          {/* Modern Habit Tracking Logo */}
          {/* Progress bars representing habits */}
          <rect x="3" y="8" width="3" height="8" rx="1.5" fill="currentColor" opacity="0.8" />
          <rect x="7" y="6" width="3" height="10" rx="1.5" fill="currentColor" opacity="0.9" />
          <rect x="11" y="4" width="3" height="12" rx="1.5" fill="currentColor" />
          <rect x="15" y="7" width="3" height="9" rx="1.5" fill="currentColor" opacity="0.7" />
          
          {/* Checkmark overlay for completed habits */}
          <path
            d="M6 10l1.5 1.5L10 8"
            stroke="currentColor"
            strokeWidth="1.5"
            strokeLinecap="round"
            strokeLinejoin="round"
            fill="none"
            opacity="0.9"
          />
          <path
            d="M14 9l1.5 1.5L18 7"
            stroke="currentColor"
            strokeWidth="1.5"
            strokeLinecap="round"
            strokeLinejoin="round"
            fill="none"
            opacity="0.9"
          />
          
          {/* Sparkle effect for motivation */}
          <circle cx="5" cy="5" r="0.8" fill="currentColor" opacity="0.6" />
          <circle cx="19" cy="5" r="0.6" fill="currentColor" opacity="0.8" />
          <circle cx="12" cy="2" r="0.5" fill="currentColor" opacity="0.7" />
        </svg>
      </div>

      {/* Logo Text */}
      {size !== "sm" && (
        <div className="flex flex-col">
          <h1 className={`font-bold text-white ${currentSize.text}`}>
            Habify
          </h1>
          {size === "lg" && (
            <p className="text-xs text-gray-400 font-medium -mt-1">Build Better Habits</p>
          )}
        </div>
      )}
    </div>
  );
}

