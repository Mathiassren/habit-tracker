// src/components/TaskBoard.jsx
"use client";

import { useEffect, useState } from "react";
import { supabase } from "@/services/supabase";
import TaskCard from "../components/TaskCard";

export default function TaskBoard() {
  const [input, setInput] = useState("");
  const [creating, setCreating] = useState(false);
  const [cards, setCards] = useState([]);
  const [userId, setUserId] = useState(null);

  // Load tasks for the signed-in user
  useEffect(() => {
    let channel;
    let cancelled = false;
    (async () => {
      const {
        data: { user },
      } = await supabase.auth.getUser();
      if (!user || cancelled) return; // not logged in -> nothing to load
      setUserId(user.id);

      const { data, error } = await supabase
        .from("tasks")
        .select("*")
        .eq("user_id", user.id)
        .order("created_at", { ascending: false });
      if (!cancelled && !error) setCards(data || []);

      // Optional realtime sync
      if (!cancelled) {
        channel = supabase
          .channel("tasks-realtime")
          .on(
            "postgres_changes",
            { event: "*", schema: "public", table: "tasks" },
            (payload) => {
              const row = payload.new || payload.old;
              if (row.user_id !== user.id) return;
              if (payload.eventType === "INSERT")
                setCards((c) => [payload.new, ...c]);
              if (payload.eventType === "UPDATE")
                setCards((c) =>
                  c.map((t) => (t.id === row.id ? payload.new : t))
                );
              if (payload.eventType === "DELETE")
                setCards((c) => c.filter((t) => t.id !== row.id));
            }
          )
          .subscribe();
      }
    })();

    return () => {
      cancelled = true;
      if (channel) supabase.removeChannel(channel);
    };
  }, []);

  // Create card via your existing /api/plan, then INSERT into tasks
  async function createCard() {
    const text = input.trim();
    if (!text || creating || !userId) return;
    setCreating(true);
    try {
      const plan = await fetch("/api/plan", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ prompt: text }),
      }).then((r) => r.json());

      if (!plan?.ok) return alert("Could not create task.");

      const t = plan.task;
      const { data, error } = await supabase
        .from("tasks")
        .insert({
          user_id: userId,
          title: t.title,
          summary: t.summary,
          priority: t.priority,
          status: t.status,
          due_iso: t.due_iso,
          tags: t.tags,
          steps: t.steps,
          acceptance_criteria: t.acceptance_criteria,
        })
        .select()
        .single();

      if (error) return alert(error.message);
      setCards((c) => [data, ...c]);
      setInput("");
    } finally {
      setCreating(false);
    }
  }

  // Persist edits (e.g., toggling a step checkbox inside TaskCard)
  async function updateCard(next) {
    try {
      const { data, error } = await supabase
        .from("tasks")
        .update({
          title: next.title,
          summary: next.summary,
          priority: next.priority,
          status: next.status,
          due_iso: next.due_iso,
          tags: next.tags,
          steps: next.steps,
          acceptance_criteria: next.acceptance_criteria,
        })
        .eq("id", next.id)
        .select()
        .single();

      if (error) {
        alert(error.message);
        return;
      }
      setCards((c) => c.map((t) => (t.id === data.id ? data : t)));
    } catch (error) {
      console.error("Error updating card:", error);
      alert("Failed to update card. Please try again.");
    }
  }

  async function deleteCard(id) {
    const prev = cards;
    setCards((c) => c.filter((t) => t.id !== id)); // optimistic
    try {
      const { error } = await supabase.from("tasks").delete().eq("id", id);
      if (error) {
        setCards(prev); // rollback on error
        alert(error.message);
      }
    } catch (error) {
      setCards(prev); // rollback on error
      console.error("Error deleting card:", error);
      alert("Failed to delete card. Please try again.");
    }
  }

  return (
    <div className="space-y-6">
      {/* Create Task Card */}
      <div className="bg-gradient-to-br from-slate-800/40 via-slate-800/30 to-slate-800/40 backdrop-blur-xl rounded-2xl border border-slate-700/50 shadow-2xl shadow-indigo-900/20 p-6">
        <div className="flex items-center gap-3 mb-4">
          <div className="w-10 h-10 rounded-xl bg-gradient-to-br from-indigo-500 via-blue-500 to-cyan-500 flex items-center justify-center shadow-lg shadow-indigo-500/50">
            <span className="text-white text-xl">✨</span>
          </div>
          <div>
            <h2 className="text-xl font-bold text-white">Create New Task</h2>
            <p className="text-sm text-slate-400">Let AI help you plan your work</p>
          </div>
        </div>
        <div className="flex gap-3">
          <input
            className="flex-1 bg-slate-700/30 border border-slate-600/30 rounded-xl px-4 py-3 text-white placeholder-slate-400 focus:outline-none focus:ring-2 focus:ring-indigo-500/50 focus:border-indigo-500 transition-all"
            placeholder="Describe your task or goal..."
            value={input}
            onChange={(e) => setInput(e.target.value)}
            onKeyDown={(e) => {
              if (e.key === "Enter" && !e.shiftKey) {
                e.preventDefault();
                createCard();
              }
            }}
            disabled={creating || !userId}
          />
          <button
            className="px-6 py-3 rounded-xl bg-gradient-to-r from-indigo-600 via-blue-600 to-cyan-600 hover:from-indigo-500 hover:via-blue-500 hover:to-cyan-500 disabled:opacity-50 disabled:cursor-not-allowed text-white font-medium shadow-lg shadow-indigo-500/30 transition-all disabled:hover:from-indigo-600 disabled:hover:via-blue-600 disabled:hover:to-cyan-600"
            disabled={creating || !userId || !input.trim()}
            onClick={createCard}
          >
            {creating ? (
              <span className="flex items-center gap-2">
                <span className="w-4 h-4 border-2 border-white/30 border-t-white rounded-full animate-spin"></span>
                Creating...
              </span>
            ) : (
              "Create"
            )}
          </button>
        </div>
        {!userId && (
          <p className="text-xs text-slate-400 mt-3 flex items-center gap-2">
            <span>⚠️</span>
            Log in to save and manage tasks.
          </p>
        )}
      </div>

      {/* Tasks Grid */}
      {cards.length === 0 ? (
        <div className="bg-gradient-to-br from-slate-800/40 via-slate-800/30 to-slate-800/40 backdrop-blur-xl rounded-2xl border border-slate-700/50 p-12 text-center">
          <div className="w-16 h-16 mx-auto mb-4 rounded-full bg-slate-700/30 flex items-center justify-center">
            <span className="text-slate-500 text-2xl">📋</span>
          </div>
          <p className="text-slate-400 text-lg mb-2">No tasks yet</p>
          <p className="text-slate-500 text-sm">Create your first AI-powered task above!</p>
        </div>
      ) : (
        <div>
          <h3 className="text-xl font-bold text-white mb-4 flex items-center gap-2">
            <div className="w-1 h-6 bg-gradient-to-b from-indigo-500 to-cyan-500 rounded-full"></div>
            Your Tasks ({cards.length})
          </h3>
          <div className="grid md:grid-cols-2 lg:grid-cols-3 gap-4">
            {cards.map((task) => (
              <TaskCard
                key={task.id}
                task={task}
                onUpdate={updateCard}
                onDelete={deleteCard}
              />
            ))}
          </div>
        </div>
      )}
    </div>
  );
}
