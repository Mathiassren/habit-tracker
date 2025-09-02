// src/components/TaskBoard.jsx
"use client";

import { useEffect, useState } from "react";
import { supabase } from "@/services/supabase/browser";
import TaskCard from "../components/TaskCard"; // your existing card component
import Lottie from "lottie-react";
import LoadingMini from "../../../public/animations/LoadingMini.json";

export default function TaskBoard() {
  const [input, setInput] = useState("");
  const [creating, setCreating] = useState(false);
  const [cards, setCards] = useState([]);
  const [userId, setUserId] = useState(null);

  // Load tasks for the signed-in user
  useEffect(() => {
    let channel;
    (async () => {
      const {
        data: { user },
      } = await supabase.auth.getUser();
      if (!user) return; // not logged in -> nothing to load
      setUserId(user.id);

      const { data, error } = await supabase
        .from("tasks")
        .select("*")
        .order("created_at", { ascending: false });
      if (!error) setCards(data || []);

      // Optional realtime sync
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
    })();

    return () => {
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

    if (error) return alert(error.message);
    setCards((c) => c.map((t) => (t.id === data.id ? data : t)));
  }

  async function deleteCard(id) {
    const prev = cards;
    setCards((c) => c.filter((t) => t.id !== id)); // optimistic
    const { error } = await supabase.from("tasks").delete().eq("id", id);
    if (error) {
      setCards(prev); // rollback on error
      alert(error.message);
    }
  }

  return (
    <div className="max-w-6xl mx-auto p-6 space-y-6">
      <div className="rounded-2xl border border-gray-700 p-4 bg-black/20">
        <label className="block text-sm font-medium mb-2">
          Create a work card
        </label>
        <div className="flex gap-2">
          <input
            className="flex-1 border rounded px-3 py-2 bg-black/30"
            placeholder="Write your task here.."
            value={input}
            onChange={(e) => setInput(e.target.value)}
            onKeyDown={(e) => (e.key === "Enter" ? createCard() : undefined)}
          />
          <button
            className="border rounded px-4 py-2 disabled:opacity-50"
            disabled={creating || !userId}
            onClick={createCard}
          >
            {creating ? (
              <Lottie animationData={LoadingMini} className="w-10 h-10" loop />
            ) : (
              "Create"
            )}
          </button>
        </div>
        {!userId && (
          <p className="text-xs opacity-70 mt-2">Log in to save cards.</p>
        )}
      </div>

      <div className="grid md:grid-cols-2 lg:grid-cols-3 gap-4">
        {cards.map((task) => (
          <TaskCard
            key={task.id}
            task={task}
            onUpdate={updateCard}
            onDelete={deleteCard}
          />
        ))}
        {cards.length === 0 && (
          <div className="opacity-70 text-sm">No cards yet.</div>
        )}
      </div>
    </div>
  );
}
