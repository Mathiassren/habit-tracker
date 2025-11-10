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
    <div className={`flex items-center ${className}`}>
      {/* Logo Text */}
      <div className="flex flex-col">
        <h1 className={`font-bold bg-gradient-to-r from-indigo-400 via-blue-400 to-cyan-400 bg-clip-text text-transparent ${currentSize.text}`}>
          Rytmo
        </h1>
        {size === "lg" && (
          <p className="text-xs text-gray-400 font-medium -mt-1">Build Better Habits</p>
        )}
      </div>
    </div>
  );
}

