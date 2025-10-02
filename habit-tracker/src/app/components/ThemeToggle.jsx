"use client";

import { useTheme } from "@/hooks/useTheme";
import { Sun, Moon } from "lucide-react";

export default function ThemeToggle() {
  const { theme, toggleTheme, mounted } = useTheme();

  if (!mounted) {
    return (
      <div className="w-10 h-10 rounded-lg bg-gray-800 animate-pulse" />
    );
  }

  return (
    <button
      onClick={toggleTheme}
      className="w-10 h-10 rounded-lg bg-gray-800/50 hover:bg-gray-700/50 flex items-center justify-center transition-all duration-200 backdrop-blur-sm border border-gray-700/50"
      aria-label={`Switch to ${theme === 'dark' ? 'light' : 'dark'} mode`}
    >
      {theme === 'dark' ? (
        <Sun className="w-5 h-5 text-yellow-400" />
      ) : (
        <Moon className="w-5 h-5 text-blue-400" />
      )}
    </button>
  );
}
