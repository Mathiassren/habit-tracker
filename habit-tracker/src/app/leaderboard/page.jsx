"use client";

import { useEffect, useState, useMemo } from "react";
import { useAuth } from "@/hooks/useAuth";
import { supabase } from "@/services/supabase";
import { Trophy, Medal, Award, TrendingUp, Users, Calendar, Target } from "lucide-react";
import Image from "next/image";

export default function LeaderboardPage() {
  const { user, loading: authLoading } = useAuth();
  const [leaderboard, setLeaderboard] = useState([]);
  const [loading, setLoading] = useState(true);
  const [sortBy, setSortBy] = useState("total_completions");
  const [error, setError] = useState(null);

  const fetchLeaderboard = async () => {
    setLoading(true);
    setError(null);
    try {
      const yearStart = new Date(new Date().getFullYear(), 0, 1).toISOString();
      
      // Try to use the database function first (if migration has been run)
      const { data: funcData, error: funcError } = await supabase.rpc("get_leaderboard", {
        sort_by: sortBy,
        limit_count: 100,
      });

      if (!funcError && funcData && funcData.length > 0) {
        console.log("Using SQL function, got", funcData.length, "users");
        console.log("Sample data:", funcData.slice(0, 3));
        setLeaderboard(funcData);
        return;
      }
      
      if (funcError) {
        console.warn("SQL function error (using fallback):", funcError);
      }

      // Fallback: Direct query approach
      console.log("Using direct query fallback for leaderboard");
      
      // Get all profiles
      // Try to fetch profiles - if RLS blocks it, we'll get an error and can debug
      const { data: profilesData, error: profilesError } = await supabase
        .from("profiles")
        .select("id, full_name, avatar_url, created_at, updated_at")
        .limit(500);
      
      // Debug: Log profile fetch results
      if (profilesError) {
        console.error("Profile fetch error (RLS issue?):", profilesError);
        console.error("Error details:", {
          message: profilesError.message,
          details: profilesError.details,
          hint: profilesError.hint,
          code: profilesError.code
        });
      } else {
        console.log("Profiles fetched:", profilesData?.length || 0, "profiles");
        if (profilesData && profilesData.length > 0) {
          console.log("Sample profiles:", profilesData.slice(0, 3).map(p => ({
            id: p.id,
            name: p.full_name,
            hasAvatar: !!p.avatar_url
          })));
        }
      }
      
      // Also get users from auth.users who might not have profiles yet
      // Note: We can't directly query auth.users from the client, so we'll use a workaround
      // by getting all user IDs from habit_completions and profiles

      if (profilesError) {
        console.error("Error fetching profiles:", profilesError);
        throw profilesError;
      }

      // Get all user IDs from completions (to find users who might not have profiles)
      // Get ALL completions for stats (not just this year)
      const [{ data: allUserIdsData, error: userIdsError }, { data: allCompletionsData, error: completionsError }, { data: yearCompletionsData, error: yearCompletionsError }] = await Promise.all([
        supabase
          .from("habit_completions")
          .select("user_id")
          .limit(10000),
        supabase
          .from("habit_completions")
          .select("user_id, completed_on, completed_at")
          .limit(50000), // Get all completions for all-time stats
        supabase
          .from("habit_completions")
          .select("user_id, completed_on, completed_at")
          .gte("completed_at", yearStart) // This year's completions for display
      ]);

      if (userIdsError || completionsError || yearCompletionsError) {
        console.error("Error fetching completions:", userIdsError || completionsError || yearCompletionsError);
        throw userIdsError || completionsError || yearCompletionsError;
      }

      // Get unique user IDs from completions (users who have activity but might not have profiles)
      const userIdsFromCompletions = new Set((allUserIdsData || []).map(c => c.user_id));
      const profileIds = new Set((profilesData || []).map(p => p.id));
      
      // Get all unique user IDs
      const allUserIds = Array.from(new Set([
        ...Array.from(profileIds),
        ...Array.from(userIdsFromCompletions)
      ]));
      
      // Fetch user data from API for users without profiles
      const usersWithoutProfiles = allUserIds.filter(id => !profileIds.has(id));
      let additionalUsersData = [];
      
      if (usersWithoutProfiles.length > 0) {
        try {
          const response = await fetch(`/api/users?ids=${usersWithoutProfiles.join(",")}`);
          if (response.ok) {
            const { users } = await response.json();
            additionalUsersData = users || [];
          }
        } catch (error) {
          console.error("Error fetching additional user data:", error);
        }
      }
      
      // Create a map of all users (from profiles + API data)
      const allUsersMap = new Map();
      
      // Add users from profiles
      (profilesData || []).forEach(profile => {
        allUsersMap.set(profile.id, {
          id: profile.id,
          full_name: profile.full_name,
          avatar_url: profile.avatar_url,
          created_at: profile.created_at,
          updated_at: profile.updated_at
        });
      });
      
      // Add users from API (users without profiles)
      additionalUsersData.forEach(user => {
        if (!allUsersMap.has(user.id)) {
          allUsersMap.set(user.id, {
            id: user.id,
            full_name: user.full_name,
            avatar_url: user.avatar_url,
            created_at: user.created_at,
            updated_at: user.updated_at
          });
        }
      });
      
      // Add any remaining users from completions (fallback for users not found elsewhere)
      userIdsFromCompletions.forEach(userId => {
        if (!allUsersMap.has(userId)) {
          allUsersMap.set(userId, {
            id: userId,
            full_name: null,
            avatar_url: null,
            created_at: null,
            updated_at: null
          });
        }
      });

      // Aggregate stats by user (using this year's data for display)
      const statsMap = {};
      (yearCompletionsData || []).forEach((comp) => {
        const uid = comp.user_id;
        if (!statsMap[uid]) {
          statsMap[uid] = {
            total_completions: 0,
            active_days: new Set(),
          };
        }
        statsMap[uid].total_completions++;
        const date = comp.completed_on || comp.completed_at?.split("T")[0];
        if (date) {
          statsMap[uid].active_days.add(date);
        }
      });
      
      // Debug: Log stats to see if data is being fetched
      console.log("Year completions fetched:", yearCompletionsData?.length || 0);
      console.log("Stats map:", Object.keys(statsMap).length, "users with completions");
      if (Object.keys(statsMap).length > 0) {
        const sampleStats = Object.entries(statsMap).slice(0, 3);
        console.log("Sample stats:", sampleStats.map(([id, stats]) => ({
          id,
          completions: stats.total_completions,
          activeDays: stats.active_days.size
        })));
      }

      // Build leaderboard entries - include ALL existing users (from profiles + auth.users)
      const leaderboardData = Array.from(allUsersMap.values())
        .map((user) => {
          const stats = statsMap[user.id] || { total_completions: 0, active_days: new Set() };
          
          // Extract first name only (split by space and take first part)
          const getFirstName = (fullName) => {
            if (!fullName) return "Anonymous User";
            const parts = fullName.trim().split(/\s+/);
            return parts[0] || "Anonymous User";
          };
          
          const entry = {
            user_id: user.id,
            display_name: getFirstName(user.full_name),
            avatar_url: user.avatar_url || "/default-avatar.png",
            total_completions: stats.total_completions || 0,
            active_days: stats.active_days?.size || 0,
            current_streak: 0,
            joined_at: user.created_at || user.updated_at || new Date().toISOString(),
            rank: 0,
          };
          
          // Debug first few entries
          if (Math.random() < 0.1) { // Log 10% of entries for debugging
            console.log("Leaderboard entry:", entry);
          }
          
          return entry;
        })
        .sort((a, b) => {
          if (sortBy === "active_days") {
            return b.active_days - a.active_days;
          }
          return b.total_completions - a.total_completions;
        })
        .map((entry, index) => ({
          ...entry,
          rank: index + 1,
        }));

      setLeaderboard(leaderboardData);
    } catch (err) {
      console.error("Error fetching leaderboard:", err);
      setError(err.message || "Failed to load leaderboard. Please try again later.");
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    if (!authLoading) {
      fetchLeaderboard();
    }
  }, [sortBy, authLoading]);

  const currentUserRank = useMemo(() => {
    if (!user) return null;
    return leaderboard.findIndex((entry) => entry.user_id === user.id) + 1;
  }, [leaderboard, user]);

  const getRankIcon = (rank) => {
    if (rank === 1) return <Trophy className="w-full h-full text-yellow-400" />;
    if (rank === 2) return <Medal className="w-full h-full text-gray-300" />;
    if (rank === 3) return <Award className="w-full h-full text-amber-600" />;
    return null;
  };

  const getRankColor = (rank) => {
    // All entries use consistent styling now, special colors only for text/icons
    return "from-slate-800/60 via-slate-800/40 to-slate-800/60";
  };

  if (authLoading || loading) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-slate-950 via-indigo-950/20 to-slate-950 flex items-center justify-center">
        <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-indigo-500"></div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gradient-to-br from-slate-950 via-indigo-950/20 to-slate-950">
      {/* Background Pattern */}
      <div className="absolute inset-0 bg-[radial-gradient(circle_at_1px_1px,_rgba(99,102,241,0.15)_1px,_transparent_0)] bg-[size:24px_24px] opacity-40"></div>
      
      <div className="relative z-10 max-w-5xl mx-auto px-4 sm:px-6 py-6 sm:py-12">
        {/* Header Section */}
        <div className="mb-8 sm:mb-12">
          <div className="flex flex-col sm:flex-row items-start sm:items-center gap-4 sm:gap-5 mb-6">
            {/* Icon with enhanced glow effect */}
            <div className="relative flex-shrink-0">
              <div className="absolute inset-0 rounded-xl bg-gradient-to-br from-yellow-500/70 via-amber-500/70 to-orange-500/70 blur-2xl opacity-50"></div>
              <div className="relative w-12 h-12 sm:w-14 sm:h-14 rounded-xl bg-gradient-to-br from-yellow-500 via-amber-500 to-orange-500 flex items-center justify-center shadow-2xl shadow-yellow-500/60 ring-2 ring-yellow-400/30 transition-transform hover:scale-105">
                <Trophy className="w-6 h-6 sm:w-7 sm:h-7 text-white drop-shadow-lg" />
              </div>
            </div>
            <div className="flex-1 min-w-0">
              <h1 className="text-3xl sm:text-4xl md:text-5xl font-bold leading-tight mb-2">
                <span className="bg-gradient-to-r from-yellow-400 via-amber-400 to-orange-400 bg-clip-text text-transparent">
                  Leaderboard
                </span>
              </h1>
              <p className="text-slate-400 text-sm sm:text-base md:text-lg leading-relaxed">
                Compete with other users and see who's on top
              </p>
            </div>
          </div>

          {/* Sort Options */}
          <div className="flex flex-wrap gap-2 sm:gap-3 mb-4 sm:mb-6">
            <button
              onClick={() => setSortBy("total_completions")}
              className={`px-3 py-1.5 sm:px-4 sm:py-2 rounded-lg sm:rounded-xl border transition-all text-xs sm:text-sm ${
                sortBy === "total_completions"
                  ? "bg-gradient-to-r from-indigo-600 to-blue-600 border-indigo-500 text-white shadow-lg shadow-indigo-500/30"
                  : "bg-slate-800/40 border-slate-700/50 text-slate-300 hover:border-indigo-500/50"
              }`}
            >
              <div className="flex items-center gap-1.5 sm:gap-2">
                <Target className="w-3 h-3 sm:w-4 sm:h-4" />
                <span className="font-medium">Total Completions</span>
              </div>
            </button>
            <button
              onClick={() => setSortBy("active_days")}
              className={`px-3 py-1.5 sm:px-4 sm:py-2 rounded-lg sm:rounded-xl border transition-all text-xs sm:text-sm ${
                sortBy === "active_days"
                  ? "bg-gradient-to-r from-indigo-600 to-blue-600 border-indigo-500 text-white shadow-lg shadow-indigo-500/30"
                  : "bg-slate-800/40 border-slate-700/50 text-slate-300 hover:border-indigo-500/50"
              }`}
            >
              <div className="flex items-center gap-1.5 sm:gap-2">
                <Calendar className="w-3 h-3 sm:w-4 sm:h-4" />
                <span className="font-medium">Active Days</span>
              </div>
            </button>
          </div>

          {/* Current User Rank */}
          {currentUserRank && currentUserRank > 0 && (
            <div className="mb-4 sm:mb-6 bg-gradient-to-r from-indigo-600/20 via-blue-600/20 to-cyan-600/20 backdrop-blur-xl rounded-lg sm:rounded-xl border border-indigo-500/30 p-3 sm:p-4">
              <div className="flex items-center gap-2 sm:gap-3">
                <div className="w-8 h-8 sm:w-10 sm:h-10 rounded-lg bg-indigo-500/20 flex items-center justify-center border border-indigo-500/30 flex-shrink-0">
                  <TrendingUp className="w-4 h-4 sm:w-5 sm:h-5 text-indigo-400" />
                </div>
                <div className="min-w-0 flex-1">
                  <p className="text-xs sm:text-sm text-slate-400">Your Rank</p>
                  <p className="text-lg sm:text-xl font-bold text-white truncate">
                    #{currentUserRank} out of {leaderboard.length} users
                  </p>
                </div>
              </div>
            </div>
          )}
        </div>

        {/* Leaderboard List */}
        {error ? (
          <div className="bg-red-500/20 border border-red-500/30 rounded-xl p-6 text-center">
            <p className="text-red-400">{error}</p>
            <button
              onClick={fetchLeaderboard}
              className="mt-4 px-4 py-2 bg-red-500/20 hover:bg-red-500/30 rounded-lg text-red-300 transition-colors"
            >
              Retry
            </button>
          </div>
        ) : leaderboard.length === 0 ? (
          <div className="bg-gradient-to-br from-slate-800/40 via-slate-800/30 to-slate-800/40 backdrop-blur-xl rounded-xl sm:rounded-2xl border border-slate-700/50 p-8 sm:p-12 text-center">
            <Users className="w-12 h-12 sm:w-16 sm:h-16 mx-auto mb-3 sm:mb-4 text-slate-500" />
            <p className="text-slate-400 text-base sm:text-lg">No users found</p>
            <p className="text-slate-500 text-xs sm:text-sm mt-2">Be the first to complete a habit!</p>
          </div>
        ) : (
          <div className="space-y-2 sm:space-y-3">
            {leaderboard.map((entry, index) => {
              const isCurrentUser = user?.id === entry.user_id;
              return (
                <div
                  key={entry.user_id}
                  className={`bg-gradient-to-br from-slate-800/60 via-slate-800/40 to-slate-800/60 backdrop-blur-xl rounded-xl sm:rounded-2xl border border-slate-700/50 p-4 sm:p-5 transition-all hover:border-slate-600/50 ${
                    isCurrentUser ? "ring-2 ring-indigo-500/50 shadow-lg shadow-indigo-500/20" : ""
                  } ${entry.rank <= 3 ? "shadow-lg" : ""}`}
                >
                  <div className="flex items-center gap-3 sm:gap-4">
                    {/* Rank - Always show, with special styling for top 3 */}
                    <div className="flex items-center justify-center w-10 h-10 sm:w-12 sm:h-12 flex-shrink-0">
                      {entry.rank <= 3 ? (
                        <div className={`w-8 h-8 sm:w-10 sm:h-10 ${
                          entry.rank === 1 ? "text-yellow-400" :
                          entry.rank === 2 ? "text-gray-300" :
                          "text-amber-600"
                        }`}>
                          {getRankIcon(entry.rank)}
                        </div>
                      ) : (
                        <div className="w-10 h-10 sm:w-12 sm:h-12 rounded-lg bg-slate-700/50 flex items-center justify-center border border-slate-600/50">
                          <span className="text-lg sm:text-xl font-bold text-slate-400">#{entry.rank}</span>
                        </div>
                      )}
                    </div>

                    {/* Avatar */}
                    <div className="relative w-10 h-10 sm:w-12 sm:h-12 rounded-full overflow-hidden border-2 border-slate-600/50 flex-shrink-0 ring-2 ring-slate-700/50">
                      <Image
                        src={entry.avatar_url || "/default-avatar.png"}
                        alt={entry.display_name}
                        fill
                        className="object-cover"
                        unoptimized
                      />
                    </div>

                    {/* User Info */}
                    <div className="flex-1 min-w-0">
                      <div className="flex items-center gap-2 mb-1.5">
                        <h3 className="text-base sm:text-lg font-bold text-white truncate">
                          {entry.display_name}
                        </h3>
                        {isCurrentUser && (
                          <span className="px-2 py-0.5 rounded-full text-xs font-medium bg-indigo-500/20 text-indigo-300 border border-indigo-500/30 flex-shrink-0">
                            You
                          </span>
                        )}
                      </div>
                      <div className="flex items-center gap-3 sm:gap-5">
                        <div className="flex items-center gap-1.5">
                          <div className="w-2 h-2 rounded-full bg-indigo-400"></div>
                          <span className="text-xs sm:text-sm text-slate-400 font-medium">
                            {typeof entry.total_completions === 'number' 
                              ? entry.total_completions.toLocaleString() 
                              : (entry.total_completions || 0)} <span className="hidden sm:inline">completions</span>
                          </span>
                        </div>
                        <div className="flex items-center gap-1.5">
                          <div className="w-2 h-2 rounded-full bg-blue-400"></div>
                          <span className="text-xs sm:text-sm text-slate-400 font-medium">
                            {typeof entry.active_days === 'number' 
                              ? entry.active_days.toLocaleString() 
                              : (entry.active_days || 0)} <span className="hidden sm:inline">days</span>
                          </span>
                        </div>
                      </div>
                    </div>

                    {/* Main Stat Badge - Shows the sorted stat prominently */}
                    <div className="text-right flex-shrink-0 min-w-[60px] sm:min-w-[80px]">
                      <div className={`text-2xl sm:text-3xl font-bold ${
                        entry.rank === 1 ? "text-yellow-400" :
                        entry.rank === 2 ? "text-gray-300" :
                        entry.rank === 3 ? "text-amber-500" :
                        "text-white"
                      }`}>
                        {sortBy === "total_completions" ? (
                          typeof entry.total_completions === 'number' 
                            ? entry.total_completions.toLocaleString() 
                            : (entry.total_completions || 0)
                        ) : (
                          typeof entry.active_days === 'number' 
                            ? entry.active_days.toLocaleString() 
                            : (entry.active_days || 0)
                        )}
                      </div>
                      <div className="text-[10px] sm:text-xs text-slate-400 uppercase tracking-wider mt-0.5">
                        {sortBy === "total_completions" ? "Total" : "Days"}
                      </div>
                    </div>
                  </div>
                </div>
              );
            })}
          </div>
        )}
      </div>
    </div>
  );
}

