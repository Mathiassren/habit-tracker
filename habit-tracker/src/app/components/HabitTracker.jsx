"use client";

import { useState, useEffect, useCallback, useMemo } from "react";
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
} from "@heroicons/react/24/outline";

import { supabase } from "@/services/supabase";

const HABIT_COLORS = ["purple", "blue", "yellow", "green", "red", "orange", "pink"];

export default function HabitTracker() {
  // Main state
  const [habits, setHabits] = useState([]);
  const [habitProgress, setHabitProgress] = useState({});
  const [habitStatuses, setHabitStatuses] = useState({});
  const [selectedDate, setSelectedDate] = useState(dayjs());
  const [newHabit, setNewHabit] = useState("");

  // Modal states
  const [showEditModal, setShowEditModal] = useState(false);
  const [habitToEdit, setHabitToEdit] = useState(null);
  const [editHabitName, setEditHabitName] = useState("");
  const [selectedColor, setSelectedColor] = useState("purple");

  // Computed values
  const completedCount = useMemo(
    () => Object.values(habitProgress).filter(Boolean).length,
    [habitProgress]
  );
  
  const totalHabits = habits.length;
  const progressPercent = totalHabits > 0 ? (completedCount / totalHabits) * 100 : 0;

  // Data fetching functions
  const fetchHabits = useCallback(async (date) => {
    try {
      const { data: { user } } = await supabase.auth.getUser();
      if (!user) return;
      
      const { data, error } = await supabase
        .from("habits")
        .select("*")
        .eq("user_id", user.id)
        .eq("date", date.format("YYYY-MM-DD"));
        
      if (error) throw error;
      setHabits(data || []);
    } catch (error) {
      console.error("Error fetching habits:", error);
      setHabits([]);
    }
  }, []);

  const fetchProgress = useCallback(async (date) => {
    try {
      const { data: { user } } = await supabase.auth.getUser();
      if (!user) return;
      
      const { data, error } = await supabase
        .from("habit_progress")
        .select("habit_id, completed")
        .eq("user_id", user.id)
        .eq("date", date.format("YYYY-MM-DD"));
        
      if (error) throw error;
      
      const progressMap = {};
      (data || []).forEach((log) => {
        progressMap[log.habit_id] = log.completed;
      });
      setHabitProgress(progressMap);
    } catch (error) {
      console.error("Error fetching progress:", error);
      setHabitProgress({});
    }
  }, []);

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


  const navigateDate = useCallback((direction) => {
    setSelectedDate(prev => direction === 'prev' 
      ? prev.subtract(1, "day") 
      : prev.add(1, "day")
    );
  }, []);

  return (
    <div className="min-h-screen bg-gradient-to-br from-neutral-950 via-neutral-900 to-neutral-950">
      {/* Background Pattern */}
      <div className="absolute inset-0 bg-[radial-gradient(circle_at_1px_1px,_rgba(168,85,247,0.15)_1px,_transparent_0)] bg-[size:24px_24px] opacity-30"></div>
      
      <div className="relative z-10 max-w-2xl mx-auto px-6 py-12">
        {/* Header Section */}
        <div className="text-center mb-12">
          <div className="inline-flex items-center gap-3 mb-6">
            <div className="w-2 h-2 rounded-full bg-gradient-to-r from-purple-500 to-pink-500 animate-pulse"></div>
            <h1 className="text-3xl font-bold bg-gradient-to-r from-white via-purple-200 to-white bg-clip-text text-transparent">
              Daily Habits
            </h1>
            <div className="w-2 h-2 rounded-full bg-gradient-to-r from-pink-500 to-purple-500 animate-pulse"></div>
          </div>
        </div>

        {/* Elegant Date Navigation */}
        <div className="mb-8">
          <div className="bg-white/5 backdrop-blur-xl border border-white/10 rounded-2xl p-6 shadow-2xl">
            <div className="flex items-center justify-between mb-4">
              <button
                onClick={() => navigateDate('prev')}
                className="group flex items-center justify-center w-10 h-10 rounded-xl bg-white/5 hover:bg-white/10 border border-white/10 hover:border-purple-500/30 transition-all duration-300"
                aria-label="Previous day"
              >
                <ChevronLeftIcon className="w-5 h-5 text-gray-400 group-hover:text-purple-400 transition-colors" />
              </button>
              
              <div className="flex-1 mx-6">
                <DatePickerInput
                  value={selectedDate.toDate()}
                  onChange={(date) => date && setSelectedDate(dayjs(date))}
                  valueFormat="EEEE, MMMM d"
                  leftSection={<CalendarIcon className="w-5 h-5 text-purple-400" />}
                  renderDay={(date) => {
                    const dateStr = dayjs(date).format("YYYY-MM-DD");
                    const dotColor = habitStatuses[dateStr];
                    return (
                      <div className="relative flex items-center justify-center">
                        <span className="text-white">{date.getDate()}</span>
                        {dotColor && (
                          <div
                            className="absolute -bottom-1 w-2 h-2 rounded-full shadow-lg"
                            style={{ backgroundColor: dotColor }}
                          />
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
                        border: "1px solid rgb(255 255 255 / 0.1)",
                        borderRadius: "16px"
                      } 
                    },
                  }}
                  styles={{
                    input: {
                      backgroundColor: "transparent",
                      color: "#ffffff",
                      border: "none",
                      fontSize: "18px",
                      fontWeight: "600",
                      textAlign: "center",
                      padding: "12px 16px"
                    },
                    day: { 
                      color: "#fff",
                      borderRadius: "8px",
                      "&:hover": {
                        backgroundColor: "rgb(168 85 247 / 0.2)"
                      }
                    },
                  }}
                  className="w-full"
                />
              </div>
              
              <button
                onClick={() => navigateDate('next')}
                className="group flex items-center justify-center w-10 h-10 rounded-xl bg-white/5 hover:bg-white/10 border border-white/10 hover:border-purple-500/30 transition-all duration-300"
                aria-label="Next day"
              >
                <ChevronRightIcon className="w-5 h-5 text-gray-400 group-hover:text-purple-400 transition-colors" />
              </button>
            </div>
            
            <div className="text-center">
              <p className="text-sm text-gray-400 font-medium">
                {selectedDate.format("dddd, MMMM D, YYYY")}
              </p>
            </div>
          </div>
        </div>

        {/* Sophisticated Progress Section */}
        <div className="mb-8">
          <div className="bg-white/5 backdrop-blur-xl border border-white/10 rounded-2xl p-8 shadow-2xl">
            <div className="flex items-center justify-between mb-6">
              <div>
                <h2 className="text-2xl font-bold text-white mb-1">Today's Progress</h2>
                <p className="text-gray-400 text-sm font-medium">Keep building those habits</p>
              </div>
              <div className="text-right">
                <div className="text-4xl font-bold bg-gradient-to-r from-purple-400 to-pink-400 bg-clip-text text-transparent mb-1">
                  {progressPercent}%
                </div>
                <div className="text-xs text-gray-400 font-medium uppercase tracking-wider">
                  Complete
                </div>
              </div>
            </div>
            
            {/* Advanced Progress Bar */}
            <div className="relative mb-6">
              <div className="w-full h-3 bg-white/5 rounded-full overflow-hidden shadow-inner">
                <div
                  className="h-full bg-gradient-to-r from-purple-500 via-purple-400 to-pink-400 rounded-full shadow-lg transition-all duration-1000 ease-out relative"
                  style={{ width: `${progressPercent}%` }}
                >
                  <div className="absolute inset-0 bg-gradient-to-r from-transparent via-white/20 to-transparent animate-pulse"></div>
                </div>
              </div>
              
              {/* Progress Indicators */}
              <div className="flex justify-between mt-3">
                <div className="flex items-center gap-2">
                  <div className="w-3 h-3 rounded-full bg-gradient-to-r from-purple-500 to-pink-400 shadow-lg"></div>
                  <span className="text-sm text-gray-300 font-medium">
                    {completedCount} completed
                  </span>
                </div>
                <div className="flex items-center gap-2">
                  <div className="w-3 h-3 rounded-full bg-white/10 border border-white/20"></div>
                  <span className="text-sm text-gray-400 font-medium">
                    {totalHabits - completedCount} remaining
                  </span>
                </div>
              </div>
            </div>
            
            {/* Statistics Cards */}
            <div className="grid grid-cols-3 gap-4">
              <div className="text-center p-4 bg-white/5 rounded-xl border border-white/10">
                <div className="text-2xl font-bold text-white mb-1">{totalHabits}</div>
                <div className="text-xs text-gray-400 font-medium uppercase tracking-wider">Total</div>
              </div>
              <div className="text-center p-4 bg-gradient-to-br from-purple-500/10 to-pink-500/10 rounded-xl border border-purple-500/20">
                <div className="text-2xl font-bold text-purple-300 mb-1">{completedCount}</div>
                <div className="text-xs text-purple-400 font-medium uppercase tracking-wider">Done</div>
              </div>
              <div className="text-center p-4 bg-white/5 rounded-xl border border-white/10">
                <div className="text-2xl font-bold text-white mb-1">{totalHabits - completedCount}</div>
                <div className="text-xs text-gray-400 font-medium uppercase tracking-wider">Left</div>
              </div>
            </div>
          </div>
        </div>

        {/* Elegant Add Habit Form */}
        <div className="mb-8">
          <div className="bg-white/5 backdrop-blur-xl border border-white/10 rounded-2xl p-6 shadow-2xl">
            <div className="flex items-center gap-3 mb-4">
              <div className="w-8 h-8 rounded-lg bg-gradient-to-br from-purple-500 to-pink-500 flex items-center justify-center shadow-lg">
                <PlusIcon className="w-4 h-4 text-white" />
              </div>
              <h3 className="text-lg font-semibold text-white">Add New Habit</h3>
            </div>
            
            <form onSubmit={addHabit} className="space-y-4">
              <div className="relative">
                <input
                  type="text"
                  value={newHabit}
                  onChange={(e) => setNewHabit(e.target.value)}
                  placeholder="What habit would you like to build?"
                  className="w-full px-6 py-4 bg-white/5 border border-white/10 rounded-xl text-white placeholder-gray-400 focus:outline-none focus:ring-2 focus:ring-purple-500/50 focus:border-purple-500/30 transition-all duration-300 text-lg"
                  maxLength={50}
                />
                <div className="absolute inset-0 rounded-xl bg-gradient-to-r from-purple-500/5 to-pink-500/5 opacity-0 focus-within:opacity-100 transition-opacity duration-300 pointer-events-none"></div>
              </div>
              
              <button
                type="submit"
                disabled={!newHabit.trim()}
                className="group relative w-full py-4 px-6 bg-gradient-to-r from-purple-600 to-pink-600 hover:from-purple-500 hover:to-pink-500 disabled:from-gray-600 disabled:to-gray-600 disabled:cursor-not-allowed rounded-xl font-semibold text-white shadow-lg hover:shadow-xl transition-all duration-300 overflow-hidden"
              >
                <div className="absolute inset-0 bg-gradient-to-r from-white/0 via-white/10 to-white/0 translate-x-[-100%] group-hover:translate-x-[100%] transition-transform duration-700"></div>
                <div className="relative flex items-center justify-center gap-3">
                  <PlusIcon className="w-5 h-5" />
                  <span>Create Habit</span>
                </div>
              </button>
            </form>
          </div>
        </div>

        {/* Premium Habit Cards */}
        <div className="space-y-4">
          {habits.length === 0 ? (
            <div className="bg-white/5 backdrop-blur-xl border border-white/10 rounded-2xl p-12 text-center shadow-2xl">
              <div className="w-16 h-16 mx-auto mb-6 rounded-full bg-gradient-to-br from-purple-500/20 to-pink-500/20 flex items-center justify-center">
                <PlusIcon className="w-8 h-8 text-purple-400" />
              </div>
              <h3 className="text-xl font-semibold text-white mb-2">No habits yet</h3>
              <p className="text-gray-400 max-w-sm mx-auto">
                Start building better habits today. Add your first habit above and begin your journey to success.
              </p>
            </div>
          ) : (
            habits.map((habit, index) => (
              <div
                key={habit.id}
                className="group relative bg-white/5 backdrop-blur-xl border border-white/10 rounded-2xl p-6 shadow-2xl hover:shadow-3xl transition-all duration-500 hover:scale-[1.02] hover:bg-white/10"
                style={{
                  animationDelay: `${index * 100}ms`,
                  animation: 'fadeInUp 0.6s ease-out forwards'
                }}
              >
                {/* Habit Color Accent */}
                <div 
                  className="absolute left-0 top-6 bottom-6 w-1 rounded-full shadow-lg"
                  style={{ backgroundColor: habit.color || "#9333EA" }}
                />
                
                <div className="flex items-center justify-between">
                  <div className="flex items-center gap-4 flex-1 min-w-0">
                    {/* Drag Handle */}
                    <button
                      onClick={() => openEditModal(habit)}
                      className="group/btn flex items-center justify-center w-10 h-10 rounded-xl bg-white/5 hover:bg-white/10 border border-white/10 hover:border-purple-500/30 transition-all duration-300 opacity-60 group-hover:opacity-100"
                      aria-label="Edit habit"
                    >
                      <Bars2Icon className="w-5 h-5 text-gray-400 group-hover/btn:text-purple-400 transition-colors" />
                    </button>
                    
                    {/* Habit Info */}
                    <div className="flex-1 min-w-0">
                      <h4 className="text-lg font-semibold text-white truncate mb-1">
                        {habit.name}
                      </h4>
                      <div className="flex items-center gap-2">
                        <div 
                          className="w-3 h-3 rounded-full shadow-sm"
                          style={{ backgroundColor: habit.color || "#9333EA" }}
                        />
                        <span className="text-sm text-gray-400 font-medium">
                          Daily habit
                        </span>
                      </div>
                    </div>
                  </div>
                  
                  {/* Actions */}
                  <div className="flex items-center gap-4">
                    {/* Info Button */}
                    <button
                      className="flex items-center justify-center w-10 h-10 rounded-xl bg-white/5 hover:bg-white/10 border border-white/10 hover:border-blue-500/30 transition-all duration-300 opacity-0 group-hover:opacity-100"
                      aria-label="Habit info"
                    >
                      <InformationCircleIcon className="w-5 h-5 text-gray-400 hover:text-blue-400 transition-colors" />
                    </button>
                    
                    {/* Sophisticated Checkbox */}
                    <label className="relative inline-flex items-center cursor-pointer">
                      <input
                        type="checkbox"
                        checked={habitProgress[habit.id] || false}
                        onChange={() => toggleCompletion(habit.id)}
                        className="sr-only"
                      />
                      <div className={`relative w-12 h-12 rounded-xl border-2 transition-all duration-300 ${
                        habitProgress[habit.id] 
                          ? 'bg-gradient-to-br from-purple-500 to-pink-500 border-purple-400 shadow-lg shadow-purple-500/25' 
                          : 'bg-white/5 border-white/20 hover:border-purple-400/50 hover:bg-white/10'
                      }`}>
                        {habitProgress[habit.id] ? (
                          <div className="absolute inset-0 flex items-center justify-center">
                            <svg className="w-6 h-6 text-white drop-shadow-sm" fill="currentColor" viewBox="0 0 20 20">
                              <path fillRule="evenodd" d="M16.707 5.293a1 1 0 010 1.414l-8 8a1 1 0 01-1.414 0l-4-4a1 1 0 011.414-1.414L8 12.586l7.293-7.293a1 1 0 011.414 0z" clipRule="evenodd" />
                            </svg>
                          </div>
                        ) : (
                          <div className="absolute inset-0 flex items-center justify-center opacity-0 group-hover:opacity-100 transition-opacity duration-300">
                            <div className="w-2 h-2 rounded-full bg-purple-400"></div>
                          </div>
                        )}
                      </div>
                    </label>
                  </div>
                </div>
                
                {/* Completion Animation Overlay */}
                {habitProgress[habit.id] && (
                  <div className="absolute inset-0 rounded-2xl bg-gradient-to-r from-purple-500/10 to-pink-500/10 pointer-events-none"></div>
                )}
              </div>
            ))
          )}
        </div>

        {/* Premium Edit Modal */}
        {showEditModal && (
          <div className="fixed inset-0 bg-black/70 backdrop-blur-md flex items-center justify-center z-50 p-4 animate-in fade-in duration-300">
            <div className="bg-white/5 backdrop-blur-xl border border-white/10 rounded-3xl shadow-2xl w-full max-w-md transform animate-in zoom-in-95 duration-300">
              {/* Modal Header */}
              <div className="p-8 pb-6">
                <div className="flex items-center gap-3 mb-6">
                  <div className="w-10 h-10 rounded-xl bg-gradient-to-br from-purple-500 to-pink-500 flex items-center justify-center shadow-lg">
                    <Bars2Icon className="w-5 h-5 text-white" />
                  </div>
                  <div>
                    <h4 className="text-2xl font-bold text-white">Edit Habit</h4>
                    <p className="text-gray-400 text-sm">Customize your habit</p>
                  </div>
                </div>
                
                <div className="space-y-6">
                  {/* Habit Name Input */}
                  <div>
                    <label className="block text-sm font-semibold text-gray-300 mb-3">
                      Habit Name
                    </label>
                    <div className="relative">
                      <input
                        type="text"
                        value={editHabitName}
                        onChange={(e) => setEditHabitName(e.target.value)}
                        className="w-full px-6 py-4 bg-white/5 border border-white/10 rounded-xl text-white placeholder-gray-400 focus:outline-none focus:ring-2 focus:ring-purple-500/50 focus:border-purple-500/30 transition-all duration-300 text-lg"
                        placeholder="Enter habit name"
                        maxLength={50}
                      />
                      <div className="absolute inset-0 rounded-xl bg-gradient-to-r from-purple-500/5 to-pink-500/5 opacity-0 focus-within:opacity-100 transition-opacity duration-300 pointer-events-none"></div>
                    </div>
                  </div>
                  
                  {/* Color Selection */}
                  <div>
                    <label className="block text-sm font-semibold text-gray-300 mb-4">
                      Choose Color
                    </label>
                    <div className="grid grid-cols-4 gap-3">
                      {HABIT_COLORS.map((color) => (
                        <button
                          key={color}
                          onClick={() => setSelectedColor(color)}
                          className={`relative w-full aspect-square rounded-xl transition-all duration-300 hover:scale-110 ${
                            selectedColor === color
                              ? "ring-2 ring-white ring-offset-2 ring-offset-transparent shadow-2xl scale-110"
                              : "hover:shadow-lg"
                          }`}
                          style={{ backgroundColor: color }}
                          aria-label={`Select ${color} color`}
                        >
                          {selectedColor === color && (
                            <div className="absolute inset-0 flex items-center justify-center">
                              <svg className="w-6 h-6 text-white drop-shadow-lg" fill="currentColor" viewBox="0 0 20 20">
                                <path fillRule="evenodd" d="M16.707 5.293a1 1 0 010 1.414l-8 8a1 1 0 01-1.414 0l-4-4a1 1 0 011.414-1.414L8 12.586l7.293-7.293a1 1 0 011.414 0z" clipRule="evenodd" />
                              </svg>
                            </div>
                          )}
                        </button>
                      ))}
                    </div>
                  </div>
                </div>
              </div>
              
              {/* Modal Actions */}
              <div className="px-8 py-6 bg-white/5 rounded-b-3xl border-t border-white/10">
                <div className="flex gap-3">
                  <button
                    onClick={handleSaveHabitChanges}
                    disabled={!editHabitName.trim()}
                    className="group relative flex-1 py-3 px-6 bg-gradient-to-r from-purple-600 to-pink-600 hover:from-purple-500 hover:to-pink-500 disabled:from-gray-600 disabled:to-gray-600 disabled:cursor-not-allowed rounded-xl font-semibold text-white shadow-lg hover:shadow-xl transition-all duration-300 overflow-hidden"
                  >
                    <div className="absolute inset-0 bg-gradient-to-r from-white/0 via-white/10 to-white/0 translate-x-[-100%] group-hover:translate-x-[100%] transition-transform duration-700"></div>
                    <span className="relative">Save Changes</span>
                  </button>
                  
                  <button
                    onClick={handleDeleteHabit}
                    className="px-6 py-3 bg-red-500/20 hover:bg-red-500/30 border border-red-500/30 hover:border-red-500/50 rounded-xl text-red-300 hover:text-red-200 font-semibold transition-all duration-300"
                  >
                    Delete
                  </button>
                  
                  <button
                    onClick={() => setShowEditModal(false)}
                    className="px-6 py-3 bg-white/5 hover:bg-white/10 border border-white/10 hover:border-white/20 rounded-xl text-gray-300 hover:text-white font-semibold transition-all duration-300"
                  >
                    Cancel
                  </button>
                </div>
              </div>
            </div>
          </div>
        )}
      </div>
    </div>
  );
}
