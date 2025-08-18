"use client";

import { useEffect, useState } from "react";
import { supabase } from "@/services/supabase";

export default function HabitQuickComplete({ onCompleted }) {
  const [habits, setHabits] = useState([]);
  const [busy, setBusy] = useState(null);

  useEffect(() => {
    let cancelled = false;
    (async () => {
      const { data, error } = await supabase
        .from("habits")
        .select("id, name")
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
    <div className="space-y-2">
      {habits.map((h) => (
        <div
          key={h.id}
          className="flex items-center justify-between rounded-lg bg-gray-800 px-3 py-2"
        >
          <span className="text-sm">{h.name}</span>
          <button
            onClick={() => complete(h.id)}
            disabled={busy === h.id}
            className="px-3 py-1 rounded-lg bg-purple-600 hover:bg-purple-700 disabled:opacity-50"
          >
            {busy === h.id ? "Saving…" : "Complete today"}
          </button>
        </div>
      ))}
    </div>
  );
}
