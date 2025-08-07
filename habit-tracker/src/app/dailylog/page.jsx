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
  ChevronLeftIcon,
  ChevronRightIcon,
  EnvelopeIcon,
} from "@heroicons/react/24/outline";
import { EnvelopeOpenIcon } from "@radix-ui/react-icons";

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
  const [habitStatuses, setHabitStatuses] = useState({});
  const [selectedDate, setSelectedDate] = useState(dayjs());

  //add notes
  const [selectedHabit, setSelectedHabit] = useState(null);
  const [noteInput, setNoteInput] = useState("");
  const [showNoteModal, setShowNoteModal] = useState(false);

  // Modal states
  const [showHabitModal, setShowHabitModal] = useState(false);
  const [habitName, setHabitName] = useState("");
  const [habitColor, setHabitColor] = useState("purple");

  const [showDeleteModal, setShowDeleteModal] = useState(false);
  const [habitToDelete, setHabitToDelete] = useState(null);

  // Fetch habits
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

  // Fetch progress
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
    (data || []).forEach((log) => (progressMap[log.habit_id] = log.completed));
    setHabitProgress(progressMap);
  };

  // Calendar habit status dots
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

  // Add new habit
  const handleAddHabit = async () => {
    if (!habitName.trim()) return;
    const {
      data: { user },
    } = await supabase.auth.getUser();
    if (!user) return;
    await supabase.from("habits").insert([
      {
        user_id: user.id,
        name: habitName,
        color: habitColor,
        date: selectedDate.format("YYYY-MM-DD"),
      },
    ]);
    setHabitName("");
    setHabitColor("purple");
    setShowHabitModal(false);
    setHabitProgress({});
    fetchHabits(selectedDate);
    fetchHabitStatuses();
  };

  // Toggle completion
  const toggleCompletion = async (habitId) => {
    const dateStr = selectedDate.format("YYYY-MM-DD");
    const currentStatus = habitProgress[habitId] || false;
    const newStatus = !currentStatus;

    const {
      data: { user },
    } = await supabase.auth.getUser();
    if (!user) return;

    const { data: existing } = await supabase
      .from("habit_progress")
      .select("*")
      .eq("user_id", user.id)
      .eq("habit_id", habitId)
      .eq("date", dateStr)
      .single();

    if (existing) {
      await supabase
        .from("habit_progress")
        .update({ completed: newStatus })
        .eq("user_id", user.id)
        .eq("habit_id", habitId)
        .eq("date", dateStr);
    } else {
      await supabase.from("habit_progress").insert([
        {
          user_id: user.id,
          habit_id: habitId,
          date: dateStr,
          completed: newStatus,
        },
      ]);
    }

    setHabitProgress((prev) => ({
      ...prev,
      [habitId]: newStatus,
    }));

    fetchHabitStatuses();
  };

  //Update habit note
  const updateHabitNote = async (habitId, note) => {
    const {
      data: { user },
    } = await supabase.auth.getUser();
    if (!user) return;

    await supabase
      .from("habits")
      .update({ note })
      .eq("user_id", user.id)
      .eq("id", habitId);

    // Update state
    setHabits((prev) =>
      prev.map((h) => (h.id === habitId ? { ...h, note } : h))
    );
  };

  // Delete habit
  const confirmDeleteHabit = async () => {
    await supabase.from("habits").delete().eq("id", habitToDelete);
    await supabase
      .from("habit_progress")
      .delete()
      .eq("habit_id", habitToDelete);
    setShowDeleteModal(false);
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
  const progressPercent = useCountUp(
    totalHabits > 0 ? (completedCount / totalHabits) * 100 : 0,
    700
  );
  const animatedCompletedCount = useCountUp(completedCount, 500);

  return (
    <div className="bg-[#111] text-white p-6 rounded-lg max-w-xl mx-auto relative">
      {/* Date Picker */}
      <div className="flex items-center w-42 gap-3 mb-6">
        <button
          onClick={() => setSelectedDate(selectedDate.subtract(1, "day"))}
        >
          <ChevronLeftIcon className="w-5 h-5 text-[#9333EA]" />
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
                    className="absolute w-1.5 mt-4 h-1.5 rounded-full"
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
        <button onClick={() => setSelectedDate(selectedDate.add(1, "day"))}>
          <ChevronRightIcon className="w-5 h-5 text-[#9333EA]" />
        </button>
      </div>

      {/* Progress */}
      <h3 className="text-xl font-bold mb-4">
        Habits for {selectedDate.format("DD MMM YYYY")}
      </h3>
      <div className="mb-6">
        <div className="flex justify-between text-sm text-gray-400 mb-1">
          <span>Day's Progress</span>
          <span>{progressPercent}% complete</span>
        </div>
        <div className="w-full bg-gray-800 rounded-full h-3 mb-2 overflow-hidden">
          <div
            className="bg-purple-600 h-3 rounded-full transition-all duration-500 ease-in-out"
            style={{ width: `${progressPercent}%` }}
          />
        </div>
        <p className="text-xs text-gray-500">
          {animatedCompletedCount} / {totalHabits} habits
        </p>
      </div>

      {/* Add Habit Button */}
      <div
        className="border-dashed border-2 border-gray-600 p-4 text-center rounded cursor-pointer"
        onClick={() => setShowHabitModal(true)}
      >
        <p className="text-gray-400">
          Add a new habit <PlusIcon className="inline w-4 h-4" />
        </p>
      </div>

      {/* Habit List */}
      <div className="space-y-3 mt-4">
        {habits.length === 0 ? (
          <p className="text-gray-500 text-center">No habits found.</p>
        ) : (
          habits.map((habit) => (
            <div
              key={habit.id}
              className="flex items-center justify-between bg-gray-900 rounded-lg p-3 border-l-4"
              style={{ borderLeftColor: habit.color || "#9333EA" }}
            >
              <Bars2Icon className="h-5 w-5 text-gray-500 cursor-pointer" />
              <p
                className="flex-1 text-center flex justify-center items-center cursor-pointer"
                onClick={() => {
                  setSelectedHabit(habit);
                  setNoteInput(habit.note || "");
                  setShowNoteModal(true);
                }}
              >
                <EnvelopeIcon className="mr-4 w-4 h-4" /> {habit.name}
              </p>

              <div className="flex items-center gap-4">
                <InformationCircleIcon className="h-5 w-5 text-gray-400 cursor-pointer" />
                <input
                  type="checkbox"
                  checked={habitProgress[habit.id] || false}
                  onChange={() => toggleCompletion(habit.id)}
                  className="w-5 h-5 accent-purple-600 cursor-pointer"
                />
                <TrashIcon
                  className="h-5 w-5 text-red-500 cursor-pointer"
                  onClick={() => {
                    setHabitToDelete(habit.id);
                    setShowDeleteModal(true);
                  }}
                />
              </div>
            </div>
          ))
        )}
      </div>

      {/* Add Habit Modal */}
      {showHabitModal && (
        <div className="fixed inset-0 bg-black bg-opacity-60 flex items-center justify-center z-50">
          <div className="bg-gray-900 p-6 rounded-lg shadow-lg w-80 text-center">
            <h4 className="text-lg font-semibold mb-2">New Habit ✨</h4>
            <p className="text-gray-400 text-sm mb-4">Add a new habit.</p>
            <input
              type="text"
              value={habitName}
              onChange={(e) => setHabitName(e.target.value)}
              placeholder="Give your habit a name"
              className="w-full px-3 py-2 mb-4 rounded bg-gray-800 text-white"
            />

            <p className="text-sm text-gray-400 mb-2">Choose a color:</p>
            <div className="flex justify-center gap-2 mb-4">
              {[
                "purple",
                "blue",
                "yellow",
                "green",
                "red",
                "orange",
                "pink",
              ].map((color) => (
                <button
                  key={color}
                  onClick={() => setHabitColor(color)}
                  className={`w-6 h-6 rounded-full border-2 ${
                    habitColor === color ? "border-white" : "border-transparent"
                  }`}
                  style={{ backgroundColor: color }}
                />
              ))}
            </div>
            {!habitName ? (
              <p className="text-red-500 text-sm mb-4">
                Please write a name for the habit.
              </p>
            ) : null}
            <div className="flex justify-between mt-4">
              <button
                onClick={() => setShowHabitModal(false)}
                className="bg-gray-600 hover:bg-gray-700 px-4 py-2 rounded text-white"
              >
                Close
              </button>

              <button
                onClick={handleAddHabit}
                className="bg-purple-600 hover:bg-purple-700 px-4 py-2 rounded text-white"
              >
                Add Habit
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Delete Confirmation */}
      {showDeleteModal && (
        <div className="fixed inset-0 bg-black bg-opacity-60 flex items-center justify-center z-50">
          <div className="bg-gray-900 p-6 rounded-lg shadow-lg text-center">
            <h4 className="text-lg font-semibold mb-4">Delete Habit</h4>
            <p className="mb-6">Are you sure you want to delete this habit?</p>
            <div className="flex justify-center gap-4">
              <button
                onClick={confirmDeleteHabit}
                className="bg-red-600 hover:bg-red-700 px-4 py-2 rounded text-white"
              >
                Delete
              </button>
              <button
                onClick={() => setShowDeleteModal(false)}
                className="bg-gray-600 hover:bg-gray-700 px-4 py-2 rounded text-white"
              >
                Cancel
              </button>
            </div>
          </div>
        </div>
      )}
      {showNoteModal && selectedHabit && (
        <div className="fixed inset-0 bg-black p-4 bg-opacity-60 flex items-center justify-center z-50">
          <div className="bg-gray-900 p-6 rounded-lg shadow-lg w-96 text-white">
            <h4 className="text-lg font-semibold mb-4">
              Habit: {selectedHabit.name}
            </h4>

            <textarea
              className="w-full h-32 p-2 bg-gray-800 text-white rounded border border-gray-700"
              placeholder="Write a note for this habit..."
              value={noteInput}
              onChange={(e) => setNoteInput(e.target.value)}
            />

            <div className="flex justify-end mt-4 gap-2">
              <button
                className="bg-gray-600 hover:bg-gray-700 px-4 py-2 rounded"
                onClick={() => setShowNoteModal(false)}
              >
                Close
              </button>
              <button
                className="bg-purple-600 hover:bg-purple-700 px-4 py-2 rounded"
                onClick={async () => {
                  const {
                    data: { user },
                  } = await supabase.auth.getUser();
                  if (!user) return;

                  await supabase
                    .from("habits")
                    .update({ note: noteInput })
                    .eq("user_id", user.id)
                    .eq("id", selectedHabit.id);

                  // Update habit state
                  setHabits((prev) =>
                    prev.map((h) =>
                      h.id === selectedHabit.id ? { ...h, note: noteInput } : h
                    )
                  );

                  setShowNoteModal(false);
                }}
              >
                Save Note
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
