"use client";

import { useAuth } from "@/hooks/useAuth";
import { useState, useEffect, useRef } from "react";
import { Menu, X, Home, BarChart3, Calendar, Settings, Brain, BookOpen } from "lucide-react";
import Link from "next/link";
import Logo from "./Logo";

export default function Nav() {
  const { user, loginWithGoogle, logout } = useAuth();
  const [isOpen, setIsOpen] = useState(false);
  const menuRef = useRef(null);

  const toggleMenu = () => setIsOpen(!isOpen);
  const closeMenu = () => setIsOpen(false);

  // Close menu when clicking outside
  useEffect(() => {
    const handleClickOutside = (event) => {
      if (menuRef.current && !menuRef.current.contains(event.target)) {
        closeMenu();
      }
    };

    if (isOpen) {
      document.addEventListener('mousedown', handleClickOutside);
    }

    return () => {
      document.removeEventListener('mousedown', handleClickOutside);
    };
  }, [isOpen]);

  return (
    <nav className="bg-white/5 backdrop-blur-xl border-b border-white/10 shadow-2xl relative z-[9999] w-full" style={{ position: 'relative', zIndex: 9999 }}>
      <div className="max-w-7xl mx-auto px-6 py-4">
        <div className="flex justify-between items-center">
          {/* Logo */}
          <Link 
            href={user ? "/dashboard" : "/"} 
            className="hover:scale-105 transition-all duration-300 focus:outline-none focus:ring-2 focus:ring-purple-500 focus:ring-opacity-50 rounded-lg"
            aria-label="Habify - Go to dashboard"
          >
            <div className="md:hidden">
              <Logo size="sm" />
            </div>
            <div className="hidden md:block">
              <Logo size="md" />
            </div>
          </Link>

          {/* Desktop Navigation */}
          {user && (
            <div className="hidden md:flex items-center gap-6">
              <Link href="/dashboard" className="text-gray-300 hover:text-white transition-colors">
                Home
              </Link>
              <Link href="/heatmap" className="text-gray-300 hover:text-white transition-colors">
                Dashboard
              </Link>
              <Link href="/dailylog" className="text-gray-300 hover:text-white transition-colors">
                Daily Log
              </Link>
              <Link href="/preferences" className="text-gray-300 hover:text-white transition-colors">
                Preferences
              </Link>
              <Link href="/workbench" className="text-gray-300 hover:text-white transition-colors">
                AI Planner
              </Link>
              <Link href="/journal" className="text-gray-300 hover:text-white transition-colors">
                Journal
              </Link>
              
              {/* User Menu */}
              <div className="flex items-center gap-4 ml-4 pl-4 border-l border-gray-700">
                <img
                  src={user?.user_metadata?.avatar_url || "/default-avatar.png"}
                  alt="Profile"
                  className="w-8 h-8 rounded-full"
                  referrerPolicy="no-referrer"
                />
                <button
                  onClick={logout}
                  className="text-red-400 hover:text-red-300 transition-colors text-sm"
                >
                  Logout
                </button>
              </div>
            </div>
          )}

          {/* Mobile Menu Button */}
          {user ? (
            <button
              onClick={toggleMenu}
              className="md:hidden w-10 h-10 flex items-center justify-center text-gray-300 hover:text-white"
              aria-label="Toggle menu"
            >
              {isOpen ? <X size={24} /> : <Menu size={24} />}
            </button>
          ) : (
            <button
              onClick={loginWithGoogle}
              className="bg-purple-600 hover:bg-purple-500 text-white px-6 py-2 rounded-lg transition-colors"
            >
              Login
            </button>
          )}
        </div>

        {/* Mobile Menu */}
        {user && isOpen && (
          <div
            ref={menuRef}
            className="md:hidden absolute top-full left-0 right-0 bg-gray-900/95 backdrop-blur-xl border-b border-white/10 shadow-2xl z-50"
          >
            <div className="px-6 py-4 space-y-2">
              <Link
                href="/dashboard"
                onClick={closeMenu}
                className="block py-3 px-4 text-gray-300 hover:text-white hover:bg-white/5 rounded-lg transition-all"
              >
                Home
              </Link>
              <Link
                href="/heatmap"
                onClick={closeMenu}
                className="block py-3 px-4 text-gray-300 hover:text-white hover:bg-white/5 rounded-lg transition-all"
              >
                Dashboard
              </Link>
              <Link
                href="/dailylog"
                onClick={closeMenu}
                className="block py-3 px-4 text-gray-300 hover:text-white hover:bg-white/5 rounded-lg transition-all"
              >
                Daily Log
              </Link>
              <Link
                href="/preferences"
                onClick={closeMenu}
                className="block py-3 px-4 text-gray-300 hover:text-white hover:bg-white/5 rounded-lg transition-all"
              >
                Preferences
              </Link>
              <Link
                href="/workbench"
                onClick={closeMenu}
                className="block py-3 px-4 text-gray-300 hover:text-white hover:bg-white/5 rounded-lg transition-all"
              >
                AI Planner
              </Link>
              <Link
                href="/journal"
                onClick={closeMenu}
                className="block py-3 px-4 text-gray-300 hover:text-white hover:bg-white/5 rounded-lg transition-all"
              >
                Journal
              </Link>
              
              {/* Mobile User Section */}
              <div className="border-t border-gray-700 pt-4 mt-4">
                <div className="flex items-center gap-3 mb-4">
                  <img
                    src={user?.user_metadata?.avatar_url || "/default-avatar.png"}
                    alt="Profile"
                    className="w-10 h-10 rounded-full"
                    referrerPolicy="no-referrer"
                  />
                  <div>
                    <p className="text-white text-sm">
                      {user?.user_metadata?.full_name || "User"}
                    </p>
                    <p className="text-gray-400 text-xs">{user?.email}</p>
                  </div>
                </div>
                <button
                  onClick={logout}
                  className="w-full py-2 px-4 bg-red-500/20 text-red-300 rounded-lg hover:bg-red-500/30 transition-colors"
                >
                  Logout
                </button>
              </div>
            </div>
          </div>
        )}
      </div>
    </nav>
  );
}
