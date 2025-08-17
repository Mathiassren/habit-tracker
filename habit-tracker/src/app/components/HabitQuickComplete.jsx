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
        if (error) console.error("load habits:", error.message);
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
      const { error } = await supabase.from("habit_completions").insert({
        habit_id: habitId,
        completed_at: new Date().toISOString(),
      });
      if (error) throw error;
      onCompleted?.();
    } catch (e) {
      console.error("complete error:", e.message);
      alert(e.message);
    } finally {
      setBusy(null);
    }
  };

  if (!habits.length) {
    return (
      <div className="rounded-xl bg-gray-900/60 border border-gray-800 p-4 text-sm text-gray-400">
        No habits yet.
      </div>
    );
  }

  return (
    <div className="space-y-2">
      {habits.map((h) => (
        <div
          key={h.id}
          className="flex items-center justify-between rounded-xl bg-gray-900 border border-gray-800 p-3"
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
