"use client";

import { useAuth } from "@/hooks/useAuth";
import { useRouter } from "next/navigation";
import { useEffect, useMemo, useState } from "react";
import Link from "next/link";
import {
  HomeIcon,
  ChartBarIcon,
  DocumentChartBarIcon,
  AdjustmentsHorizontalIcon,
  CpuChipIcon,
  SparklesIcon,
} from "@heroicons/react/24/outline";
import { supabase } from "@/services/supabase";

const navigationCards = [
  {
    href: "/",
    icon: HomeIcon,
    label: "Home",
    gradient: "from-indigo-500 to-blue-500",
    description: "Return to main page"
  },
  {
    href: "/heatmap",
    icon: ChartBarIcon,
    label: "Analytics",
    gradient: "from-blue-500 to-cyan-500",
    description: "View your progress"
  },
  {
    href: "/dailylog",
    icon: DocumentChartBarIcon,
    label: "Daily Log",
    gradient: "from-cyan-500 to-emerald-500",
    description: "Track daily habits"
  },
  {
    href: "/preferences",
    icon: AdjustmentsHorizontalIcon,
    label: "Preferences",
    gradient: "from-indigo-500 to-purple-500",
    description: "Customize settings"
  },
  {
    href: "/workbench",
    icon: CpuChipIcon,
    label: "AI Planner",
    gradient: "from-purple-500 to-pink-500",
    description: "Smart planning tools"
  },
];

export default function Dashboard() {
  const { user, loading } = useAuth();
  const router = useRouter();
  const [stats, setStats] = useState({
    totalHabits: 0,
    totalCompletions: 0,
    currentStreak: 0,
  });
  const [loadingStats, setLoadingStats] = useState(true);

  const userName = useMemo(() => 
    user?.user_metadata?.full_name?.split(" ")[0] || "friend",
    [user]
  );

  // Fetch quick stats
  useEffect(() => {
    if (!user) return;
    
    const fetchStats = async () => {
      try {
        const [
          { count: habitsCount } = { count: 0 },
          { count: completionsCount } = { count: 0 },
        ] = await Promise.all([
          supabase.from("habits").select("*", { count: "exact", head: true }).eq("user_id", user.id),
          supabase.from("habit_completions").select("*", { count: "exact", head: true }).eq("user_id", user.id),
        ]);

        // Simple streak calculation
        const today = new Date().toLocaleDateString("en-CA");
        const { data: recentCompletions } = await supabase
          .from("habit_completions")
          .select("completed_on, completed_at")
          .eq("user_id", user.id)
          .order("completed_at", { ascending: false })
          .limit(30);

        let streak = 0;
        const dates = new Set();
        recentCompletions?.forEach((c) => {
          const dateStr = c.completed_on || new Date(c.completed_at).toLocaleDateString("en-CA");
          dates.add(dateStr);
        });

        const sortedDates = Array.from(dates).sort().reverse();
        let checkDate = new Date();
        for (let i = 0; i < sortedDates.length; i++) {
          const checkStr = checkDate.toLocaleDateString("en-CA");
          if (sortedDates.includes(checkStr)) {
            if (i === 0) streak++;
          } else {
            if (i === 0) break;
          }
          checkDate.setDate(checkDate.getDate() - 1);
        }

        setStats({
          totalHabits: habitsCount || 0,
          totalCompletions: completionsCount || 0,
          currentStreak: streak,
        });
      } catch (error) {
        console.error("Error fetching stats:", error);
      } finally {
        setLoadingStats(false);
      }
    };

    fetchStats();
  }, [user]);

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

        {/* Quick Stats */}
        {!loadingStats && (
          <div className="grid grid-cols-1 md:grid-cols-3 gap-4 mb-12">
            <div className="bg-gradient-to-br from-slate-800/40 via-slate-800/30 to-slate-800/40 backdrop-blur-xl rounded-xl border border-slate-700/50 p-6 shadow-lg shadow-indigo-900/20">
              <div className="flex items-center gap-3">
                <div className="w-12 h-12 rounded-lg bg-indigo-500/20 flex items-center justify-center border border-indigo-500/30">
                  <SparklesIcon className="w-6 h-6 text-indigo-400" />
                </div>
                <div>
                  <p className="text-2xl font-bold text-white">{stats.totalHabits}</p>
                  <p className="text-xs text-slate-400 uppercase tracking-wider">Total Habits</p>
                </div>
              </div>
            </div>

            <div className="bg-gradient-to-br from-slate-800/40 via-slate-800/30 to-slate-800/40 backdrop-blur-xl rounded-xl border border-slate-700/50 p-6 shadow-lg shadow-indigo-900/20">
              <div className="flex items-center gap-3">
                <div className="w-12 h-12 rounded-lg bg-emerald-500/20 flex items-center justify-center border border-emerald-500/30">
                  <ChartBarIcon className="w-6 h-6 text-emerald-400" />
                </div>
                <div>
                  <p className="text-2xl font-bold text-white">{stats.totalCompletions}</p>
                  <p className="text-xs text-slate-400 uppercase tracking-wider">Completions</p>
                </div>
              </div>
            </div>

            <div className="bg-gradient-to-br from-slate-800/40 via-slate-800/30 to-slate-800/40 backdrop-blur-xl rounded-xl border border-slate-700/50 p-6 shadow-lg shadow-indigo-900/20">
              <div className="flex items-center gap-3">
                <div className="w-12 h-12 rounded-lg bg-cyan-500/20 flex items-center justify-center border border-cyan-500/30">
                  <SparklesIcon className="w-6 h-6 text-cyan-400" />
                </div>
                <div>
                  <p className="text-2xl font-bold text-white">{stats.currentStreak}</p>
                  <p className="text-xs text-slate-400 uppercase tracking-wider">Day Streak</p>
                </div>
              </div>
            </div>
          </div>
        )}

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
