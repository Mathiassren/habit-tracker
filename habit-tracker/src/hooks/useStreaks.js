"use client";
import { useEffect, useState } from "react";
import { supabase } from "@/services/supabase";

export function useStreaks(userId, tz = "UTC") {
  const [stats, setStats] = useState({ current_streak: 0, longest_streak: 0 });

  useEffect(() => {
    if (!userId) return;
    (async () => {
      const { data, error } = await supabase.rpc("get_streaks", {
        _uid: userId,
        _tz: tz,
      });
      if (error) {
        console.error(error);
        return;
      }
      // handle either single row or array
      const row = Array.isArray(data) ? data[0] : data;
      if (row) setStats(row);
    })();
  }, [userId, tz]);

  return stats; // { current_streak, longest_streak }
}
