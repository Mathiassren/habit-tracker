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
      // Preferred: completed_on exists
      let { data, error } = await supabase
        .from("habit_completions")
        .select("completed_on, completed_at")
        .eq("user_id", userId)
        .gte("completed_on", sinceISO)
        .lte("completed_on", untilISO);

      if (error || !Array.isArray(data)) {
        // Fallback: use completed_at and derive day
        const start = new Date(`${sinceISO}T00:00:00`).toISOString();
        const end = new Date(`${untilISO}T23:59:59.999`).toISOString();
        const res2 = await supabase
          .from("habit_completions")
          .select("completed_at")
          .eq("user_id", userId)
          .gte("completed_at", start)
          .lte("completed_at", end);
        if (res2.error) {
          console.error("useHeatmap fetch error:", res2.error);
          setRows([]);
        } else {
          const counts = {};
          for (const r of res2.data || []) {
            const day = toLocalDay(r.completed_at, tz);
            counts[day] = (counts[day] || 0) + 1;
          }
          setRows(Object.entries(counts).map(([day, cnt]) => ({ day, cnt })));
        }
      } else {
        const counts = {};
        for (const r of data || []) {
          const day = r.completed_on || toLocalDay(r.completed_at, tz);
          counts[day] = (counts[day] || 0) + 1;
        }
        setRows(Object.entries(counts).map(([day, cnt]) => ({ day, cnt })));
      }
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
