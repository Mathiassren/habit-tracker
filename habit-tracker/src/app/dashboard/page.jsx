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
  BookOpenIcon,
} from "@heroicons/react/24/outline";
import { Trophy } from "lucide-react";

const navigationCards = [
  {
    href: "/",
    icon: HomeIcon,
    label: "Home",
    gradient: "from-indigo-500 to-blue-500",
    description: "Return to main page"
  },
  {
    href: "/dailylog",
    icon: DocumentChartBarIcon,
    label: "Daily Log",
    gradient: "from-cyan-500 to-emerald-500",
    description: "Track daily habits"
  },
  {
    href: "/journal",
    icon: BookOpenIcon,
    label: "Journal",
    gradient: "from-emerald-500 to-teal-500",
    description: "Capture your thoughts"
  },
  {
    href: "/heatmap",
    icon: ChartBarIcon,
    label: "Analytics",
    gradient: "from-blue-500 to-cyan-500",
    description: "View your progress"
  },
  {
    href: "/leaderboard",
    icon: Trophy,
    label: "Leaderboard",
    gradient: "from-yellow-500 to-amber-500",
    description: "Compete with others"
  },
  {
    href: "/preferences",
    icon: AdjustmentsHorizontalIcon,
    label: "Preferences",
    gradient: "from-indigo-500 to-purple-500",
    description: "Customize settings"
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
      <div className="min-h-screen bg-gradient-to-br from-slate-950 via-indigo-950/20 to-slate-950 flex items-center justify-center">
        <div className="flex flex-col items-center gap-4">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-indigo-500"></div>
          <div className="text-slate-400 text-lg">Loading dashboard...</div>
        </div>
      </div>
    );
  }
  
  if (!user) return null;

  return (
    <div className="min-h-screen bg-gradient-to-br from-slate-950 via-indigo-950/20 to-slate-950">
      {/* Background Pattern */}
      <div className="absolute inset-0 bg-[radial-gradient(circle_at_1px_1px,_rgba(99,102,241,0.15)_1px,_transparent_0)] bg-[size:24px_24px] opacity-40"></div>
      <div className="absolute inset-0 bg-gradient-to-br from-indigo-900/10 via-transparent to-cyan-900/10"></div>

      {/* Content */}
      <div className="relative z-10 max-w-6xl mx-auto px-6 py-12">
        {/* Profile Section */}
        <div className="flex flex-col items-center mb-12">
          <div className="relative mb-6">
            <div className="absolute inset-0 bg-gradient-to-r from-indigo-500 via-blue-500 to-cyan-500 rounded-full blur-xl opacity-50 animate-pulse"></div>
            <img
              src={user.user_metadata?.avatar_url || "/default-avatar.png"}
              alt={`${userName}'s avatar`}
              className="relative w-32 h-32 rounded-full shadow-2xl border-4 border-indigo-500/50 object-cover"
              referrerPolicy="no-referrer"
            />
            <div className="absolute -bottom-2 -right-2 w-10 h-10 bg-emerald-500 rounded-full border-4 border-slate-950 shadow-lg flex items-center justify-center">
              <div className="w-3 h-3 bg-white rounded-full"></div>
            </div>
          </div>
          
          <h1 className="text-5xl font-bold text-gradient-vibrant mb-2">
            Welcome back, {userName}!
          </h1>
          <p className="text-slate-400 text-lg">{user.email}</p>
        </div>

        {/* Navigation Grid */}
        <div>
          <h2 className="text-2xl font-bold text-white mb-6 flex items-center gap-2">
            <div className="w-1 h-6 bg-gradient-to-b from-indigo-500 to-cyan-500 rounded-full"></div>
            Quick Navigation
          </h2>
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
            {navigationCards.map((card) => (
              <NavCard key={card.href} {...card} />
            ))}
          </div>
        </div>
      </div>
    </div>
  );
}

function NavCard({ href, icon: Icon, label, gradient, description }) {
  return (
    <Link href={href} className="group block">
      <div className="bg-gradient-to-br from-slate-800/40 via-slate-800/30 to-slate-800/40 backdrop-blur-xl border border-slate-700/50 rounded-2xl p-6 shadow-xl transition-all duration-300 group-hover:scale-[1.02] group-hover:border-indigo-500/50 group-hover:shadow-2xl group-hover:shadow-indigo-900/30 h-full">
        <div className="flex flex-col items-center text-center space-y-4">
          <div className={`w-16 h-16 rounded-xl bg-gradient-to-br ${gradient} flex items-center justify-center shadow-lg group-hover:shadow-xl group-hover:scale-110 transition-all duration-300`}>
            <Icon className="w-8 h-8 text-white" />
          </div>
          <div>
            <h3 className="text-white font-bold text-lg mb-1 group-hover:text-indigo-300 transition-colors">
              {label}
            </h3>
            <p className="text-slate-400 text-sm group-hover:text-slate-300 transition-colors">
              {description}
            </p>
          </div>
        </div>
      </div>
    </Link>
  );
}
