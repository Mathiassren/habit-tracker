"use client";

import { useAuth } from "@/hooks/useAuth";
import { useRouter } from "next/navigation";
import { useEffect, useMemo } from "react";
import Link from "next/link";
import {
  HomeIcon,
  ChartBarIcon,
  DocumentChartBarIcon,
  AdjustmentsHorizontalIcon,
  CpuChipIcon,
} from "@heroicons/react/24/outline";
import Lottie from "lottie-react";
import Logo from "../components/Logo";
import dashboardAnim from "../../../public/animations/Space.json";

const navigationCards = [
  {
    href: "/",
    icon: HomeIcon,
    label: "Home",
    color: "text-purple-400",
    description: "Return to main page"
  },
  {
    href: "/heatmap",
    icon: ChartBarIcon,
    label: "Analytics",
    color: "text-pink-400",
    description: "View your progress"
  },
  {
    href: "/dailylog",
    icon: DocumentChartBarIcon,
    label: "Daily Log",
    color: "text-emerald-400",
    description: "Track daily habits"
  },
  {
    href: "/preferences",
    icon: AdjustmentsHorizontalIcon,
    label: "Preferences",
    color: "text-blue-400",
    description: "Customize settings"
  },
  {
    href: "/workbench",
    icon: CpuChipIcon,
    label: "AI Planner",
    color: "text-orange-400",
    description: "Smart planning tools"
  },
];

export default function Dashboard() {
  const { user, loading } = useAuth();
  const router = useRouter();

  const userName = useMemo(() => 
    user?.user_metadata?.full_name?.split(" ")[0] || "friend",
    [user]
  );

  // Protect route
  useEffect(() => {
    if (!loading && !user) {
      router.push("/");
    }
  }, [user, loading, router]);

  if (loading) {
    return (
      <div className="min-h-screen bg-white dark:bg-gray-950 flex items-center justify-center">
        <div className="text-gray-900 dark:text-white text-lg">Loading...</div>
      </div>
    );
  }
  
  if (!user) return null;

  return (
    <div className="relative min-h-screen flex flex-col items-center justify-start bg-white dark:bg-gray-950 overflow-hidden">
      {/* Animated background */}
      <div className="absolute inset-0 opacity-30">
        <Lottie
          className="w-full h-full object-cover"
          animationData={dashboardAnim}
          loop
          autoPlay
        />
      </div>

      {/* Content */}
      <div className="relative z-10 w-full max-w-4xl px-6 py-16">
        {/* Profile Section */}
        <div className="flex flex-col items-center mb-16">
          <div className="relative">
            <img
              src={user.user_metadata?.avatar_url || "/default-avatar.png"}
              alt={`${userName}'s avatar`}
              className="w-28 h-28 rounded-full shadow-2xl border-4 border-purple-500/50 object-cover"
              referrerPolicy="no-referrer"
            />
            <div className="absolute -bottom-2 -right-2 w-8 h-8 bg-green-500 rounded-full border-4 border-gray-950"></div>
          </div>
          
          <h1 className="mt-6 text-4xl font-bold text-white drop-shadow-lg">
            Welcome back, <span className="text-purple-400">{userName}</span>!
          </h1>
          <p className="text-gray-400 mt-2 text-lg">{user.email}</p>
        </div>

        {/* Navigation Grid */}
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
          {navigationCards.map((card) => (
            <NavCard key={card.href} {...card} />
          ))}
        </div>
      </div>
    </div>
  );
}

function NavCard({ href, icon: Icon, label, color, description }) {
  return (
    <Link href={href} className="group">
      <div className="bg-gray-800/60 backdrop-blur-md border border-gray-700/50 rounded-2xl p-6 shadow-xl transition-all duration-300 group-hover:scale-105 group-hover:bg-gray-800/80 group-hover:border-purple-500/30 group-hover:shadow-2xl">
        <div className="flex flex-col items-center text-center space-y-3">
          <div className={`p-3 rounded-xl bg-gray-700/50 group-hover:bg-gray-600/50 transition-colors`}>
            <Icon className={`w-8 h-8 ${color}`} />
          </div>
          <h3 className="text-white font-semibold text-lg group-hover:text-purple-300 transition-colors">
            {label}
          </h3>
          <p className="text-gray-400 text-sm group-hover:text-gray-300 transition-colors">
            {description}
          </p>
        </div>
      </div>
    </Link>
  );
}
