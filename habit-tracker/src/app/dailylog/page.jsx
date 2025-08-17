"use client";
import { useState, useEffect, useMemo, useCallback } from "react";
import dayjs from "dayjs";
import { DatePickerInput } from "@mantine/dates";
import { supabase } from "@/services/supabase";
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

/**
 * Utils & hooks
 */
function useCountUp(targetValue, duration = 500) {
  const [value, setValue] = useState(0);
  useEffect(() => {
    let raf = 0;
    const startValue = 0;
    const startTime = performance.now();
    const animate = (time) => {
      const elapsed = time - startTime;
      const progress = Math.min(elapsed / duration, 1);
      setValue(startValue + (targetValue - startValue) * progress);
      if (progress < 1) raf = requestAnimationFrame(animate);
    };
    raf = requestAnimationFrame(animate);
    return () => cancelAnimationFrame(raf);
  }, [targetValue, duration]);
  return Math.round(value);
}

function buildStatusMap(habitsData = [], progressData = []) {
  const completed = new Set(
    progressData
      .filter((p) => p.completed)
      .map((p) => `${p.date}:${p.habit_id}`)
  );
  const byDate = new Map(); // date -> { total, done }
  for (const h of habitsData) {
    const bucket = byDate.get(h.date) || { total: 0, done: 0 };
    bucket.total += 1;
    if (completed.has(`${h.date}:${h.id}`)) bucket.done += 1;
    byDate.set(h.date, bucket);
  }
  const statusMap = {};
  for (const [date, { total, done }] of byDate) {
    const ratio = total ? done / total : 0;
    statusMap[date] = ratio === 1 ? "green" : ratio >= 0.5 ? "orange" : "red";
  }
  return statusMap;
}

async function getUser() {
  const {
    data: { user },
  } = await supabase.auth.getUser();
  return user;
}

/**
 * Small, focused UI components
 */
function DateNavigator({ selectedDate, onChange, dotForDate }) {
  const go = (delta) => onChange(selectedDate.add(delta, "day"));
  return (
    <div className="flex items-center w-42 gap-3 mb-6">
      <button onClick={() => go(-1)} aria-label="Previous day">
        <ChevronLeftIcon className="w-5 h-5 text-[#9333EA]" />
      </button>
      <DatePickerInput
        value={selectedDate.toDate()}
        onChange={(d) => d && onChange(dayjs(d))}
        valueFormat="ddd (DD MMM)"
        leftSection={<CalendarIcon className="w-5 h-5 text-gray-400" />}
        renderDay={(date) => {
          const dateStr = dayjs(date).format("YYYY-MM-DD");
          const color = dotForDate(dateStr);
          return (
            <div className="relative flex items-center justify-center">
              <span>{date.getDate()}</span>
              {color && (
                <span
                  className="absolute w-1.5 mt-4 h-1.5 rounded-full"
                  style={{ backgroundColor: color }}
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
      <button onClick={() => go(1)} aria-label="Next day">
        <ChevronRightIcon className="w-5 h-5 text-[#9333EA]" />
      </button>
    </div>
  );
}

function ProgressSummary({ completed, total }) {
  const percent = useCountUp(total > 0 ? (completed / total) * 100 : 0, 700);
  const animatedDone = useCountUp(completed, 500);
  return (
    <div className="mb-6">
      <div className="flex justify-between text-sm text-gray-400 mb-1">
        <span>Day's Progress</span>
        <span>{percent}% complete</span>
      </div>
      <div className="w-full bg-gray-800 rounded-full h-3 mb-2 overflow-hidden">
        <div
          className="bg-purple-600 h-3 rounded-full transition-all duration-500 ease-in-out"
          style={{ width: `${percent}%` }}
        />
      </div>
      <p className="text-xs text-gray-500">
        {animatedDone} / {total} habits
      </p>
    </div>
  );
}

function HabitItem({ habit, checked, onToggle, onDelete, onOpenNote }) {
  return (
    <div
      className="flex items-center justify-between bg-gray-900 rounded-lg p-3 border-l-4"
      style={{ borderLeftColor: habit.color || "#9333EA" }}
    >
      <Bars2Icon className="h-5 w-5 text-gray-500" />
      <button
        type="button"
        className="flex-1 text-center flex justify-center items-center cursor-pointer"
        onClick={() => onOpenNote(habit)}
      >
        <EnvelopeIcon className="mr-4 w-4 h-4" /> {habit.name}
      </button>
      <div className="flex items-center gap-4">
        <InformationCircleIcon className="h-5 w-5 text-gray-400" />
        <input
          type="checkbox"
          checked={!!checked}
          onChange={() => onToggle(habit.id)}
          className="w-5 h-5 accent-purple-600 cursor-pointer"
        />
        <TrashIcon
          className="h-5 w-5 text-red-500 cursor-pointer"
          onClick={() => onDelete(habit.id)}
        />
      </div>
    </div>
  );
}

function ColorSwatchGroup({ value, onChange }) {
  const colors = ["purple", "blue", "yellow", "green", "red", "orange", "pink"];
  return (
    <div className="flex justify-center gap-2">
      {colors.map((c) => (
        <button
          key={c}
          onClick={() => onChange(c)}
          className={`w-6 h-6 rounded-full border-2 ${
            value === c ? "border-white" : "border-transparent"
          }`}
          style={{ backgroundColor: c }}
          aria-label={c}
        />
      ))}
    </div>
  );
}

function AddHabitModal({ open, onClose, onAdd }) {
  const [name, setName] = useState("");
  const [color, setColor] = useState("purple");

  if (!open) return null;
  return (
    <div className="fixed inset-0 bg-black bg-opacity-60 flex items-center justify-center z-50">
      <div className="bg-gray-900 p-6 rounded-lg shadow-lg w-80 text-center">
        <h4 className="text-lg font-semibold mb-2">New Habit ✨</h4>
        <p className="text-gray-400 text-sm mb-4">Add a new habit.</p>
        <input
          type="text"
          value={name}
          onChange={(e) => setName(e.target.value)}
          placeholder="Give your habit a name"
          className="w-full px-3 py-2 mb-4 rounded bg-gray-800 text-white"
        />
        <p className="text-sm text-gray-400 mb-2">Choose a color:</p>
        <ColorSwatchGroup value={color} onChange={setColor} />
        {!name && (
          <p className="text-red-500 text-sm mt-3">
            Please write a name for the habit.
          </p>
        )}
        <div className="flex justify-between mt-6">
          <button
            onClick={onClose}
            className="bg-gray-600 hover:bg-gray-700 px-4 py-2 rounded text-white"
          >
            Close
          </button>
          <button
            onClick={() => onAdd({ name, color })}
            className="bg-purple-600 hover:bg-purple-700 px-4 py-2 rounded text-white"
            disabled={!name}
          >
            Add Habit
          </button>
        </div>
      </div>
    </div>
  );
}

function ConfirmModal({
  open,
  onConfirm,
  onCancel,
  title = "Delete Habit",
  message = "Are you sure you want to delete this habit?",
}) {
  if (!open) return null;
  return (
    <div className="fixed inset-0 bg-black bg-opacity-60 flex items-center justify-center z-50">
      <div className="bg-gray-900 p-6 rounded-lg shadow-lg text-center">
        <h4 className="text-lg font-semibold mb-4">{title}</h4>
        <p className="mb-6">{message}</p>
        <div className="flex justify-center gap-4">
          <button
            onClick={onConfirm}
            className="bg-red-600 hover:bg-red-700 px-4 py-2 rounded text-white"
          >
            Delete
          </button>
          <button
            onClick={onCancel}
            className="bg-gray-600 hover:bg-gray-700 px-4 py-2 rounded text-white"
          >
            Cancel
          </button>
        </div>
      </div>
    </div>
  );
}

function NoteModal({ open, habit, note, onChange, onClose, onSave }) {
  if (!open || !habit) return null;
  return (
    <div className="fixed inset-0 bg-black p-4 bg-opacity-60 flex items-center justify-center z-50">
      <div className="bg-gray-900 p-6 rounded-lg shadow-lg w-96 text-white">
        <h4 className="text-lg font-semibold mb-4">Habit: {habit.name}</h4>
        <textarea
          className="w-full h-32 p-2 bg-gray-800 text-white rounded border border-gray-700"
          placeholder="Write a note for this habit..."
          value={note}
          onChange={(e) => onChange(e.target.value)}
        />
        <div className="flex justify-end mt-4 gap-2">
          <button
            className="bg-gray-600 hover:bg-gray-700 px-4 py-2 rounded"
            onClick={onClose}
          >
            Close
          </button>
          <button
            className="bg-purple-600 hover:bg-purple-700 px-4 py-2 rounded"
            onClick={onSave}
          >
            Save Note
          </button>
        </div>
      </div>
    </div>
  );
}

/**
 * Main container: orchestrates data + uses small components
 */
export default function HabitTracker() {
  const [selectedDate, setSelectedDate] = useState(dayjs());
  const [habits, setHabits] = useState([]);
  const [progressMap, setProgressMap] = useState({}); // habit_id -> boolean
  const [statusByDate, setStatusByDate] = useState({}); // YYYY-MM-DD -> color

  // note state
  const [selectedHabit, setSelectedHabit] = useState(null);
  const [noteInput, setNoteInput] = useState("");
  const [showNoteModal, setShowNoteModal] = useState(false);

  // modals
  const [showAddModal, setShowAddModal] = useState(false);
  const [showDeleteModal, setShowDeleteModal] = useState(false);
  const [habitToDelete, setHabitToDelete] = useState(null);

  const dateStr = useMemo(
    () => selectedDate.format("YYYY-MM-DD"),
    [selectedDate]
  );

  const fetchHabits = useCallback(async () => {
    const user = await getUser();
    if (!user) return;
    const { data } = await supabase
      .from("habits")
      .select("*")
      .eq("user_id", user.id)
      .eq("date", dateStr);
    setHabits(data || []);
  }, [dateStr]);

  const fetchProgress = useCallback(async () => {
    const user = await getUser();
    if (!user) return;
    const { data } = await supabase
      .from("habit_progress")
      .select("habit_id, completed")
      .eq("user_id", user.id)
      .eq("date", dateStr);
    const map = {};
    (data || []).forEach((row) => (map[row.habit_id] = !!row.completed));
    setProgressMap(map);
  }, [dateStr]);

  const fetchStatusesForMonth = useCallback(async () => {
    const user = await getUser();
    if (!user) return;

    const startOfMonth = selectedDate.startOf("month").format("YYYY-MM-DD");
    const endOfMonth = selectedDate.endOf("month").format("YYYY-MM-DD");

    const [{ data: habitsData }, { data: progressData }] = await Promise.all([
      supabase
        .from("habits")
        .select("id, date")
        .eq("user_id", user.id)
        .gte("date", startOfMonth)
        .lte("date", endOfMonth),
      supabase
        .from("habit_progress")
        .select("habit_id, date, completed")
        .eq("user_id", user.id)
        .gte("date", startOfMonth)
        .lte("date", endOfMonth),
    ]);

    setStatusByDate(buildStatusMap(habitsData || [], progressData || []));
  }, [selectedDate]);

  useEffect(() => {
    fetchHabits();
    fetchProgress();
    fetchStatusesForMonth();
  }, [fetchHabits, fetchProgress, fetchStatusesForMonth]);

  const completedCount = useMemo(
    () => Object.values(progressMap).filter(Boolean).length,
    [progressMap]
  );
  const totalHabits = habits.length;

  const toggleCompletion = useCallback(
    async (habitId) => {
      const user = await getUser();
      if (!user) return;
      const current = !!progressMap[habitId];
      const next = !current;

      const { data: existing } = await supabase
        .from("habit_progress")
        .select("id")
        .eq("user_id", user.id)
        .eq("habit_id", habitId)
        .eq("date", dateStr)
        .maybeSingle();

      if (existing) {
        await supabase
          .from("habit_progress")
          .update({ completed: next })
          .eq("user_id", user.id)
          .eq("habit_id", habitId)
          .eq("date", dateStr);
      } else {
        await supabase.from("habit_progress").insert([
          {
            user_id: user.id,
            habit_id: habitId,
            date: dateStr,
            completed: next,
          },
        ]);
      }

      setProgressMap((prev) => ({ ...prev, [habitId]: next }));
      fetchStatusesForMonth();
    },
    [dateStr, progressMap, fetchStatusesForMonth]
  );

  const addHabit = useCallback(
    async ({ name, color }) => {
      const user = await getUser();
      if (!user) return;
      await supabase
        .from("habits")
        .insert([{ user_id: user.id, name, color, date: dateStr }]);
      setShowAddModal(false);
      setProgressMap({});
      await fetchHabits();
      await fetchStatusesForMonth();
    },
    [dateStr, fetchHabits, fetchStatusesForMonth]
  );

  const deleteHabit = useCallback(async () => {
    if (!habitToDelete) return;
    await supabase.from("habits").delete().eq("id", habitToDelete);
    await supabase
      .from("habit_progress")
      .delete()
      .eq("habit_id", habitToDelete);
    setShowDeleteModal(false);
    setHabitToDelete(null);
    await fetchHabits();
    await fetchStatusesForMonth();
  }, [habitToDelete, fetchHabits, fetchStatusesForMonth]);

  const saveNote = useCallback(async () => {
    if (!selectedHabit) return;
    const user = await getUser();
    if (!user) return;
    await supabase
      .from("habits")
      .update({ note: noteInput })
      .eq("user_id", user.id)
      .eq("id", selectedHabit.id);

    setHabits((prev) =>
      prev.map((h) =>
        h.id === selectedHabit.id ? { ...h, note: noteInput } : h
      )
    );
    setShowNoteModal(false);
  }, [selectedHabit, noteInput]);

  return (
    <div className="min-h-screen text-white p-6 rounded-lg max-w-xl mx-auto relative">
      <DateNavigator
        selectedDate={selectedDate}
        onChange={setSelectedDate}
        dotForDate={(d) => statusByDate[d]}
      />

      <h3 className="text-xl font-bold mb-4">
        Habits for {selectedDate.format("DD MMM YYYY")}
      </h3>
      <ProgressSummary completed={completedCount} total={totalHabits} />

      {/* Add Habit */}
      <button
        className="w-full border-dashed border-2 border-gray-600 p-4 text-center rounded cursor-pointer text-gray-400"
        onClick={() => setShowAddModal(true)}
      >
        Add a new habit <PlusIcon className="inline w-4 h-4" />
      </button>

      {/* Habit List */}
      <div className="space-y-3 mt-4">
        {habits.length === 0 ? (
          <p className="text-gray-500 text-center">No habits found.</p>
        ) : (
          habits.map((habit) => (
            <HabitItem
              key={habit.id}
              habit={habit}
              checked={progressMap[habit.id]}
              onToggle={toggleCompletion}
              onDelete={(id) => {
                setHabitToDelete(id);
                setShowDeleteModal(true);
              }}
              onOpenNote={(h) => {
                setSelectedHabit(h);
                setNoteInput(h.note || "");
                setShowNoteModal(true);
              }}
            />
          ))
        )}
      </div>

      {/* Modals */}
      <AddHabitModal
        open={showAddModal}
        onClose={() => setShowAddModal(false)}
        onAdd={addHabit}
      />
      <ConfirmModal
        open={showDeleteModal}
        onConfirm={deleteHabit}
        onCancel={() => setShowDeleteModal(false)}
      />
      <NoteModal
        open={showNoteModal}
        habit={selectedHabit}
        note={noteInput}
        onChange={setNoteInput}
        onClose={() => setShowNoteModal(false)}
        onSave={saveNote}
      />
    </div>
  );
}
