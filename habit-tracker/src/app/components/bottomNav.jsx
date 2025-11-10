"use client";

import { useAuth } from "@/hooks/useAuth";
import { usePathname } from "next/navigation";
import { LayoutDashboard, Home, Settings, Trophy } from "lucide-react";
import Link from "next/link";

const navItems = [
  { href: "/dashboard", label: "Dashboard", icon: LayoutDashboard },
  { href: "/heatmap", label: "Analytics", icon: Home },
  { href: "/leaderboard", label: "Leaderboard", icon: Trophy },
  { href: "/preferences", label: "Settings", icon: Settings },
];

export default function BottomNav() {
  const { loading } = useAuth(); // We don't hide nav based on user anymore
  const pathname = usePathname();

  // While loading, still show nav so it doesn't flicker
  return (
    <nav 
      className="fixed bottom-5 left-1/2 -translate-x-1/2 z-50 border border-indigo-800 p-2 shadow-lg rounded-2xl bg-gray-900"
      aria-label="Main navigation"
      role="navigation"
    >
      <ul className="flex justify-around text-white" role="list">
        {navItems.map((item) => (
          <NavItem 
            key={item.href}
            href={item.href} 
            pathname={pathname} 
            icon={item.icon}
            label={item.label}
          />
        ))}
      </ul>
    </nav>
  );
}

const NavItem = ({ href, pathname, icon: Icon, label }) => {
  const isActive = pathname === href;

  return (
    <li role="none">
      <Link
        href={href}
        className={`flex flex-col items-center gap-1 p-4 rounded-lg transition focus:outline-none focus:ring-2 focus:ring-indigo-500 focus:ring-offset-2 focus:ring-offset-gray-900 ${
          isActive ? "bg-indigo-600 text-white" : "text-gray-400 hover:text-white"
        }`}
        aria-label={label}
        aria-current={isActive ? "page" : undefined}
      >
        <Icon className="w-6 h-6" aria-hidden="true" />
        <span className="sr-only">{label}</span>
      </Link>
    </li>
  );
};
