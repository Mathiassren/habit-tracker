"use client";
import { useState } from "react";
import { supabase } from "@/services/supabase";

export default function CreateHabit({ onHabitCreated, selectedDate }) {
  const [name, setName] = useState("");
  const [loading, setLoading] = useState(false);

  const handleSubmit = async (e) => {
    e.preventDefault();
    setLoading(true);

    const {
      data: { user },
    } = await supabase.auth.getUser();

    if (!user) {
      console.error("User not authenticated.");
      setLoading(false);
      return;
    }

    // Random accent colors for UI
    const colors = ["#a78bfa", "#60a5fa", "#facc15"]; // purple, blue, yellow
    const randomColor = colors[Math.floor(Math.random() * colors.length)];

    const { error } = await supabase.from("habits").insert([
      {
        user_id: user.id,
        name,
        date: selectedDate.format("YYYY-MM-DD"), // ✅ Date-specific
        color: randomColor,
      },
    ]);

    if (!error) {
      setName("");
      onHabitCreated(); // Refresh habits after adding
    } else {
      console.error(error);
    }

    setLoading(false);
  };

  return (
    <form onSubmit={handleSubmit} className="flex gap-2 mt-4">
      <input
        type="text"
        value={name}
        onChange={(e) => setName(e.target.value)}
        placeholder="Enter habit name"
        required
        className="border rounded px-2 py-1 flex-1 bg-gray-900 text-white"
      />
      <button
        type="submit"
        disabled={loading}
        className="bg-purple-600 hover:bg-purple-700 text-white px-4 py-1 rounded"
      >
        {loading ? "Adding..." : "Add Habit"}
      </button>
    </form>
  );
}
