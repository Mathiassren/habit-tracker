"use client";

import { useAuth } from "@/hooks/useAuth"; // ✅ Import Authentication Hook
import { usePathname } from "next/navigation"; // Get current route
import { LayoutDashboard, Home, Settings } from "lucide-react";
import Link from "next/link";

export default function BottomNav() {
  const { user, loading } = useAuth(); // ✅ Check if user is authenticated
  const pathname = usePathname(); // Get the current route

  // ✅ Hide the nav if the user is not logged in or still loading
  if (loading || !user) return null;

  return (
    <nav className="fixed bottom-5 left-1/2 -translate-x-1/2 z-50 border border-indigo-800 p-2 shadow-lg rounded-2xl bg-gray-900">
      <ul className="flex justify-around text-white">
        <NavItem href="/dashboard" pathname={pathname} icon={LayoutDashboard} />
        <NavItem href="/" pathname={pathname} icon={Home} />
        <NavItem href="/preferences" pathname={pathname} icon={Settings} />
      </ul>
    </nav>
  );
}

// ✅ Reusable NavItem Component for easier styling
const NavItem = ({ href, pathname, icon: Icon }) => {
  const isActive = pathname === href;

  return (
    <li>
      <Link
        href={href}
        className={`flex flex-col items-center gap-1 p-4 rounded-lg transition ${
          isActive ? "bg-indigo-600 text-white" : "text-gray-400"
        }`}
      >
        <Icon className="w-6 h-6" />
      </Link>
    </li>
  );
};
