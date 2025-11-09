"use client";

import { useAuth } from "@/hooks/useAuth";
import { useState, useEffect, useRef } from "react";
import { usePathname } from "next/navigation";
import { Menu, X, Home, BarChart3, Calendar, Settings, BookOpen, LogOut, User } from "lucide-react";
import Link from "next/link";
import Logo from "./Logo";

export default function Nav() {
  const { user, loginWithGoogle, logout } = useAuth();
  const pathname = usePathname();
  const [isOpen, setIsOpen] = useState(false);
  const menuRef = useRef(null);

  const toggleMenu = () => setIsOpen(!isOpen);
  const closeMenu = () => setIsOpen(false);

  const navItems = [
    { href: "/dashboard", label: "Home", icon: Home },
    { href: "/heatmap", label: "Analytics", icon: BarChart3 },
    { href: "/dailylog", label: "Daily Log", icon: Calendar },
    { href: "/journal", label: "Journal", icon: BookOpen },
    { href: "/preferences", label: "Preferences", icon: Settings },
  ];

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
    <nav className="bg-gradient-to-r from-slate-900/95 via-slate-800/95 to-slate-900/95 backdrop-blur-xl border-b border-slate-700/50 shadow-2xl relative z-[9999] w-full safe-area-nav" style={{ position: 'relative', zIndex: 9999 }}>
      <div className="max-w-7xl mx-auto px-4 sm:px-6 pt-2 pb-3 sm:pt-3 sm:pb-4">
        <div className="flex justify-between items-center">
          {/* Logo */}
          <Link 
            href={user ? "/dashboard" : "/"} 
            className="hover:scale-105 transition-all duration-300 focus:outline-none focus:ring-2 focus:ring-indigo-500 focus:ring-opacity-50 rounded-lg"
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
            <div className="hidden md:flex items-center gap-2">
              {navItems.map((item) => {
                const isActive = pathname === item.href || (item.href === "/dashboard" && pathname === "/");
                const Icon = item.icon;
                return (
                  <Link
                    key={item.href}
                    href={item.href}
                    className={`flex items-center gap-2 px-4 py-2 rounded-lg transition-all duration-200 ${
                      isActive
                        ? "bg-gradient-to-r from-indigo-600/20 to-blue-600/20 text-white border border-indigo-500/30"
                        : "text-slate-300 hover:text-white hover:bg-slate-800/50"
                    }`}
                  >
                    <Icon className={`w-4 h-4 ${isActive ? "text-indigo-400" : ""}`} />
                    <span className="text-sm font-medium">{item.label}</span>
                  </Link>
                );
              })}
              
              {/* User Menu */}
              <div className="flex items-center gap-3 ml-4 pl-4 border-l border-slate-700/50">
                <div className="relative group">
                  <div className="absolute inset-0 bg-gradient-to-r from-indigo-500 via-blue-500 to-cyan-500 rounded-full blur-md opacity-0 group-hover:opacity-30 transition-opacity"></div>
                  <img
                    src={user?.user_metadata?.avatar_url || "/default-avatar.png"}
                    alt="Profile"
                    className="relative w-9 h-9 rounded-full border-2 border-indigo-500/50 object-cover cursor-pointer hover:border-indigo-400 transition-colors"
                    referrerPolicy="no-referrer"
                  />
                  <div className="absolute -bottom-0.5 -right-0.5 w-3 h-3 bg-emerald-500 rounded-full border-2 border-slate-900"></div>
                </div>
                <button
                  onClick={logout}
                  className="flex items-center gap-2 px-3 py-2 rounded-lg text-red-400 hover:text-red-300 hover:bg-red-500/10 transition-all text-sm font-medium border border-transparent hover:border-red-500/30"
                >
                  <LogOut className="w-4 h-4" />
                  <span className="hidden lg:inline">Logout</span>
                </button>
              </div>
            </div>
          )}

          {/* Mobile Menu Button */}
          {user && (
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
              {navItems.map((item, index) => {
                const isActive = pathname === item.href || (item.href === "/dashboard" && pathname === "/");
                const Icon = item.icon;
                return (
                  <Link
                    key={item.href}
                    href={item.href}
                    onClick={closeMenu}
                    className={`block py-3 px-4 rounded-xl transition-all duration-300 border group ${
                      isActive
                        ? "bg-gradient-to-r from-indigo-500/20 to-blue-500/20 text-white border-indigo-500/30"
                        : "text-gray-300 hover:text-white hover:bg-gradient-to-r hover:from-indigo-500/10 hover:to-blue-500/10 border-transparent hover:border-indigo-500/30"
                    }`}
                    style={{
                      animation: `fadeInUp 0.4s ease-out ${0.05 + index * 0.05}s both`,
                    }}
                  >
                    <div className="flex items-center gap-3">
                      <Icon className={`w-5 h-5 transition-colors ${
                        isActive ? "text-indigo-400" : "text-gray-400 group-hover:text-indigo-400"
                      }`} />
                      <span className="font-medium">{item.label}</span>
                      {isActive && (
                        <div className="ml-auto w-2 h-2 rounded-full bg-indigo-400"></div>
                      )}
                    </div>
                  </Link>
                );
              })}
              
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
