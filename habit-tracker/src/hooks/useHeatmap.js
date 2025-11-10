"use client";
import { useEffect, useMemo, useState, useCallback } from "react";
import { supabase } from "@/services/supabase";

const isISO = (s) => typeof s === "string" && /^\d{4}-\d{2}-\d{2}$/.test(s);
const toLocalDay = (ts, tz = "UTC") =>
  new Date(ts).toLocaleDateString("en-CA", {
    timeZone: tz || "UTC",
  });

export function useHeatmap(
  userId,
  sinceISO,
  untilISO,
  tz = "UTC",
  refreshKey = 0
) {
  const [rows, setRows] = useState([]);
  const [loading, setLoading] = useState(true);

  const fetchHeatmap = useCallback(async () => {
    if (!userId || !isISO(sinceISO) || !isISO(untilISO)) {
      setRows([]);
      setLoading(false);
      return;
    }
    setLoading(true);

    try {
      // Fetch ALL completions for the user in the date range, regardless of completed_on
      const start = new Date(`${sinceISO}T00:00:00`).toISOString();
      const end = new Date(`${untilISO}T23:59:59.999`).toISOString();
      
      // Query using completed_at to ensure we get all records
      const { data, error } = await supabase
        .from("habit_completions")
        .select("completed_at, completed_on")
        .eq("user_id", userId)
        .gte("completed_at", start)
        .lte("completed_at", end);

      if (error) {
        console.error("useHeatmap fetch error:", error);
        setRows([]);
        setLoading(false);
        return;
      }

      // Process all records - prefer completed_on if available, otherwise derive from completed_at
      const counts = {};
      for (const r of data || []) {
        let day;
        if (r.completed_on && isISO(r.completed_on)) {
          day = r.completed_on;
        } else if (r.completed_at) {
          day = toLocalDay(r.completed_at, tz);
        } else {
          continue; // Skip invalid records
        }
        
        // Only count days within our range
        if (day >= sinceISO && day <= untilISO) {
          counts[day] = (counts[day] || 0) + 1;
        }
      }
      
      const result = Object.entries(counts).map(([day, cnt]) => ({ day, cnt }));
      console.log("Heatmap data loaded:", result.length, "days with completions");
      setRows(result);
    } catch (e) {
      console.error("useHeatmap fetch exception:", e);
      setRows([]);
    } finally {
      setLoading(false);
    }
  }, [userId, sinceISO, untilISO, tz]);

  useEffect(() => {
    fetchHeatmap();

    // Realtime: update when completions change for this user
    if (!userId) return;
    const ch = supabase
      .channel("heatmap-realtime")
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
  }, [userId, sinceISO, untilISO, tz, refreshKey, fetchHeatmap]);

  const byDate = useMemo(() => {
    const m = {};
    for (const r of rows) m[r.day] = r.cnt;
    return m;
  }, [rows]);

  const total = useMemo(() => rows.reduce((a, r) => a + r.cnt, 0), [rows]);

  return { byDate, total, loading, refetch: fetchHeatmap };
}
