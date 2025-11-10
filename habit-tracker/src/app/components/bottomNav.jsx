"use client";

import { useAuth } from "@/hooks/useAuth";
import { usePathname } from "next/navigation";
import { LayoutDashboard, Home, Settings, Trophy } from "lucide-react";
import Link from "next/link";

export default function BottomNav() {
  const { loading } = useAuth(); // We don't hide nav based on user anymore
  const pathname = usePathname();

  // While loading, still show nav so it doesn’t flicker
  return (
    <nav className="fixed bottom-5 left-1/2 -translate-x-1/2 z-50 border border-indigo-800 p-2 shadow-lg rounded-2xl bg-gray-900">
      <ul className="flex justify-around text-white">
        <NavItem href="/dashboard" pathname={pathname} icon={LayoutDashboard} />
        <NavItem href="/heatmap" pathname={pathname} icon={Home} />
        <NavItem href="/leaderboard" pathname={pathname} icon={Trophy} />
        <NavItem href="/preferences" pathname={pathname} icon={Settings} />
      </ul>
    </nav>
  );
}

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
