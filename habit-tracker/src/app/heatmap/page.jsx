"use client";

import { useAuth } from "@/hooks/useAuth";
import { useHeatmap } from "@/hooks/useHeatmap";
import { useStreaks } from "@/hooks/useStreaks";
import HabitHeatmap from "@/app/components/HabitHeatmap";
import HabitQuickComplete from "@/app/components/HabitQuickComplete";
import { useMemo, useState } from "react";

export default function HeatmapPage() {
  const { user, loading } = useAuth();

  const { since, today, tz, year } = useMemo(() => {
    const y = new Date().getFullYear();
    return {
      since: `${y}-01-01`,
      today: new Date().toISOString().slice(0, 10),
      tz: Intl.DateTimeFormat().resolvedOptions().timeZone || "UTC",
      year: y,
    };
  }, []);

  const [refreshKey, setRefreshKey] = useState(0);
  const refreshHeatmap = () => setRefreshKey((k) => k + 1);

  const { byDate, total } = useHeatmap(user?.id, since, today, tz, refreshKey);
  const { current_streak, longest_streak } = useStreaks(user?.id, tz);

  if (loading || !user) return null;

  return (
    <div className="p-8 space-y-6">
      <h1 className="font-play font-bold text-xl">Analyze</h1>
      <h2 className="text-lg font-play text-gray-300">
        Welcome, {user?.user_metadata?.full_name?.split(" ")[0] || "Guest"}!
      </h2>

      <HabitHeatmap byDate={byDate} />

      <section className="rounded-2xl bg-gray-900/70 border border-gray-800 p-6">
        <h3 className="font-play font-bold text-lg mb-3">
          Habit Stats{" "}
          <span className="ml-2 text-xs px-2 py-0.5 rounded-full bg-purple-800/40 text-purple-300">
            Beta
          </span>
        </h3>
        <div className="grid sm:grid-cols-3 gap-4">
          <Stat label="Current streak" value={`${current_streak}d`} />
          <Stat label="Longest streak" value={`${longest_streak}d`} />
          <Stat label="Total completions" value={total} />
        </div>
      </section>
    </div>
  );
}

function Stat({ label, value }) {
  return (
    <div className="rounded-xl bg-gray-900 border border-gray-800 p-4">
      <div className="text-gray-400 text-xs">{label}</div>
      <div className="text-2xl font-semibold mt-1">{value}</div>
    </div>
  );
}
