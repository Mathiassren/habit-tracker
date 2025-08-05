"use client";
import { useState, useEffect } from "react";
import { supabase } from "@/services/supabase";
import { DatePickerInput } from "@mantine/dates";
import dayjs from "dayjs";
import {
  PlusIcon,
  InformationCircleIcon,
  Bars2Icon,
  TrashIcon,
  CalendarIcon,
} from "@heroicons/react/24/outline";

// ✅ Hook for animated numbers
function useCountUp(targetValue, duration = 500) {
  const [value, setValue] = useState(0);
  useEffect(() => {
    let start = 0;
    const startTime = performance.now();
    const animate = (time) => {
      const elapsed = time - startTime;
      const progress = Math.min(elapsed / duration, 1);
      setValue(start + (targetValue - start) * progress);
      if (progress < 1) requestAnimationFrame(animate);
    };
    requestAnimationFrame(animate);
  }, [targetValue, duration]);
  return Math.round(value);
}

export default function HabitTracker() {
  const [habits, setHabits] = useState([]);
  const [habitProgress, setHabitProgress] = useState({});
  const [habitStatuses, setHabitStatuses] = useState({}); // ✅ For calendar dots
  const [selectedDate, setSelectedDate] = useState(dayjs());
  const [newHabit, setNewHabit] = useState("");

  // Modal states
  const [showEditModal, setShowEditModal] = useState(false);
  const [habitToEdit, setHabitToEdit] = useState(null);
  const [editHabitName, setEditHabitName] = useState("");
  const [selectedColor, setSelectedColor] = useState("purple");

  // Fetch habits for selected date
  const fetchHabits = async (date) => {
    const {
      data: { user },
    } = await supabase.auth.getUser();
    if (!user) return;
    const { data } = await supabase
      .from("habits")
      .select("*")
      .eq("user_id", user.id)
      .eq("date", date.format("YYYY-MM-DD"));
    setHabits(data || []);
  };

  // Fetch progress for selected date
  const fetchProgress = async (date) => {
    const {
      data: { user },
    } = await supabase.auth.getUser();
    if (!user) return;
    const { data } = await supabase
      .from("habit_progress")
      .select("habit_id, completed")
      .eq("user_id", user.id)
      .eq("date", date.format("YYYY-MM-DD"));
    const progressMap = {};
    (data || []).forEach((log) => {
      progressMap[log.habit_id] = log.completed;
    });
    setHabitProgress(progressMap);
  };

  // Fetch habit completion statuses for calendar dots
  const fetchHabitStatuses = async () => {
    const {
      data: { user },
    } = await supabase.auth.getUser();
    if (!user) return;

    const startOfMonth = selectedDate.startOf("month").format("YYYY-MM-DD");
    const endOfMonth = selectedDate.endOf("month").format("YYYY-MM-DD");

    const { data: habitsData } = await supabase
      .from("habits")
      .select("id, date")
      .eq("user_id", user.id)
      .gte("date", startOfMonth)
      .lte("date", endOfMonth);

    const { data: progressData } = await supabase
      .from("habit_progress")
      .select("habit_id, date, completed")
      .eq("user_id", user.id)
      .gte("date", startOfMonth)
      .lte("date", endOfMonth);

    const statusMap = {};
    habitsData?.forEach((habit) => {
      const date = habit.date;
      const habitsForDate = habitsData.filter((h) => h.date === date);
      const progressForDate =
        progressData?.filter((p) => p.date === date) || [];
      const allCompleted =
        habitsForDate.length > 0 &&
        habitsForDate.every((h) =>
          progressForDate.find((p) => p.habit_id === h.id && p.completed)
        );
      statusMap[date] = allCompleted ? "green" : "red";
    });

    setHabitStatuses(statusMap);
  };

  // Add habit
  const addHabit = async (e) => {
    e.preventDefault();
    if (!newHabit.trim()) return;
    const {
      data: { user },
    } = await supabase.auth.getUser();
    if (!user) return;
    await supabase.from("habits").insert([
      {
        user_id: user.id,
        name: newHabit,
        color: "purple",
        date: selectedDate.format("YYYY-MM-DD"),
      },
    ]);
    setNewHabit("");
    fetchHabits(selectedDate);
    fetchHabitStatuses();
  };

  // Toggle completion
  const toggleCompletion = async (habitId) => {
    const dateStr = selectedDate.format("YYYY-MM-DD");
    const completed = !habitProgress[habitId];
    const {
      data: { user },
    } = await supabase.auth.getUser();
    if (!user) return;
    await supabase
      .from("habit_progress")
      .upsert([
        { user_id: user.id, habit_id: habitId, date: dateStr, completed },
      ]);
    setHabitProgress((prev) => ({ ...prev, [habitId]: completed }));
    fetchHabitStatuses();
  };

  // Open Edit Modal (click burger icon)
  const openEditModal = (habit) => {
    setHabitToEdit(habit.id);
    setEditHabitName(habit.name);
    setSelectedColor(habit.color || "purple");
    setShowEditModal(true);
  };

  // Save edits
  const handleSaveHabitChanges = async () => {
    await supabase
      .from("habits")
      .update({ name: editHabitName, color: selectedColor })
      .eq("id", habitToEdit);
    setShowEditModal(false);
    fetchHabits(selectedDate);
  };

  // Delete habit
  const handleDeleteHabit = async () => {
    await supabase.from("habits").delete().eq("id", habitToEdit);
    await supabase.from("habit_progress").delete().eq("habit_id", habitToEdit);
    setShowEditModal(false);
    fetchHabits(selectedDate);
    fetchHabitStatuses();
  };

  useEffect(() => {
    fetchHabits(selectedDate);
    fetchProgress(selectedDate);
    fetchHabitStatuses();
  }, [selectedDate]);

  const completedCount = Object.values(habitProgress).filter(Boolean).length;
  const totalHabits = habits.length;
  const rawProgressPercent =
    totalHabits > 0 ? (completedCount / totalHabits) * 100 : 0;

  const progressPercent = useCountUp(rawProgressPercent, 700);
  const animatedCompletedCount = useCountUp(completedCount, 500);

  return (
    <div className="bg-[#111] text-white p-6 rounded-lg max-w-xl mx-auto relative">
      {/* Date Picker with Dots */}
      <div className="flex items-center w-42 gap-3 mb-6">
        <button
          onClick={() => setSelectedDate(selectedDate.subtract(1, "day"))}
          className="text-gray-400 hover:text-white text-xl"
        >
          ◀
        </button>
        <DatePickerInput
          value={selectedDate.toDate()}
          onChange={(date) => setSelectedDate(dayjs(date))}
          valueFormat="ddd (DD MMM)"
          leftSection={<CalendarIcon className="w-5 h-5 text-gray-400" />}
          renderDay={(date) => {
            const dateStr = dayjs(date).format("YYYY-MM-DD");
            const dotColor = habitStatuses[dateStr];
            return (
              <div className="relative flex items-center justify-center">
                <span>{date.getDate()}</span>
                {dotColor && (
                  <span
                    className="absolute bottom-0 w-1.5 h-1.5 rounded-full"
                    style={{ backgroundColor: dotColor }}
                  />
                )}
              </div>
            );
          }}
          popoverProps={{
            withinPortal: true,
            styles: { dropdown: { backgroundColor: "#000000" } },
          }}
          styles={{
            input: {
              backgroundColor: "#1a1a1a",
              color: "#fff",
              border: "1px solid #333",
            },
            day: { color: "#fff" },
          }}
        />
        <button
          onClick={() => setSelectedDate(selectedDate.add(1, "day"))}
          className="text-gray-400 hover:text-white text-xl"
        >
          ▶
        </button>
      </div>

      {/* Header */}
      <h3 className="text-xl font-bold mb-4">
        Habits for {selectedDate.format("DD MMM YYYY")}
      </h3>

      {/* Progress Bar */}
      <div className="mb-6">
        <div className="flex justify-between text-sm text-gray-400 mb-1">
          <span>Day's Progress</span>
          <span>{progressPercent}% complete</span>
        </div>
        <div className="w-full bg-gray-800 rounded-full h-3 mb-2 overflow-hidden">
          <div
            className="bg-purple-600 h-3 rounded-full transition-all duration-500 ease-in-out"
            style={{ width: `${progressPercent}%` }}
          ></div>
        </div>
        <p className="text-xs text-gray-500">
          {animatedCompletedCount} / {totalHabits} habits
        </p>
      </div>

      {/* Add Habit Form */}
      <form onSubmit={addHabit} className="flex gap-2 mb-6">
        <input
          type="text"
          value={newHabit}
          onChange={(e) => setNewHabit(e.target.value)}
          placeholder="Add a new habit"
          className="flex-1 px-3 py-2 rounded bg-gray-800 text-white"
        />

        <button
          type="submit"
          className="flex items-center gap-1 bg-purple-600 hover:bg-purple-700 px-4 py-2 rounded-md text-sm font-medium"
        >
          <PlusIcon className="h-4 w-4" /> Add
        </button>
      </form>

      {/* Habit Cards */}
      <div className="space-y-3">
        {habits.length === 0 ? (
          <p className="text-gray-500 text-center">
            No habits for this date. Add one above.
          </p>
        ) : (
          habits.map((habit) => (
            <div
              key={habit.id}
              className="flex items-center justify-between bg-gray-900 rounded-lg p-3 border-l-4"
              style={{ borderLeftColor: habit.color || "#9333EA" }}
            >
              <Bars2Icon
                className="h-5 w-5 text-gray-500 cursor-pointer"
                onClick={() => openEditModal(habit)}
              />
              <p className="flex-1 text-center">{habit.name}</p>
              <div className="flex items-center gap-4">
                <InformationCircleIcon className="h-5 w-5 text-gray-400 cursor-pointer" />
                <input
                  type="checkbox"
                  checked={habitProgress[habit.id] || false}
                  onChange={() => toggleCompletion(habit.id)}
                  className="w-5 h-5 accent-purple-600 cursor-pointer"
                />
              </div>
            </div>
          ))
        )}
      </div>

      {/* Edit/Delete Modal */}
      {showEditModal && (
        <div className="absolute inset-0 bg-black bg-opacity-60 flex items-center justify-center">
          <div className="bg-gray-900 p-6 rounded-lg shadow-lg text-center w-80">
            <h4 className="text-lg font-semibold mb-4">Edit Habit</h4>
            <input
              type="text"
              value={editHabitName}
              onChange={(e) => setEditHabitName(e.target.value)}
              className="w-full px-3 py-2 mb-4 rounded bg-gray-800 text-white"
              placeholder="Edit habit name"
            />
            <div className="flex justify-center gap-3 mb-4">
              {["purple", "blue", "yellow", "green", "red"].map((color) => (
                <button
                  key={color}
                  onClick={() => setSelectedColor(color)}
                  className={`w-6 h-6 rounded-full border-2 ${
                    selectedColor === color
                      ? "border-white"
                      : "border-transparent"
                  }`}
                  style={{ backgroundColor: color }}
                />
              ))}
            </div>
            <div className="flex justify-center gap-3">
              <button
                onClick={handleSaveHabitChanges}
                className="bg-purple-600 hover:bg-purple-700 px-4 py-2 rounded text-white"
              >
                Save
              </button>
              <button
                onClick={handleDeleteHabit}
                className="bg-red-600 hover:bg-red-700 px-4 py-2 rounded text-white"
              >
                Delete
              </button>
              <button
                onClick={() => setShowEditModal(false)}
                className="bg-gray-600 hover:bg-gray-700 px-4 py-2 rounded text-white"
              >
                Cancel
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
