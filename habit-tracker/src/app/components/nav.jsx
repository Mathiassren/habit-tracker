"use client"; // Ensures this runs on the client

import { useAuth } from "@/hooks/useAuth";
import { useState } from "react";
import { Menu, X } from "lucide-react"; // Import icons for the menu
import Link from "next/link";
import Image from "next/image";

export default function Nav() {
  const { user, loginWithGoogle, logout } = useAuth();
  const [isOpen, setIsOpen] = useState(false); // State for menu visibility

  const toggleMenu = () => setIsOpen(!isOpen); // Toggle menu function

  return (
    <nav className="bg-gray-900 text-white p-4">
      <div className="max-w-7xl mx-auto flex justify-between items-center">
        {/* Logo */}
        <Link href="/">
          <div className="flex items-center ">
            <Image
              src="/habitDots.png"
              alt="Habify Logo"
              width={50}
              height={50}
            />
            <p>Habify</p>
          </div>
        </Link>

        {/* If user is logged in, show the burger menu. Otherwise, show Login button */}
        {user ? (
          <button
            onClick={toggleMenu}
            className="md:hidden p-2 rounded focus:outline-none focus:ring-2 focus:ring-gray-400"
            aria-label={isOpen ? "Close menu" : "Open menu"}
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
            className="md:hidden bg-blue-600 text-white px-4 py-2 rounded-lg hover:bg-blue-700 transition"
          >
            Login
          </button>
        )}

        {/* Desktop Menu */}
        <div className="hidden md:flex items-center space-x-4">
          {user ? <UserMenu user={user} logout={logout} /> : null}
        </div>
      </div>

      {/* Mobile Menu (Dropdown) with Smooth Transition */}
      {user && (
        <div
          className={`md:hidden overflow-hidden transition-all duration-300 ease-in-out ${
            isOpen
              ? "max-h-screen opacity-100 scale-100"
              : "max-h-0 opacity-0 scale-95"
          }`}
        >
          <ul className="flex flex-col space-y-2 text-4xl text-left pl-4 pt-4">
            <Link href="/dashboard ">
              <li className="hover:text-gray-300 cursor-pointer">Home</li>
            </Link>
            <li className="hover:text-gray-300 cursor-pointer">Dashboard</li>
            <Link href="/dailylog">
              <li className="hover:text-gray-300 cursor-pointer">Daily Log</li>
            </Link>
            <Link href="/preferences">
              <li className="hover:text-gray-300 cursor-pointer">
                Preferences
              </li>
            </Link>
          </ul>

          <UserMenu user={user} logout={logout} mobile />
        </div>
      )}
    </nav>
  );
}

/* Extracted User Menu Component */
function UserMenu({ user, logout, mobile = false }) {
  return (
    <div
      className={`flex items-center space-x-3 ${
        mobile ? "flex-col space-x-0 space-y-3" : ""
      }`}
    >
      <div className="flex mt-6 items-center gap-4">
        <img
          src={user.user_metadata?.avatar_url || ""} // Prevent null error
          alt="User Avatar"
          className="w-10 h-10 rounded-xl"
        />
        <span className="text-sm font-medium">
          {user.user_metadata?.full_name || "Guest"}
        </span>
        <button
          type="button"
          onClick={logout}
          className="border-2 border-solid rounded-xl px-6 p-2 transition hover:bg-gray-800"
        >
          Logout
        </button>
      </div>
    </div>
  );
}
