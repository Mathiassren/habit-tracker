"use client";

import { useEffect, useState } from "react";
import { supabase } from "@/services/supabase";

export default function HabitQuickComplete({ onCompleted }) {
  const [habits, setHabits] = useState([]);
  const [busy, setBusy] = useState(null);

  useEffect(() => {
    let cancelled = false;
    (async () => {
      const {
        data: { user },
        error: userError,
      } = await supabase.auth.getUser();
      if (userError || !user) {
        if (!cancelled) setHabits([]);
        return;
      }

      const { data, error } = await supabase
        .from("habits")
        .select("id, name")
        .eq("user_id", user.id)
        .order("created_at", { ascending: true });
      if (!cancelled) {
        if (error) console.error("load habits:", error?.message || error);
        setHabits(data || []);
      }
    })();
    return () => {
      cancelled = true;
    };
  }, []);

  const complete = async (habitId) => {
    try {
      setBusy(habitId);

      const {
        data: { user },
        error: uerr,
      } = await supabase.auth.getUser();
      if (uerr) throw uerr;
      if (!user) throw new Error("Not authenticated");

      const today = new Date().toLocaleDateString("en-CA"); // YYYY-MM-DD

      const { error } = await supabase.from("habit_completions").insert({
        user_id: user.id,
        habit_id: habitId,
        completed_on: today,
        completed_at: new Date().toISOString(),
      });
      if (error) console.error("quick complete:", error);
      onCompleted?.();
    } finally {
      setBusy(null);
    }
  };

  return (
    <div className="space-y-3">
      {habits.map((h) => (
        <div
          key={h.id}
          className="group flex items-center justify-between rounded-xl bg-gradient-to-r from-slate-800/80 via-slate-800/60 to-slate-800/80 backdrop-blur-sm border border-slate-700/50 px-4 py-3 shadow-lg hover:shadow-xl hover:border-indigo-500/50 transition-all duration-300"
        >
          <span className="text-sm font-medium text-slate-200 group-hover:text-white transition-colors">{h.name}</span>
          <button
            onClick={() => complete(h.id)}
            disabled={busy === h.id}
            className="px-4 py-1.5 rounded-lg bg-gradient-to-r from-indigo-600 via-blue-600 to-cyan-600 hover:from-indigo-500 hover:via-blue-500 hover:to-cyan-500 disabled:opacity-50 disabled:cursor-not-allowed text-white font-medium text-sm shadow-lg hover:shadow-xl shadow-indigo-500/30 hover:shadow-indigo-500/50 transition-all duration-300 transform hover:scale-105 active:scale-95"
          >
            {busy === h.id ? "Saving…" : "Complete today"}
          </button>
        </div>
      ))}
    </div>
  );
}
