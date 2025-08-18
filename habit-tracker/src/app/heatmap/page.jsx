"use client";

import { useMemo, useState } from "react";
import { useAuth } from "@/hooks/useAuth";
import { useHeatmap } from "@/hooks/useHeatmap";
import HabitHeatmap from "@/app/components/HabitHeatmap";
import HabitQuickComplete from "@/app/components/HabitQuickComplete";

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

  if (loading || !user) return null;

  return (
    <div className="p-8 space-y-6">
      <h1 className="font-play font-bold text-xl">Analyze</h1>
      <h2 className="text-lg font-play text-gray-300">
        Welcome, {user?.user_metadata?.full_name?.split(" ")[0] || "Guest"}!
      </h2>

      <HabitHeatmap byDate={byDate} />
    </div>
  );
}
