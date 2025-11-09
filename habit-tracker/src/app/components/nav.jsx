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
              className="md:hidden w-10 h-10 flex items-center justify-center rounded-lg bg-slate-800/50 hover:bg-slate-700/50 border border-slate-700/50 hover:border-indigo-500/50 text-gray-300 hover:text-white transition-all duration-300 relative group"
              aria-label="Toggle menu"
            >
              <div className={`absolute inset-0 rounded-lg bg-gradient-to-r from-indigo-500/20 via-blue-500/20 to-cyan-500/20 opacity-0 group-hover:opacity-100 transition-opacity duration-300`}></div>
              <div className="relative z-10 transition-transform duration-300">
                {isOpen ? (
                  <X size={20} className="rotate-90 transition-transform duration-300" />
                ) : (
                  <Menu size={20} className="rotate-0 transition-transform duration-300" />
                )}
              </div>
            </button>
          ) : (
            <button
              onClick={loginWithGoogle}
              className="bg-gradient-to-r from-indigo-600 to-blue-600 hover:from-indigo-500 hover:to-blue-500 text-white px-6 py-2 rounded-lg transition-colors shadow-lg shadow-indigo-500/30"
            >
              Login
            </button>
          )}
        </div>

        {/* Mobile Menu */}
        {user && isOpen && (
          <div
            ref={menuRef}
            className="md:hidden absolute top-full left-0 right-0 bg-gradient-to-br from-slate-900 via-slate-800 to-slate-900 backdrop-blur-xl border-b border-slate-700/50 shadow-2xl z-50 overflow-hidden"
            style={{
              animation: 'slideDown 0.3s ease-out',
            }}
          >
            {/* Animated background gradient */}
            <div className="absolute inset-0 bg-gradient-to-br from-indigo-900/20 via-blue-900/10 to-cyan-900/20 pointer-events-none"></div>
            
            <div className="relative px-6 py-4 space-y-2">
              <Link
                href="/dashboard"
                onClick={closeMenu}
                className="block py-3 px-4 text-gray-300 hover:text-white hover:bg-gradient-to-r hover:from-indigo-500/10 hover:to-blue-500/10 rounded-xl transition-all duration-300 border border-transparent hover:border-indigo-500/30 group"
                style={{
                  animation: 'fadeInUp 0.4s ease-out 0.05s both',
                }}
              >
                <div className="flex items-center gap-3">
                  <Home className="w-5 h-5 text-gray-400 group-hover:text-indigo-400 transition-colors" />
                  <span className="font-medium">Home</span>
                </div>
              </Link>
              <Link
                href="/heatmap"
                onClick={closeMenu}
                className="block py-3 px-4 text-gray-300 hover:text-white hover:bg-gradient-to-r hover:from-blue-500/10 hover:to-cyan-500/10 rounded-xl transition-all duration-300 border border-transparent hover:border-blue-500/30 group"
                style={{
                  animation: 'fadeInUp 0.4s ease-out 0.1s both',
                }}
              >
                <div className="flex items-center gap-3">
                  <BarChart3 className="w-5 h-5 text-gray-400 group-hover:text-blue-400 transition-colors" />
                  <span className="font-medium">Analytics</span>
                </div>
              </Link>
              <Link
                href="/dailylog"
                onClick={closeMenu}
                className="block py-3 px-4 text-gray-300 hover:text-white hover:bg-gradient-to-r hover:from-cyan-500/10 hover:to-emerald-500/10 rounded-xl transition-all duration-300 border border-transparent hover:border-cyan-500/30 group"
                style={{
                  animation: 'fadeInUp 0.4s ease-out 0.15s both',
                }}
              >
                <div className="flex items-center gap-3">
                  <Calendar className="w-5 h-5 text-gray-400 group-hover:text-cyan-400 transition-colors" />
                  <span className="font-medium">Daily Log</span>
                </div>
              </Link>
              <Link
                href="/preferences"
                onClick={closeMenu}
                className="block py-3 px-4 text-gray-300 hover:text-white hover:bg-gradient-to-r hover:from-indigo-500/10 hover:to-purple-500/10 rounded-xl transition-all duration-300 border border-transparent hover:border-indigo-500/30 group"
                style={{
                  animation: 'fadeInUp 0.4s ease-out 0.2s both',
                }}
              >
                <div className="flex items-center gap-3">
                  <Settings className="w-5 h-5 text-gray-400 group-hover:text-indigo-400 transition-colors" />
                  <span className="font-medium">Preferences</span>
                </div>
              </Link>
              <Link
                href="/workbench"
                onClick={closeMenu}
                className="block py-3 px-4 text-gray-300 hover:text-white hover:bg-gradient-to-r hover:from-purple-500/10 hover:to-pink-500/10 rounded-xl transition-all duration-300 border border-transparent hover:border-purple-500/30 group"
                style={{
                  animation: 'fadeInUp 0.4s ease-out 0.25s both',
                }}
              >
                <div className="flex items-center gap-3">
                  <Brain className="w-5 h-5 text-gray-400 group-hover:text-purple-400 transition-colors" />
                  <span className="font-medium">AI Planner</span>
                </div>
              </Link>
              <Link
                href="/journal"
                onClick={closeMenu}
                className="block py-3 px-4 text-gray-300 hover:text-white hover:bg-gradient-to-r hover:from-purple-500/10 hover:to-pink-500/10 rounded-xl transition-all duration-300 border border-transparent hover:border-purple-500/30 group"
                style={{
                  animation: 'fadeInUp 0.4s ease-out 0.3s both',
                }}
              >
                <div className="flex items-center gap-3">
                  <BookOpen className="w-5 h-5 text-gray-400 group-hover:text-purple-400 transition-colors" />
                  <span className="font-medium">Journal</span>
                </div>
              </Link>
              
              {/* Mobile User Section */}
              <div 
                className="border-t border-slate-700/50 pt-4 mt-4"
                style={{
                  animation: 'fadeInUp 0.4s ease-out 0.35s both',
                }}
              >
                <div className="bg-gradient-to-br from-slate-800/50 to-slate-800/30 rounded-xl border border-slate-700/50 p-4 mb-4">
                  <div className="flex items-center gap-3">
                    <div className="relative">
                      <div className="absolute inset-0 bg-gradient-to-r from-indigo-500 via-blue-500 to-cyan-500 rounded-full blur-md opacity-30"></div>
                      <img
                        src={user?.user_metadata?.avatar_url || "/default-avatar.png"}
                        alt="Profile"
                        className="relative w-12 h-12 rounded-full border-2 border-indigo-500/50 object-cover"
                        referrerPolicy="no-referrer"
                      />
                      <div className="absolute -bottom-0.5 -right-0.5 w-4 h-4 bg-emerald-500 rounded-full border-2 border-slate-900"></div>
                    </div>
                    <div className="flex-1 min-w-0">
                      <p className="text-white font-semibold text-sm truncate">
                        {user?.user_metadata?.full_name || "User"}
                      </p>
                      <p className="text-slate-400 text-xs truncate">{user?.email}</p>
                    </div>
                  </div>
                </div>
                <button
                  onClick={() => {
                    closeMenu();
                    logout();
                  }}
                  className="w-full py-3 px-4 bg-gradient-to-r from-red-600/20 to-rose-600/20 hover:from-red-600/30 hover:to-rose-600/30 text-red-300 hover:text-red-200 rounded-xl transition-all duration-300 border border-red-500/30 hover:border-red-500/50 font-medium"
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
