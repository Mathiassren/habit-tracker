"use client";
import { useEffect, useMemo, useState } from "react";
import { supabase } from "@/services/supabase";

export function useHeatmap(
  userId,
  sinceDate,
  untilDate,
  tz = "UTC",
  refreshKey = 0
) {
  const [rows, setRows] = useState([]);
  const [loading, setLoading] = useState(true);
  const since = sinceDate;
  const until = untilDate;

  async function fetchHeatmap() {
    if (!userId || !since || !until) {
      setRows([]);
      setLoading(false);
      return;
    }
    setLoading(true);
    const { data, error } = await supabase.rpc("get_heatmap", {
      _uid: userId,
      _since: since,
      _until: until,
      _tz: tz,
    });
    if (error) {
      console.error("heatmap rpc error:", error.message);
      setRows([]);
    } else {
      setRows(data || []);
    }
    setLoading(false);
  }

  useEffect(() => {
    fetchHeatmap();
  }, [userId, since, until, tz, refreshKey]);

  // (Optional) realtime refetch
  useEffect(() => {
    if (!userId) return;
    const ch = supabase
      .channel("completions_rt")
      .on(
        "postgres_changes",
        {
          event: "*",
          schema: "public",
          table: "habit_completions",
          filter: `user_id=eq.${userId}`,
        },
        fetchHeatmap
      )
      .subscribe();
    return () => {
      supabase.removeChannel(ch);
    };
  }, [userId, since, until, tz]);

  const byDate = useMemo(() => {
    const m = {};
    for (const r of rows) m[r.day] = r.cnt;
    return m;
  }, [rows]);

  const total = useMemo(() => rows.reduce((a, r) => a + r.cnt, 0), [rows]);

  return { byDate, total, loading, refetch: fetchHeatmap };
}
