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
    <div className="bg-gradient-to-br from-slate-800/40 via-slate-800/30 to-slate-800/40 backdrop-blur-xl rounded-xl border border-slate-700/50 p-4">
      <div className="flex items-center gap-3">
        <button 
          onClick={() => go(-1)} 
          aria-label="Previous day"
          className="w-10 h-10 rounded-lg bg-slate-700/30 hover:bg-slate-700/50 border border-slate-600/30 hover:border-indigo-500/50 transition-all duration-300 flex items-center justify-center shadow-lg hover:shadow-indigo-500/20"
        >
          <ChevronLeftIcon className="w-5 h-5 text-slate-300 group-hover:text-indigo-400" />
        </button>
        <div className="flex-1">
          <DatePickerInput
            value={selectedDate.toDate()}
            onChange={(d) => d && onChange(dayjs(d))}
            valueFormat="ddd, MMMM D"
            renderDay={(date) => {
              const dateStr = dayjs(date).format("YYYY-MM-DD");
              const color = dotForDate?.(dateStr);
              const isSelected = dateStr === selectedDate.format("YYYY-MM-DD");
              const isToday = dateStr === dayjs().format("YYYY-MM-DD");
              return (
                <div className="relative flex items-center justify-center w-full h-full">
                  <span className={`${isSelected ? 'text-white font-bold' : isToday ? 'text-indigo-400 font-semibold' : 'text-white'}`}>
                    {date.getDate()}
                  </span>
                  {color && (
                    <span
                      className="absolute -bottom-1 left-1/2 -translate-x-1/2 w-2 h-2 rounded-full shadow-sm"
                      style={{ 
                        backgroundColor: color === "green" ? "#10b981" : color === "orange" ? "#f59e0b" : "#ef4444",
                        boxShadow: `0 0 4px ${color === "green" ? "#10b981" : color === "orange" ? "#f59e0b" : "#ef4444"}40`
                      }}
                    />
                  )}
                  {isSelected && (
                    <div className="absolute inset-0 rounded-md bg-indigo-500/20 border-2 border-indigo-400"></div>
                  )}
                </div>
              );
            }}
            popoverProps={{
              withinPortal: true,
              styles: { 
                dropdown: { 
                  backgroundColor: "rgb(15 15 15 / 0.95)",
                  backdropFilter: "blur(20px)",
                  border: "1px solid rgb(99 102 241 / 0.3)",
                  borderRadius: "16px"
                } 
              },
            }}
            styles={{
              input: {
                backgroundColor: "rgb(30 30 30 / 0.8)",
                color: "#ffffff",
                border: "1px solid rgb(99 102 241 / 0.3)",
                borderRadius: "12px",
                fontSize: "16px",
                padding: "12px 16px",
                backdropFilter: "blur(10px)",
              },
            }}
            className="w-full"
          />
        </div>
        <button 
          onClick={() => go(1)} 
          aria-label="Next day"
          className="w-10 h-10 rounded-lg bg-slate-700/30 hover:bg-slate-700/50 border border-slate-600/30 hover:border-indigo-500/50 transition-all duration-300 flex items-center justify-center shadow-lg hover:shadow-indigo-500/20"
        >
          <ChevronRightIcon className="w-5 h-5 text-slate-300 group-hover:text-indigo-400" />
        </button>
      </div>
    </div>
  );
}

function ProgressSummary({ completed, total }) {
  const rawPercent = total > 0 ? (completed / total) * 100 : 0;
  // Round to whole number - no decimals
  const targetPercent = Math.round(rawPercent);
  // Always call hooks unconditionally - use 0 duration for 100% to skip animation
  const percent = useCountUp(targetPercent, rawPercent === 100 ? 0 : 700);
  const animatedDoneRaw = useCountUp(completed, 500);
  
  // Always display rounded values - no decimals
  const displayPercent = Math.round(percent);
  const displayDone = Math.round(animatedDoneRaw);
  
  return (
    <div>
      <div className="flex items-center justify-between mb-4">
        <div>
          <div className="text-3xl font-bold bg-gradient-to-r from-indigo-400 via-blue-400 to-cyan-400 bg-clip-text text-transparent mb-1">
            {displayPercent}%
          </div>
          <div className="text-sm text-slate-400">Complete</div>
        </div>
        <div className="text-right">
          <div className="text-2xl font-bold text-white mb-1">
            {displayDone} <span className="text-sm font-normal text-slate-400">/ {total}</span>
          </div>
          <div className="text-sm text-slate-400">Habits</div>
        </div>
      </div>
      <div className="relative w-full bg-slate-700/30 rounded-full h-4 overflow-hidden shadow-inner">
        <div
          className="h-full bg-gradient-to-r from-indigo-500 via-blue-500 to-cyan-500 rounded-full transition-all duration-1000 ease-out relative shadow-lg shadow-indigo-500/50"
          style={{ width: `${displayPercent}%` }}
        >
          <div className="absolute inset-0 bg-gradient-to-r from-transparent via-white/30 to-transparent animate-pulse"></div>
        </div>
      </div>
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
    <div className="fixed inset-0 bg-black/80 backdrop-blur-md flex items-center justify-center z-50 p-4">
      <div className="bg-gradient-to-br from-slate-800/95 via-slate-800/90 to-slate-800/95 backdrop-blur-xl rounded-2xl shadow-2xl border border-slate-700/50 w-full max-w-md overflow-hidden">
        <div className="p-6 border-b border-slate-700/50 bg-gradient-to-r from-indigo-600/10 via-blue-600/10 to-cyan-600/10">
          <div className="flex items-center gap-3 mb-2">
            <div className="w-10 h-10 rounded-xl bg-gradient-to-br from-indigo-500 via-blue-500 to-cyan-500 flex items-center justify-center shadow-lg shadow-indigo-500/50">
              <PlusIcon className="w-5 h-5 text-white" />
            </div>
            <div>
              <h4 className="text-xl font-bold text-white">New Habit ✨</h4>
              <p className="text-slate-400 text-sm">Add a new habit to track</p>
            </div>
          </div>
        </div>
        <div className="p-6">
          <input
            type="text"
            value={name}
            onChange={(e) => setName(e.target.value)}
            placeholder="Give your habit a name"
            className="w-full px-4 py-3 mb-4 rounded-xl bg-slate-700/30 text-white border border-slate-600/30 focus:border-indigo-500 focus:ring-2 focus:ring-indigo-500/50 outline-none transition-all"
            onKeyDown={(e) => {
              if (e.key === 'Enter' && name.trim()) {
                onAdd({ name, color });
              }
            }}
          />
          <p className="text-sm text-slate-400 mb-3">Choose a color:</p>
          <ColorSwatchGroup value={color} onChange={setColor} />
          {!name && (
            <p className="text-red-400 text-sm mt-4 text-center">
              Please write a name for the habit.
            </p>
          )}
          <div className="flex justify-end gap-3 mt-6">
            <button
              onClick={onClose}
              className="px-4 py-2 rounded-xl bg-slate-700/50 hover:bg-slate-700 text-white transition-colors border border-slate-600/50"
            >
              Cancel
            </button>
            <button
              onClick={() => onAdd({ name, color })}
              className="px-4 py-2 rounded-xl bg-gradient-to-r from-indigo-600 via-blue-600 to-cyan-600 hover:from-indigo-500 hover:via-blue-500 hover:to-cyan-500 text-white shadow-lg shadow-indigo-500/30 transition-all disabled:opacity-50 disabled:cursor-not-allowed"
              disabled={!name}
            >
              Add Habit
            </button>
          </div>
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
    <div className="fixed inset-0 bg-black/80 backdrop-blur-md flex items-center justify-center z-50 p-4">
      <div className="bg-gradient-to-br from-slate-800/95 via-slate-800/90 to-slate-800/95 backdrop-blur-xl rounded-2xl shadow-2xl border border-slate-700/50 w-full max-w-md overflow-hidden">
        <div className="p-6 border-b border-slate-700/50 bg-gradient-to-r from-red-600/10 to-rose-600/10">
          <h4 className="text-xl font-bold text-white mb-2">{title}</h4>
          <p className="text-slate-400">{message}</p>
        </div>
        <div className="p-6">
          <div className="flex justify-end gap-3">
            <button
              onClick={onCancel}
              className="px-4 py-2 rounded-xl bg-slate-700/50 hover:bg-slate-700 text-white transition-colors border border-slate-600/50"
            >
              Cancel
            </button>
            <button
              onClick={onConfirm}
              className="px-4 py-2 rounded-xl bg-gradient-to-r from-red-600 to-rose-600 hover:from-red-500 hover:to-rose-500 text-white shadow-lg shadow-red-500/30 transition-all"
            >
              Delete
            </button>
          </div>
        </div>
      </div>
    </div>
  );
}

function NoteModal({ open, habit, note, onChange, onClose, onSave }) {
  if (!open || !habit) return null;
  return (
    <div className="fixed inset-0 bg-black/80 backdrop-blur-md flex items-center justify-center z-50 p-4">
      <div className="bg-gradient-to-br from-slate-800/95 via-slate-800/90 to-slate-800/95 backdrop-blur-xl rounded-2xl shadow-2xl border border-slate-700/50 w-full max-w-md overflow-hidden">
        <div className="p-6 border-b border-slate-700/50 bg-gradient-to-r from-indigo-600/10 via-blue-600/10 to-cyan-600/10">
          <h4 className="text-xl font-bold text-white mb-1">Habit Note</h4>
          <p className="text-slate-400 text-sm">{habit.name}</p>
        </div>
        <div className="p-6">
          <textarea
            className="w-full h-32 p-4 bg-slate-700/30 text-white rounded-xl border border-slate-600/30 focus:border-indigo-500 focus:ring-2 focus:ring-indigo-500/50 outline-none resize-none transition-all"
            placeholder="Write a note for this habit..."
            value={note}
            onChange={(e) => onChange(e.target.value)}
          />
          <div className="flex justify-end mt-6 gap-3">
            <button
              className="px-4 py-2 rounded-xl bg-slate-700/50 hover:bg-slate-700 text-white transition-colors border border-slate-600/50"
              onClick={onClose}
            >
              Cancel
            </button>
            <button
              className="px-4 py-2 rounded-xl bg-gradient-to-r from-indigo-600 via-blue-600 to-cyan-600 hover:from-indigo-500 hover:via-blue-500 hover:to-cyan-500 text-white shadow-lg shadow-indigo-500/30 transition-all"
              onClick={onSave}
            >
              Save Note
            </button>
          </div>
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
    <div className="min-h-screen bg-gradient-to-br from-slate-950 via-indigo-950/20 to-slate-950">
      {/* Background Pattern */}
      <div className="absolute inset-0 bg-[radial-gradient(circle_at_1px_1px,_rgba(99,102,241,0.15)_1px,_transparent_0)] bg-[size:24px_24px] opacity-40"></div>
      
      <div className="relative z-10 max-w-2xl mx-auto px-4 sm:px-6 py-6 sm:py-12">
        {/* Header Section */}
        <div className="mb-6 sm:mb-8">
          <div className="flex flex-col sm:flex-row items-start sm:items-center gap-3 sm:gap-3 mb-4 sm:mb-6">
            <div className="w-10 h-10 sm:w-12 sm:h-12 rounded-xl bg-gradient-to-br from-indigo-500 via-blue-500 to-cyan-500 flex items-center justify-center shadow-lg shadow-indigo-500/50 flex-shrink-0">
              <CalendarIcon className="w-5 h-5 sm:w-6 sm:h-6 text-white" />
            </div>
            <div className="flex-1 min-w-0">
              <h1 className="text-2xl sm:text-3xl md:text-4xl font-bold text-gradient-vibrant leading-tight">Daily Log</h1>
              <p className="text-slate-400 text-sm sm:text-base md:text-lg mt-1">
                Track your habits day by day
              </p>
            </div>
          </div>

          <DateNavigator
            selectedDate={selectedDate}
            onChange={setSelectedDate}
            dotForDate={(d) => statusByDate[d]} // calendar dots restored
          />
        </div>

        {/* Progress Summary Card */}
        <div className="bg-gradient-to-br from-slate-800/40 via-slate-800/30 to-slate-800/40 backdrop-blur-xl rounded-2xl border border-slate-700/50 shadow-2xl shadow-indigo-900/20 p-4 sm:p-6 mb-6">
          <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-2 sm:gap-0 mb-4">
            <h2 className="text-lg sm:text-xl font-bold text-white">
              {selectedDate.format("dddd, MMMM D, YYYY")}
            </h2>
            <div className="text-xs sm:text-sm text-slate-400">
              {selectedDate.isSame(dayjs(), 'day') ? "Today" : selectedDate.isBefore(dayjs(), 'day') ? "Past" : "Future"}
            </div>
          </div>
          <ProgressSummary completed={completedCount} total={totalHabits} />
        </div>

        {/* Add Habit Button */}
        <button
          className="w-full border-dashed border-2 border-slate-600/50 hover:border-indigo-500/50 bg-slate-800/20 hover:bg-slate-800/40 p-6 text-center rounded-xl cursor-pointer text-slate-300 hover:text-white transition-all duration-300 mb-6 group"
          onClick={() => setShowAddModal(true)}
        >
          <div className="flex items-center justify-center gap-2">
            <PlusIcon className="w-5 h-5 group-hover:scale-110 transition-transform" />
            <span className="font-medium">Add a new habit</span>
          </div>
        </button>

        {/* Habit List with dnd-kit */}
        <div className="space-y-3">
          {habits.length === 0 ? (
            <div className="bg-gradient-to-br from-slate-800/40 via-slate-800/30 to-slate-800/40 backdrop-blur-xl rounded-2xl border border-slate-700/50 p-12 text-center">
              <div className="w-16 h-16 mx-auto mb-4 rounded-full bg-slate-700/30 flex items-center justify-center">
                <PlusIcon className="w-8 h-8 text-slate-500" />
              </div>
              <p className="text-slate-400 text-lg mb-2">No habits for this day</p>
              <p className="text-slate-500 text-sm">Add your first habit to get started!</p>
            </div>
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
