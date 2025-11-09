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
      
      <div className="relative z-10 max-w-7xl mx-auto px-6 py-12">
        {/* Header Section */}
        <div className="mb-12">
          <div className="flex items-center gap-3 mb-4">
            <div className="w-12 h-12 rounded-xl bg-gradient-to-br from-indigo-500 via-blue-500 to-cyan-500 flex items-center justify-center shadow-lg shadow-indigo-500/50">
              <TrendingUp className="w-6 h-6 text-white" />
            </div>
            <div>
              <h1 className="text-4xl font-bold text-gradient-vibrant">Activity Heatmap</h1>
              <p className="text-slate-400 text-lg mt-1">
                Visualize your habit completion patterns
              </p>
            </div>
          </div>

          {/* Stats Cards */}
          <div className="grid grid-cols-2 md:grid-cols-4 gap-4 mt-8">
            <div className="bg-gradient-to-br from-slate-800/40 via-slate-800/30 to-slate-800/40 backdrop-blur-xl rounded-xl border border-slate-700/50 p-4 shadow-lg shadow-indigo-900/20">
              <div className="flex items-center gap-3">
                <div className="w-10 h-10 rounded-lg bg-indigo-500/20 flex items-center justify-center">
                  <Target className="w-5 h-5 text-indigo-400" />
                </div>
                <div>
                  <p className="text-2xl font-bold text-white">{stats.totalCompletions}</p>
                  <p className="text-xs text-slate-400 uppercase tracking-wider">Total</p>
                </div>
              </div>
            </div>

            <div className="bg-gradient-to-br from-slate-800/40 via-slate-800/30 to-slate-800/40 backdrop-blur-xl rounded-xl border border-slate-700/50 p-4 shadow-lg shadow-indigo-900/20">
              <div className="flex items-center gap-3">
                <div className="w-10 h-10 rounded-lg bg-blue-500/20 flex items-center justify-center">
                  <Calendar className="w-5 h-5 text-blue-400" />
                </div>
                <div>
                  <p className="text-2xl font-bold text-white">{stats.activeDays}</p>
                  <p className="text-xs text-slate-400 uppercase tracking-wider">Active Days</p>
                </div>
              </div>
            </div>

            <div className="bg-gradient-to-br from-slate-800/40 via-slate-800/30 to-slate-800/40 backdrop-blur-xl rounded-xl border border-slate-700/50 p-4 shadow-lg shadow-indigo-900/20">
              <div className="flex items-center gap-3">
                <div className="w-10 h-10 rounded-lg bg-cyan-500/20 flex items-center justify-center">
                  <Sparkles className="w-5 h-5 text-cyan-400" />
                </div>
                <div>
                  <p className="text-2xl font-bold text-white">{stats.avgPerDay}</p>
                  <p className="text-xs text-slate-400 uppercase tracking-wider">Avg/Day</p>
                </div>
              </div>
            </div>

            <div className="bg-gradient-to-br from-slate-800/40 via-slate-800/30 to-slate-800/40 backdrop-blur-xl rounded-xl border border-slate-700/50 p-4 shadow-lg shadow-indigo-900/20">
              <div className="flex items-center gap-3">
                <div className="w-10 h-10 rounded-lg bg-emerald-500/20 flex items-center justify-center">
                  <TrendingUp className="w-5 h-5 text-emerald-400" />
                </div>
                <div>
                  <p className="text-2xl font-bold text-white">{stats.currentStreak}</p>
                  <p className="text-xs text-slate-400 uppercase tracking-wider">Streak</p>
                </div>
              </div>
            </div>
          </div>
        </div>

        {/* Main Content Grid - Desktop Layout */}
        <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
          {/* Heatmap Section - Takes 2 columns on desktop */}
          <div className="lg:col-span-2">
            <div className="bg-gradient-to-br from-slate-800/40 via-slate-800/30 to-slate-800/40 backdrop-blur-xl rounded-2xl border border-slate-700/50 shadow-2xl shadow-indigo-900/20 p-8">
              <HabitHeatmap className="p-0" byDate={byDate} userId={user?.id} />
            </div>
          </div>

          {/* Analytics Sidebar - Takes 1 column on desktop */}
          <div className="lg:col-span-1">
            <div className="bg-gradient-to-br from-slate-800/40 via-slate-800/30 to-slate-800/40 backdrop-blur-xl rounded-2xl border border-slate-700/50 shadow-2xl shadow-indigo-900/20 p-6 sticky top-6">
              <h3 className="text-xl font-bold text-white mb-6 flex items-center gap-2">
                <TrendingUp className="w-5 h-5 text-indigo-400" />
                Analytics
              </h3>
              <AnalyticsPage className="p-0" />
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
