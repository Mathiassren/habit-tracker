"use client";

import { useState, useEffect } from "react";
import { supabase } from "@/services/supabase";
import { 
  SparklesIcon, 
  ChartBarIcon, 
  BookOpenIcon,
  CalendarIcon,
  CheckCircleIcon,
  FireIcon
} from "@heroicons/react/24/outline";

const AppTab = () => {
  const [stats, setStats] = useState({
    totalHabits: 0,
    totalCompletions: 0,
    totalJournalEntries: 0,
    currentStreak: 0,
    longestStreak: 0,
    thisWeekCompletions: 0
  });
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const fetchStats = async () => {
      try {
        const { data: { user } } = await supabase.auth.getUser();
        if (!user) {
          setLoading(false);
          return;
        }

        // Get current week dates
        const today = new Date();
        const startOfWeek = new Date(today);
        startOfWeek.setDate(today.getDate() - today.getDay());
        startOfWeek.setHours(0, 0, 0, 0);
        const endOfWeek = new Date(startOfWeek);
        endOfWeek.setDate(startOfWeek.getDate() + 6);
        endOfWeek.setHours(23, 59, 59, 999);

        // Fetch all stats in parallel
        const [
          { count: habitsCount } = { count: 0 },
          { count: completionsCount } = { count: 0 },
          { count: journalCount } = { count: 0 },
          { count: weekCompletions } = { count: 0 }
        ] = await Promise.all([
          supabase.from("habits").select("*", { count: "exact", head: true }).eq("user_id", user.id),
          supabase.from("habit_completions").select("*", { count: "exact", head: true }).eq("user_id", user.id),
          supabase.from("journal_entries").select("*", { count: "exact", head: true }).eq("user_id", user.id),
          supabase
            .from("habit_completions")
            .select("*", { count: "exact", head: true })
            .eq("user_id", user.id)
            .gte("completed_at", startOfWeek.toISOString())
            .lte("completed_at", endOfWeek.toISOString())
        ]);

        // Calculate streaks (simplified - get recent completions)
        const { data: recentCompletions } = await supabase
          .from("habit_completions")
          .select("completed_on, completed_at")
          .eq("user_id", user.id)
          .order("completed_at", { ascending: false })
          .limit(100);

        let currentStreak = 0;
        let longestStreak = 0;
        let tempStreak = 0;
        const todayStr = new Date().toLocaleDateString("en-CA");
        const dates = new Set();
        
        recentCompletions?.forEach((c) => {
          const dateStr = c.completed_on || new Date(c.completed_at).toLocaleDateString("en-CA");
          dates.add(dateStr);
        });

        // Simple streak calculation
        const sortedDates = Array.from(dates).sort().reverse();
        let checkDate = new Date();
        for (let i = 0; i < sortedDates.length; i++) {
          const checkStr = checkDate.toLocaleDateString("en-CA");
          if (sortedDates.includes(checkStr)) {
            if (i === 0) currentStreak++;
            tempStreak++;
            longestStreak = Math.max(longestStreak, tempStreak);
          } else {
            if (i === 0) break;
            tempStreak = 0;
          }
          checkDate.setDate(checkDate.getDate() - 1);
        }

        setStats({
          totalHabits: habitsCount || 0,
          totalCompletions: completionsCount || 0,
          totalJournalEntries: journalCount || 0,
          currentStreak: currentStreak,
          longestStreak: longestStreak,
          thisWeekCompletions: weekCompletions || 0
        });
      } catch (error) {
        console.error("Error fetching stats:", error);
      } finally {
        setLoading(false);
      }
    };

    fetchStats();
  }, []);

  return (
    <div className="space-y-6">
      {/* App Header */}
      <div className="bg-gradient-to-br from-slate-800/40 via-slate-800/30 to-slate-800/40 backdrop-blur-xl rounded-2xl border border-slate-700/50 shadow-xl shadow-indigo-900/20 p-8">
        <div className="flex items-center gap-4 mb-4">
          <div className="w-12 h-12 rounded-xl bg-gradient-to-br from-indigo-500 via-blue-500 to-cyan-500 flex items-center justify-center shadow-lg shadow-indigo-500/50">
            <SparklesIcon className="w-6 h-6 text-white" />
          </div>
          <div>
            <h2 className="text-2xl font-bold text-white">About Habify</h2>
            <p className="text-slate-400 text-sm">Version 1.0.0</p>
          </div>
        </div>
        <p className="text-slate-300 leading-relaxed">
          Habify is your personal habit tracking companion designed to help you build consistency and achieve your goals. 
          Track daily habits, maintain streaks, journal your thoughts, and visualize your progress with beautiful analytics.
        </p>
      </div>

      {/* Features */}
      <div className="bg-gradient-to-br from-slate-800/40 via-slate-800/30 to-slate-800/40 backdrop-blur-xl rounded-2xl border border-slate-700/50 shadow-xl shadow-indigo-900/20 p-8">
        <h3 className="text-xl font-bold text-white mb-6 flex items-center gap-2">
          <SparklesIcon className="w-5 h-5 text-indigo-400" />
          Key Features
        </h3>
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          <div className="flex items-start gap-3 p-4 bg-slate-700/20 rounded-xl border border-slate-600/30">
            <CheckCircleIcon className="w-5 h-5 text-indigo-400 mt-0.5 flex-shrink-0" />
            <div>
              <h4 className="font-semibold text-white mb-1">Daily Habit Tracking</h4>
              <p className="text-sm text-slate-400">Create and track habits with custom colors and dates</p>
            </div>
          </div>
          <div className="flex items-start gap-3 p-4 bg-slate-700/20 rounded-xl border border-slate-600/30">
            <FireIcon className="w-5 h-5 text-cyan-400 mt-0.5 flex-shrink-0" />
            <div>
              <h4 className="font-semibold text-white mb-1">Streak Tracking</h4>
              <p className="text-sm text-slate-400">Build and maintain streaks to stay motivated</p>
            </div>
          </div>
          <div className="flex items-start gap-3 p-4 bg-slate-700/20 rounded-xl border border-slate-600/30">
            <ChartBarIcon className="w-5 h-5 text-cyan-400 mt-0.5 flex-shrink-0" />
            <div>
              <h4 className="font-semibold text-white mb-1">Analytics & Heatmaps</h4>
              <p className="text-sm text-slate-400">Visualize your progress with detailed analytics</p>
            </div>
          </div>
          <div className="flex items-start gap-3 p-4 bg-slate-700/20 rounded-xl border border-slate-600/30">
            <BookOpenIcon className="w-5 h-5 text-blue-400 mt-0.5 flex-shrink-0" />
            <div>
              <h4 className="font-semibold text-white mb-1">Journal Entries</h4>
              <p className="text-sm text-slate-400">Capture thoughts and memories with photos</p>
            </div>
          </div>
          <div className="flex items-start gap-3 p-4 bg-slate-700/20 rounded-xl border border-slate-600/30">
            <CalendarIcon className="w-5 h-5 text-emerald-400 mt-0.5 flex-shrink-0" />
            <div>
              <h4 className="font-semibold text-white mb-1">Date Navigation</h4>
              <p className="text-sm text-slate-400">Track habits across different dates with ease</p>
            </div>
          </div>
          <div className="flex items-start gap-3 p-4 bg-slate-700/20 rounded-xl border border-slate-600/30">
            <SparklesIcon className="w-5 h-5 text-pink-400 mt-0.5 flex-shrink-0" />
            <div>
              <h4 className="font-semibold text-white mb-1">AI Planner</h4>
              <p className="text-sm text-slate-400">Smart task planning with AI assistance</p>
            </div>
          </div>
        </div>
      </div>

      {/* Your Statistics */}
      <div className="bg-gradient-to-br from-slate-800/40 via-slate-800/30 to-slate-800/40 backdrop-blur-xl rounded-2xl border border-slate-700/50 shadow-xl shadow-indigo-900/20 p-8">
        <h3 className="text-xl font-bold text-white mb-6 flex items-center gap-2">
          <ChartBarIcon className="w-5 h-5 text-indigo-400" />
          Your Statistics
        </h3>
        {loading ? (
          <div className="flex items-center justify-center py-8">
            <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-indigo-500"></div>
          </div>
        ) : (
          <div className="grid grid-cols-2 md:grid-cols-3 gap-4">
            <div className="bg-gradient-to-br from-indigo-500/20 via-blue-500/20 to-cyan-500/20 rounded-xl border border-indigo-500/30 p-6 text-center backdrop-blur-sm">
              <div className="text-3xl font-bold bg-gradient-to-r from-indigo-300 to-cyan-300 bg-clip-text text-transparent mb-2">
                {stats.totalHabits}
              </div>
              <div className="text-sm text-indigo-400 font-medium uppercase tracking-wider">Total Habits</div>
            </div>
            <div className="bg-gradient-to-br from-emerald-500/20 to-cyan-500/20 rounded-xl border border-emerald-500/30 p-6 text-center backdrop-blur-sm">
              <div className="text-3xl font-bold bg-gradient-to-r from-emerald-300 to-cyan-300 bg-clip-text text-transparent mb-2">
                {stats.totalCompletions}
              </div>
              <div className="text-sm text-emerald-400 font-medium uppercase tracking-wider">Completions</div>
            </div>
            <div className="bg-gradient-to-br from-blue-500/20 to-cyan-500/20 rounded-xl border border-blue-500/30 p-6 text-center backdrop-blur-sm">
              <div className="text-3xl font-bold bg-gradient-to-r from-blue-300 to-cyan-300 bg-clip-text text-transparent mb-2">
                {stats.totalJournalEntries}
              </div>
              <div className="text-sm text-blue-400 font-medium uppercase tracking-wider">Journal Entries</div>
            </div>
            <div className="bg-gradient-to-br from-orange-500/20 to-red-500/20 rounded-xl border border-orange-500/30 p-6 text-center backdrop-blur-sm">
              <div className="text-3xl font-bold bg-gradient-to-r from-orange-300 to-red-300 bg-clip-text text-transparent mb-2">
                {stats.currentStreak}
              </div>
              <div className="text-sm text-orange-400 font-medium uppercase tracking-wider">Current Streak</div>
            </div>
            <div className="bg-gradient-to-br from-amber-500/20 to-yellow-500/20 rounded-xl border border-amber-500/30 p-6 text-center backdrop-blur-sm">
              <div className="text-3xl font-bold bg-gradient-to-r from-amber-300 to-yellow-300 bg-clip-text text-transparent mb-2">
                {stats.longestStreak}
              </div>
              <div className="text-sm text-amber-400 font-medium uppercase tracking-wider">Longest Streak</div>
            </div>
            <div className="bg-gradient-to-br from-cyan-500/20 to-blue-500/20 rounded-xl border border-cyan-500/30 p-6 text-center backdrop-blur-sm">
              <div className="text-3xl font-bold bg-gradient-to-r from-cyan-300 to-blue-300 bg-clip-text text-transparent mb-2">
                {stats.thisWeekCompletions}
              </div>
              <div className="text-sm text-cyan-400 font-medium uppercase tracking-wider">This Week</div>
            </div>
          </div>
        )}
      </div>

      {/* App Info */}
      <div className="bg-gradient-to-br from-slate-800/40 via-slate-800/30 to-slate-800/40 backdrop-blur-xl rounded-2xl border border-slate-700/50 shadow-xl shadow-indigo-900/20 p-8">
        <h3 className="text-xl font-bold text-white mb-4">App Information</h3>
        <div className="space-y-3 text-slate-300">
          <div className="flex justify-between items-center py-2 border-b border-slate-700/50">
            <span className="text-slate-400">Version</span>
            <span className="font-semibold text-white">1.0.0</span>
          </div>
          <div className="flex justify-between items-center py-2 border-b border-slate-700/50">
            <span className="text-slate-400">Platform</span>
            <span className="font-semibold text-white">Web App</span>
          </div>
          <div className="flex justify-between items-center py-2 border-b border-slate-700/50">
            <span className="text-slate-400">Framework</span>
            <span className="font-semibold text-white">Next.js 15</span>
          </div>
          <div className="flex justify-between items-center py-2">
            <span className="text-slate-400">Database</span>
            <span className="font-semibold text-white">Supabase</span>
          </div>
        </div>
      </div>
    </div>
  );
};

export default AppTab;
