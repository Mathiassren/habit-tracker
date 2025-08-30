"use client";

import { useAuth } from "@/hooks/useAuth";
import { useState, useEffect, useRef } from "react";
import { Menu, X } from "lucide-react";
import Link from "next/link";
import Image from "next/image";

export default function Nav() {
  const { user, loginWithGoogle, logout } = useAuth();
  const [isOpen, setIsOpen] = useState(false);
  const toggleMenu = () => setIsOpen((v) => !v);

  // NEW: refs for button + dropdown
  const btnRef = useRef(null);
  const menuRef = useRef(null);

  // Close when clicking outside (or pressing ESC)
  useEffect(() => {
    if (!isOpen) return;

    const onPointer = (e) => {
      const insideBtn = btnRef.current?.contains(e.target);
      const insideMenu = menuRef.current?.contains(e.target);
      if (!insideBtn && !insideMenu) setIsOpen(false);
    };
    const onEsc = (e) => {
      if (e.key === "Escape") setIsOpen(false);
    };

    document.addEventListener("mousedown", onPointer);
    document.addEventListener("touchstart", onPointer, { passive: true });
    document.addEventListener("keydown", onEsc);
    return () => {
      document.removeEventListener("mousedown", onPointer);
      document.removeEventListener("touchstart", onPointer);
      document.removeEventListener("keydown", onEsc);
    };
  }, [isOpen]);

  // Close on resize to md+ (unchanged)
  useEffect(() => {
    const onResize = () => {
      if (window.matchMedia("(min-width: 768px)").matches) setIsOpen(false);
    };
    window.addEventListener("resize", onResize);
    return () => window.removeEventListener("resize", onResize);
  }, []);

  return (
    <nav className="text-white p-4 border-b-[0.5px] border-gray-700">
      <div className="max-w-7xl mx-auto flex justify-between items-center">
        {/* Logo */}
        <Link href="/" aria-label="Habify Home" className="flex items-center">
          <Image
            src="/habifyLogo5.png"
            alt="Habify Logo"
            width={50}
            height={50}
            priority
          />
        </Link>

        {/* Mobile: burger or login */}
        {user ? (
          <button
            ref={btnRef}
            onClick={toggleMenu}
            className="md:hidden p-2 rounded focus:outline-none focus:ring-2 focus:ring-gray-400"
            aria-label={isOpen ? "Close menu" : "Open menu"}
            aria-expanded={isOpen}
            aria-controls="mobile-menu"
          >
            {isOpen ? (
              <X
                size={20}
                className="transition-transform duration-300 rotate-90"
              />
            ) : (
              <Menu
                size={20}
                className="transition-transform duration-300 rotate-0"
              />
            )}
          </button>
        ) : (
          <button
            onClick={loginWithGoogle}
            className="md:hidden bg-blue-500 text-white px-4 py-2 rounded-lg hover:bg-blue-700 transition"
          >
            Login
          </button>
        )}

        {/* Desktop Menu */}
        <div className="hidden md:flex items-center space-x-4">
          {user ? <UserMenu user={user} logout={logout} /> : null}
        </div>
      </div>

      {/* Mobile Menu */}
      {user && (
        <div
          ref={menuRef}
          id="mobile-menu"
          className={`md:hidden overflow-hidden transition-all duration-300 ease-in-out ${
            isOpen
              ? "max-h-screen opacity-100 scale-100"
              : "max-h-0 opacity-0 scale-95"
          }`}
        >
          <ul className="flex flex-col space-y-2 text-4xl text-left pl-4 pt-4">
            <li>
              <Link
                href="/dashboard"
                className="hover:text-gray-300 cursor-pointer"
                onClick={() => setIsOpen(false)}
              >
                Home
              </Link>
            </li>
            <li>
              <Link
                href="/heatmap"
                className="hover:text-gray-300 cursor-pointer"
                onClick={() => setIsOpen(false)}
              >
                Dashboard
              </Link>
            </li>
            <li>
              <Link
                href="/dailylog"
                className="hover:text-gray-300 cursor-pointer"
                onClick={() => setIsOpen(false)}
              >
                Daily Log
              </Link>
            </li>
            <li>
              <Link
                href="/preferences"
                className="hover:text-gray-300 cursor-pointer"
                onClick={() => setIsOpen(false)}
              >
                Preferences
              </Link>
            </li>
          </ul>

          {/* Mobile user block (same design) */}
          <UserMenu user={user} logout={logout} mobile />
        </div>
      )}
    </nav>
  );
}

/* JSX version — no TypeScript annotations */
function UserMenu({ user, logout, mobile = false }) {
  return (
    <div className="flex items-center space-x-3">
      <div className="flex ml-4 items-center gap-2 mt-2">
        <img
          src={user?.user_metadata?.avatar_url || "/default.png"}
          alt="User Avatar"
          className="w-10 h-10 rounded-xl"
          referrerPolicy="no-referrer"
        />
        <span className="text-sm font-bold">
          <span className="mr-2">Welcome</span>
          <span className="text-[#7158BD]">
            {user?.user_metadata?.full_name || "Guest"}
          </span>
        </span>

        {/* Desktop-only links as you had them */}
        <Link
          href="/dailylog"
          className="hover:text-white hidden md:block ease-in duration-100 text-gray-400"
        >
          Dailylog
        </Link>
        <Link
          href="/heatmap"
          className="hover:text-white hidden md:block ease-in duration-100 text-gray-400"
        >
          Dashboard
        </Link>
        <Link
          href="/preferences"
          className="hover:text-white hidden md:block ease-in duration-100 text-gray-400"
        >
          Preferences
        </Link>
        <Link
          href="/ai"
          className="hover:text-white hidden md:block ease-in duration-100 text-gray-400"
        >
          Ai Coach
        </Link>
        <button
          type="button"
          onClick={logout}
          className="border-2 border-solid md:block rounded-xl px-6 p-2 transition hover:bg-gray-800"
        >
          Logout
        </button>
      </div>
    </div>
  );
}
