"use client";

import { useMemo, useState } from "react";
import { useAuth } from "@/hooks/useAuth";
import { useHeatmap } from "@/hooks/useHeatmap";
import HabitHeatmap from "@/app/components/HabitHeatmap";
import AnalyticsPage from "../analytics/page";
import { Calendar, TrendingUp, Target, Sparkles } from "lucide-react";

export default function HeatmapPage() {
  const { user, loading } = useAuth();

  const { since, today, tz, year } = useMemo(() => {
    const y = new Date().getFullYear();
    return {
      since: `${y}-01-01`,
      today: new Date().toLocaleDateString("en-CA"),
      tz: Intl.DateTimeFormat().resolvedOptions().timeZone || "UTC",
      year: y,
    };
  }, []);

  const [refreshKey, setRefreshKey] = useState(0);
  const refreshHeatmap = () => setRefreshKey((k) => k + 1);

  const { byDate, total } = useHeatmap(user?.id, since, today, tz, refreshKey);

  // Calculate stats
  const stats = useMemo(() => {
    const dates = Object.keys(byDate);
    const activeDays = dates.filter(date => byDate[date] > 0).length;
    const avgPerDay = activeDays > 0 ? (total / activeDays).toFixed(1) : 0;
    const currentStreak = calculateCurrentStreak(byDate);
    
    return {
      totalCompletions: total,
      activeDays,
      avgPerDay,
      currentStreak,
    };
  }, [byDate, total]);

  if (loading || !user) return null;

  return (
    <div className="min-h-screen bg-gradient-to-br from-slate-950 via-indigo-950/20 to-slate-950">
      {/* Background Pattern */}
      <div className="absolute inset-0 bg-[radial-gradient(circle_at_1px_1px,_rgba(99,102,241,0.15)_1px,_transparent_0)] bg-[size:24px_24px] opacity-40"></div>
      
      <div className="relative z-10 max-w-7xl mx-auto px-4 sm:px-6 py-6 sm:py-12">
        {/* Header Section */}
        <div className="mb-8 sm:mb-12">
          <div className="flex flex-col sm:flex-row items-start sm:items-center gap-4 sm:gap-5 mb-4 sm:mb-6">
            {/* Icon with enhanced glow effect */}
            <div className="relative flex-shrink-0">
              <div className="absolute inset-0 rounded-xl bg-gradient-to-br from-indigo-500/70 via-blue-500/70 to-cyan-500/70 blur-2xl opacity-50"></div>
              <div className="relative w-12 h-12 sm:w-14 sm:h-14 rounded-xl bg-gradient-to-br from-indigo-500 via-blue-500 to-cyan-500 flex items-center justify-center shadow-2xl shadow-indigo-500/60 ring-2 ring-indigo-400/30 transition-transform hover:scale-105">
                <TrendingUp className="w-6 h-6 sm:w-7 sm:h-7 text-white drop-shadow-lg" />
              </div>
            </div>
            <div className="flex-1 min-w-0">
              <h1 className="text-3xl sm:text-4xl md:text-5xl font-bold leading-tight mb-2">
                <span className="bg-gradient-to-r from-indigo-400 via-blue-400 to-cyan-400 bg-clip-text text-transparent">
                  Activity Heatmap
                </span>
              </h1>
              <p className="text-slate-400 text-sm sm:text-base md:text-lg leading-relaxed">
                Visualize your habit completion patterns
              </p>
            </div>
          </div>

          {/* Quick Overview Stats - Summary only, no duplicates */}
          <div className="grid grid-cols-3 gap-3 sm:gap-4 mt-6 sm:mt-8">
            <div className="bg-gradient-to-br from-slate-800/40 via-slate-800/30 to-slate-800/40 backdrop-blur-xl rounded-xl border border-slate-700/50 p-3 sm:p-4 shadow-lg shadow-indigo-900/20">
              <div className="flex items-center gap-2 sm:gap-3">
                <div className="w-8 h-8 sm:w-10 sm:h-10 rounded-lg bg-indigo-500/20 flex items-center justify-center flex-shrink-0">
                  <Target className="w-4 h-4 sm:w-5 sm:h-5 text-indigo-400" />
                </div>
                <div className="min-w-0 flex-1">
                  <p className="text-xl sm:text-2xl font-bold text-white truncate">{stats.totalCompletions}</p>
                  <p className="text-xs text-slate-400 uppercase tracking-wider truncate">Total</p>
                </div>
              </div>
            </div>

            <div className="bg-gradient-to-br from-slate-800/40 via-slate-800/30 to-slate-800/40 backdrop-blur-xl rounded-xl border border-slate-700/50 p-3 sm:p-4 shadow-lg shadow-indigo-900/20">
              <div className="flex items-center gap-2 sm:gap-3">
                <div className="w-8 h-8 sm:w-10 sm:h-10 rounded-lg bg-blue-500/20 flex items-center justify-center flex-shrink-0">
                  <Calendar className="w-4 h-4 sm:w-5 sm:h-5 text-blue-400" />
                </div>
                <div className="min-w-0 flex-1">
                  <p className="text-xl sm:text-2xl font-bold text-white truncate">{stats.activeDays}</p>
                  <p className="text-xs text-slate-400 uppercase tracking-wider truncate">Active Days</p>
                </div>
              </div>
            </div>

            <div className="bg-gradient-to-br from-slate-800/40 via-slate-800/30 to-slate-800/40 backdrop-blur-xl rounded-xl border border-slate-700/50 p-3 sm:p-4 shadow-lg shadow-indigo-900/20">
              <div className="flex items-center gap-2 sm:gap-3">
                <div className="w-8 h-8 sm:w-10 sm:h-10 rounded-lg bg-cyan-500/20 flex items-center justify-center flex-shrink-0">
                  <Sparkles className="w-4 h-4 sm:w-5 sm:h-5 text-cyan-400" />
                </div>
                <div className="min-w-0 flex-1">
                  <p className="text-xl sm:text-2xl font-bold text-white truncate">{stats.avgPerDay}</p>
                  <p className="text-xs text-slate-400 uppercase tracking-wider truncate">Avg/Day</p>
                </div>
              </div>
            </div>
          </div>
        </div>

        {/* Main Content Grid - Desktop Layout */}
        <div className="grid grid-cols-1 lg:grid-cols-3 gap-4 sm:gap-6 lg:gap-8">
          {/* Left Column - Heatmap + Stats Below */}
          <div className="lg:col-span-2 space-y-4 sm:space-y-6">
            {/* Heatmap Section */}
            <div className="bg-gradient-to-br from-slate-800/40 via-slate-800/30 to-slate-800/40 backdrop-blur-xl rounded-2xl border border-slate-700/50 shadow-2xl shadow-indigo-900/20 p-4 sm:p-6 lg:p-8">
              <HabitHeatmap className="p-0" byDate={byDate} userId={user?.id} />
            </div>

            {/* Additional Stats Below Heatmap */}
            <AnalyticsPage className="p-0" belowHeatmap={true} />
          </div>

          {/* Right Column - Date Navigator Sidebar */}
          <div className="lg:col-span-1">
            <div className="bg-gradient-to-br from-slate-800/40 via-slate-800/30 to-slate-800/40 backdrop-blur-xl rounded-2xl border border-slate-700/50 shadow-2xl shadow-indigo-900/20 p-4 sm:p-6 lg:sticky lg:top-6">
              <h3 className="text-lg sm:text-xl font-bold text-white mb-4 sm:mb-6 flex items-center gap-2">
                <Calendar className="w-4 h-4 sm:w-5 sm:h-5 text-indigo-400" />
                Date Navigator
              </h3>
              <AnalyticsPage className="p-0" compact={true} />
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}

// Helper function to calculate current streak
function calculateCurrentStreak(byDate) {
  const today = new Date();
  today.setHours(0, 0, 0, 0);
  
  let streak = 0;
  let checkDate = new Date(today);
  
  while (true) {
    const dateStr = checkDate.toISOString().split('T')[0];
    if (byDate[dateStr] && byDate[dateStr] > 0) {
      streak++;
      checkDate.setDate(checkDate.getDate() - 1);
    } else {
      break;
    }
  }
  
  return streak;
}
