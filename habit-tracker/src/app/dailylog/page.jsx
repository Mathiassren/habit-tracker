"use client";

import { useState, useEffect, useMemo, useCallback } from "react";
import dayjs from "dayjs";
import { DatePickerInput } from "@mantine/dates";
import { supabase } from "@/services/supabase";
import {
  PlusIcon,
  CalendarIcon,
  ChevronLeftIcon,
  ChevronRightIcon,
} from "@heroicons/react/24/outline";

import {
  DndContext,
  closestCenter,
  PointerSensor,
  TouchSensor,
  KeyboardSensor,
  useSensor,
  useSensors,
} from "@dnd-kit/core";
import {
  SortableContext,
  arrayMove,
  verticalListSortingStrategy,
  sortableKeyboardCoordinates,
} from "@dnd-kit/sortable";

import SortableHabitItem from "@/app/components/SortableHabitItem";
import { useCountUp } from "@/hooks/useCountUp";

/* --------------------------- Utilities & helpers -------------------------- */

async function getUser() {
  const {
    data: { user },
    error,
  } = await supabase.auth.getUser();
  if (error) throw error;
  return user;
}

const toLocalISO = (ts) =>
  new Date(ts ?? Date.now()).toLocaleDateString("en-CA"); // YYYY-MM-DD

/* ------------------------------ Small UI bits ----------------------------- */
/** Date picker with restored dot indicator via renderDay */
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
          const color = dotForDate?.(dateStr);
          return (
            <div className="relative flex items-center justify-center">
              <span>{date.getDate()}</span>
              {color && (
                <span
                  className="absolute w-1.5 h-1.5 rounded-full"
                  style={{ backgroundColor: color, marginTop: "16px" }}
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

/* ------------------------------- Modals ---------------------------------- */

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
          className="w-full px-3 py-2 mb-4 rounded bg-gray-800 text-white border border-gray-700 focus:border-purple-500 outline-none"
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
          className="w-full h-32 p-2 bg-gray-800 text-white rounded border border-gray-700 focus:border-purple-500 outline-none"
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

/* --------------------------------- Main ---------------------------------- */

export default function DailylogPage() {
  const [selectedDate, setSelectedDate] = useState(dayjs());
  const [habits, setHabits] = useState([]);
  const [progressMap, setProgressMap] = useState({});
  const [statusByDate, setStatusByDate] = useState({});

  const [selectedHabit, setSelectedHabit] = useState(null);
  const [noteInput, setNoteInput] = useState("");
  const [showNoteModal, setShowNoteModal] = useState(false);

  const [showAddModal, setShowAddModal] = useState(false);
  const [showDeleteModal, setShowDeleteModal] = useState(false);
  const [habitToDelete, setHabitToDelete] = useState(null);

  const dateStr = useMemo(
    () => selectedDate.format("YYYY-MM-DD"),
    [selectedDate]
  );

  // DnD sensors (renamed to avoid redeclare)
  const dragSensors = useSensors(
    useSensor(PointerSensor, { activationConstraint: { distance: 6 } }),
    useSensor(TouchSensor, {
      activationConstraint: { delay: 120, tolerance: 6 },
    }),
    useSensor(KeyboardSensor, { coordinateGetter: sortableKeyboardCoordinates })
  );

  /* ------------------------------ Data loaders ----------------------------- */

  const fetchHabits = useCallback(async () => {
    const user = await getUser();
    if (!user) return;

    const { data, error } = await supabase
      .from("habits")
      .select("*")
      .eq("user_id", user.id)
      .eq("date", dateStr)
      .order("position", { ascending: true, nullsFirst: true })
      .order("created_at", { ascending: true });

    if (error) console.error("fetchHabits:", error);
    setHabits(data || []);
  }, [dateStr]);

  const fetchProgress = useCallback(async () => {
    const user = await getUser();
    if (!user) return;

    let { data, error } = await supabase
      .from("habit_completions")
      .select("habit_id, completed_on, completed_at")
      .eq("user_id", user.id)
      .eq("completed_on", dateStr);

    let rows = data || [];

    if (error || !Array.isArray(rows)) {
      const start = new Date(`${dateStr}T00:00:00`).toISOString();
      const end = new Date(`${dateStr}T23:59:59.999`).toISOString();
      const res2 = await supabase
        .from("habit_completions")
        .select("habit_id, completed_at")
        .eq("user_id", user.id)
        .gte("completed_at", start)
        .lte("completed_at", end);
      rows = res2.data || [];
    }

    const map = {};
    for (const r of rows) map[r.habit_id] = true;
    setProgressMap(map);
  }, [dateStr]);

  const fetchStatusesForMonth = useCallback(async () => {
    const user = await getUser();
    if (!user) return;

    const startOfMonth = selectedDate.startOf("month").format("YYYY-MM-DD");
    const endOfMonth = selectedDate.endOf("month").format("YYYY-MM-DD");

    const [{ data: habitsData }, { data: compData, error: compErr }] =
      await Promise.all([
        supabase
          .from("habits")
          .select("id, date")
          .eq("user_id", user.id)
          .gte("date", startOfMonth)
          .lte("date", endOfMonth),
        supabase
          .from("habit_completions")
          .select("habit_id, completed_on, completed_at")
          .eq("user_id", user.id)
          .gte("completed_on", startOfMonth)
          .lte("completed_on", endOfMonth),
      ]);

    let completions = compData || [];
    if (compErr || !Array.isArray(completions)) {
      const startUTC = new Date(`${startOfMonth}T00:00:00`).toISOString();
      const endUTC = new Date(`${endOfMonth}T23:59:59.999`).toISOString();
      const { data: comp2 } = await supabase
        .from("habit_completions")
        .select("habit_id, completed_at")
        .eq("user_id", user.id)
        .gte("completed_at", startUTC)
        .lte("completed_at", endUTC);
      completions = comp2 || [];
    }

    const done = new Set(
      completions.map((r) => {
        const day =
          r.completed_on ||
          new Date(r.completed_at).toLocaleDateString("en-CA");
        return `${day}:${r.habit_id}`;
      })
    );

    const byDate = new Map(); // date -> { total, done }
    (habitsData || []).forEach((h) => {
      const b = byDate.get(h.date) || { total: 0, done: 0 };
      b.total += 1;
      if (done.has(`${h.date}:${h.id}`)) b.done += 1;
      byDate.set(h.date, b);
    });

    const status = {};
    for (const [date, { total, done }] of byDate) {
      const ratio = total ? done / total : 0;
      status[date] = ratio === 1 ? "green" : ratio >= 0.5 ? "orange" : "red";
    }
    setStatusByDate(status);
  }, [selectedDate]);

  useEffect(() => {
    fetchHabits();
    fetchProgress();
    fetchStatusesForMonth();
  }, [fetchHabits, fetchProgress, fetchStatusesForMonth]);

  /* ----------------------------- CRUD functions ---------------------------- */

  const addHabit = useCallback(
    async ({ name, color }) => {
      const user = await getUser();
      if (!user) return;

      const maxPos =
        habits.reduce(
          (acc, h) =>
            h.position != null && h.position > acc ? h.position : acc,
          -1
        ) + 1;

      const { error } = await supabase
        .from("habits")
        .insert([
          { user_id: user.id, name, color, date: dateStr, position: maxPos },
        ]);

      if (error) console.error("addHabit:", error);
      setShowAddModal(false);
      setProgressMap({});
      await fetchHabits();
      await fetchStatusesForMonth();
    },
    [dateStr, habits, fetchHabits, fetchStatusesForMonth]
  );

  const deleteHabit = useCallback(async () => {
    if (!habitToDelete) return;
    await supabase.from("habits").delete().eq("id", habitToDelete);
    await supabase
      .from("habit_completions")
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
    const { error } = await supabase
      .from("habits")
      .update({ note: noteInput })
      .eq("user_id", user.id)
      .eq("id", selectedHabit.id);
    if (error) console.error("saveNote:", error);

    setHabits((prev) =>
      prev.map((h) =>
        h.id === selectedHabit.id ? { ...h, note: noteInput } : h
      )
    );
    setShowNoteModal(false);
  }, [selectedHabit, noteInput]);

  /* -------------------------- Toggle & DnD persistence --------------------- */

  const toggleCompletion = useCallback(
    async (habitId) => {
      const user = await getUser();
      if (!user) return;

      const current = !!progressMap[habitId];
      const next = !current;

      if (next) {
        let { error } = await supabase.from("habit_completions").insert({
          user_id: user.id,
          habit_id: habitId,
          completed_on: dateStr,
          completed_at: new Date().toISOString(),
        });

        if (error) {
          const res2 = await supabase.from("habit_completions").insert({
            user_id: user.id,
            habit_id: habitId,
            completed_at: new Date().toISOString(),
          });
          if (res2.error)
            console.error("insert completion fallback:", res2.error);
        }
      } else {
        let { error } = await supabase
          .from("habit_completions")
          .delete()
          .eq("user_id", user.id)
          .eq("habit_id", habitId)
          .eq("completed_on", dateStr);

        if (error) {
          const start = new Date(`${dateStr}T00:00:00`).toISOString();
          const end = new Date(`${dateStr}T23:59:59.999`).toISOString();
          const res2 = await supabase
            .from("habit_completions")
            .delete()
            .eq("user_id", user.id)
            .eq("habit_id", habitId)
            .gte("completed_at", start)
            .lte("completed_at", end);
          if (res2.error)
            console.error("delete completion fallback:", res2.error);
        }
      }

      setProgressMap((prev) => ({ ...prev, [habitId]: next }));
      fetchStatusesForMonth();
    },
    [dateStr, progressMap, fetchStatusesForMonth]
  );

  // Persist order by updating rows one-by-one (RLS-friendly)
  const handleDragEnd = useCallback(
    async (event) => {
      const { active, over } = event;
      if (!over || active.id === over.id) return;

      const oldIndex = habits.findIndex((h) => h.id === active.id);
      const newIndex = habits.findIndex((h) => h.id === over.id);
      if (oldIndex < 0 || newIndex < 0) return;

      // Optimistic reorder
      const newList = arrayMove(habits, oldIndex, newIndex).map((h, idx) => ({
        ...h,
        position: idx,
      }));
      setHabits(newList);

      const user = await getUser();
      if (!user) return;

      // Only update changed rows
      const changed = [];
      for (let idx = 0; idx < newList.length; idx++) {
        const h = newList[idx];
        const prev = habits.find((x) => x.id === h.id);
        if (!prev || prev.position !== h.position) {
          changed.push({ id: h.id, position: h.position });
        }
      }
      if (changed.length === 0) return;

      // Do per-row updates to satisfy RLS (explicit id + user_id filter)
      const updates = changed.map((c) =>
        supabase
          .from("habits")
          .update({ position: c.position })
          .eq("id", c.id)
          .eq("user_id", user.id)
      );

      const results = await Promise.allSettled(updates);
      const failed = results.filter((r) => r.status === "rejected");
      if (failed.length) {
        console.error("persist order error (batched updates):", failed);
        fetchHabits();
      }
    },
    [habits, fetchHabits]
  );

  /* ----------------------------------- UI ---------------------------------- */

  const completedCount = useMemo(
    () => Object.values(progressMap).filter(Boolean).length,
    [progressMap]
  );
  const totalHabits = habits.length;

  return (
    <div className="min-h-screen text-white p-6 rounded-lg max-w-xl mx-auto relative">

      <DateNavigator
        selectedDate={selectedDate}
        onChange={setSelectedDate}
        dotForDate={(d) => statusByDate[d]} // calendar dots restored
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

      {/* Habit List with dnd-kit */}
      <div className="space-y-3 mt-4">
        {habits.length === 0 ? (
          <p className="text-gray-500 text-center">No habits found.</p>
        ) : (
          <DndContext
            sensors={dragSensors}
            collisionDetection={closestCenter}
            onDragEnd={handleDragEnd}
          >
            <SortableContext
              items={habits.map((h) => h.id)}
              strategy={verticalListSortingStrategy}
            >
              {habits.map((habit) => (
                <SortableHabitItem
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
              ))}
            </SortableContext>
          </DndContext>
        )}
      </div>

      {/* Modals */}
      <AddHabitModal
        key={showAddModal ? "open" : "closed"} // forces a fresh mount when opening
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
