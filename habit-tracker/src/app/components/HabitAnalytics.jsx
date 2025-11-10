"use client";

import React, { useEffect, useMemo, useState, useCallback } from "react";
import { supabase } from "@/services/supabase";
import dayjs from "dayjs";
import isoWeek from "dayjs/plugin/isoWeek";
import { X, Calendar, CheckCircle, TrendingUp } from "lucide-react";
import {
  DndContext,
  closestCenter,
  KeyboardSensor,
  PointerSensor,
  TouchSensor,
  useSensor,
  useSensors,
} from "@dnd-kit/core";
import {
  arrayMove,
  SortableContext,
  sortableKeyboardCoordinates,
  rectSortingStrategy,
} from "@dnd-kit/sortable";
import SortableStatCard from "./SortableStatCard";
dayjs.extend(isoWeek);

// Recharts (no Tooltip to avoid selector chain issues)
import { AreaChart, Area, ResponsiveContainer, XAxis, YAxis } from "recharts";

/* --------------------------------- Utils --------------------------------- */

const toISO = (d) =>
  (d instanceof Date ? d : new Date(d)).toLocaleDateString("en-CA"); // YYYY-MM-DD

const startOfYearISO = (y) => `${y}-01-01`;
const endOfYearISO = (y) => `${y}-12-31`;
const daysInMonth = (y, m0) => new Date(y, m0 + 1, 0).getDate();

function rangeDays(startISO, endISO) {
  const out = [];
  let cur = dayjs(startISO);
  const end = dayjs(endISO);
  while (!cur.isAfter(end)) {
    out.push(cur.format("YYYY-MM-DD"));
    cur = cur.add(1, "day");
  }
  return out;
}

function computeStreaks(sortedDaysAsc, todayISO) {
  if (!sortedDaysAsc.length) return { current: 0, longest: 0 };
  let longest = 0;
  let cur = 0;
  let prev = null;
  for (const d of sortedDaysAsc) {
    if (!prev) cur = 1;
    else cur = dayjs(d).diff(dayjs(prev), "day") === 1 ? cur + 1 : 1;
    longest = Math.max(longest, cur);
    prev = d;
  }
  const last = sortedDaysAsc[sortedDaysAsc.length - 1];
  const gap = dayjs(toISO(todayISO)).diff(dayjs(last), "day");
  const current = gap === 0 || gap === 1 ? cur : 0;
  return { current, longest };
}

function donutPercent(value, max = 100) {
  const pct = Math.max(0, Math.min(100, Math.round((value / max) * 100)));
  const r = 18;
  const c = 2 * Math.PI * r;
  const dash = (pct / 100) * c;
  return { c, dash, r, pct };
}

/* ------------------------------ Tiny Sparkline ---------------------------- */

function TinyArea({ data = [] }) {
  // Always give Recharts at least one point and hidden axes
  const chartData = data.length ? data : [{ x: "", y: 0 }];

  return (
    <div className="w-full h-24">
      <ResponsiveContainer width="100%" height="100%">
        <AreaChart
          data={chartData}
          margin={{ top: 4, right: 4, left: 0, bottom: 0 }}
        >
          <XAxis dataKey="x" hide />
          <YAxis hide domain={[0, "dataMax"]} />
          <Area
            type="monotone"
            dataKey="y"
            stroke="#a78bfa"
            fill="#a78bfa33"
            strokeWidth={2}
            dot={false}
            isAnimationActive={false}
          />
        </AreaChart>
      </ResponsiveContainer>
    </div>
  );
}

/* ------------------------------ Mini Month UI ----------------------------- */

function MiniMonth({ month, highlighted = new Set(), onChangeMonth, onDateClick }) {
  const y = month.year();
  const m0 = month.month();
  const first = dayjs(new Date(y, m0, 1));
  const last = dayjs(new Date(y, m0, daysInMonth(y, m0)));
  const startGrid = first.startOf("week"); // Sunday start
  const endGrid = last.endOf("week");

  const rows = [];
  for (
    let row = dayjs(startGrid);
    !row.isAfter(endGrid);
    row = row.add(1, "week")
  ) {
    rows.push(
      Array.from({ length: 7 }).map((_, i) => {
        const d = row.add(i, "day");
        const iso = d.format("YYYY-MM-DD");
        return {
          iso,
          day: d.date(),
          inMonth: d.month() === m0,
          hit: highlighted.has(iso),
        };
      })
    );
  }

  return (
    <div className="w-full">
      <div className="flex items-center justify-between mb-3 text-sm text-white">
        <button
          className="px-2 py-1 rounded-lg hover:bg-slate-700/50 transition-colors text-slate-400 hover:text-white"
          onClick={() => onChangeMonth(month.subtract(1, "month"))}
        >
          &lt;
        </button>
        <div className="font-semibold text-sm">{month.format("MMMM YYYY")}</div>
        <button
          className="px-2 py-1 rounded-lg hover:bg-slate-700/50 transition-colors text-slate-400 hover:text-white"
          onClick={() => onChangeMonth(month.add(1, "month"))}
        >
          &gt;
        </button>
      </div>

      <div className="grid grid-cols-7 text-xs text-slate-500 mb-2">
        {["Su", "Mo", "Tu", "We", "Th", "Fr", "Sa"].map((d) => (
          <div key={d} className="text-center py-1 text-xs">
            {d}
          </div>
        ))}
      </div>

      <div className="grid grid-cols-7 gap-1">
        {rows.flat().map((c) => (
          <button
            key={c.iso}
            onClick={() => onDateClick && c.inMonth && onDateClick(c.iso)}
            disabled={!c.inMonth}
            className={`relative h-8 rounded-md text-xs ${
              c.inMonth 
                ? "text-white hover:bg-slate-700/50 cursor-pointer transition-colors" 
                : "text-slate-600 cursor-not-allowed"
            } flex items-center justify-center`}
          >
            <div className="relative inline-flex flex-col items-center leading-none">
              <span className="leading-none text-xs">{c.day}</span>
              {c.hit && (
                <span
                  className="absolute -bottom-1 left-1/2 -translate-x-1/2 w-1.5 h-1.5 rounded-full bg-indigo-500"
                />
              )}
            </div>
          </button>
        ))}
      </div>
    </div>
  );
}

/* ------------------------------ Main Component ---------------------------- */

export default function HabitAnalytics({ compact = false, belowHeatmap = false }) {
  // Gate rendering to client to avoid SSR time/locale/random differences
  const [mounted, setMounted] = useState(false);
  useEffect(() => setMounted(true), []);

  const [month, setMonth] = useState(dayjs());
  const [loading, setLoading] = useState(true);
  const [byDay, setByDay] = useState({}); // { 'YYYY-MM-DD': count }
  const [year, setYear] = useState(new Date().getFullYear());
  const [userId, setUserId] = useState(null);
  const [selectedDate, setSelectedDate] = useState(null);
  const [habitDetails, setHabitDetails] = useState([]);
  const [loadingDetails, setLoadingDetails] = useState(false);
  
  // Drag and drop state for stats order
  const [statOrder, setStatOrder] = useState(() => {
    if (typeof window !== "undefined") {
      const saved = localStorage.getItem("analytics-stat-order");
      return saved ? JSON.parse(saved) : [
        "current-streak",
        "longest-streak",
        "monthly-consistency",
        "this-week",
        "in-month",
        "overall-rate",
      ];
    }
    return [
      "current-streak",
      "longest-streak",
      "monthly-consistency",
      "this-week",
      "in-month",
      "overall-rate",
    ];
  });

  // Save order to localStorage when it changes
  useEffect(() => {
    if (mounted && typeof window !== "undefined") {
      localStorage.setItem("analytics-stat-order", JSON.stringify(statOrder));
    }
  }, [statOrder, mounted]);

  // DnD sensors
  const sensors = useSensors(
    useSensor(PointerSensor, { activationConstraint: { distance: 8 } }),
    useSensor(TouchSensor, {
      activationConstraint: { delay: 120, tolerance: 6 },
    }),
    useSensor(KeyboardSensor, { coordinateGetter: sortableKeyboardCoordinates })
  );

  // Handle drag end
  const handleDragEnd = useCallback((event) => {
    const { active, over } = event;
    if (over && active.id !== over.id) {
      setStatOrder((items) => {
        const oldIndex = items.indexOf(active.id);
        const newIndex = items.indexOf(over.id);
        return arrayMove(items, oldIndex, newIndex);
      });
    }
  }, []);

  const todayISO = useMemo(() => toISO(new Date()), []);
  const yearRange = useMemo(() => {
    const y = new Date().getFullYear();
    return { since: startOfYearISO(y), until: endOfYearISO(y) };
  }, []);

  const load = useCallback(async () => {
    setLoading(true);
    try {
      const {
        data: { user },
      } = await supabase.auth.getUser();
      if (!user) {
        setByDay({});
        setUserId(null);
        setLoading(false);
        return;
      }
      
      setUserId(user.id);

      // Prefer completed_on; fallback to completed_at within the year
      let { data, error } = await supabase
        .from("habit_completions")
        .select("completed_on, completed_at")
        .eq("user_id", user.id)
        .gte("completed_on", yearRange.since)
        .lte("completed_on", yearRange.until);

      let rows = data || [];
      if (error || !Array.isArray(rows)) {
        const start = new Date(`${yearRange.since}T00:00:00`).toISOString();
        const end = new Date(`${yearRange.until}T23:59:59.999`).toISOString();
        const res2 = await supabase
          .from("habit_completions")
          .select("completed_at")
          .eq("user_id", user.id)
          .gte("completed_at", start)
          .lte("completed_at", end);
        rows = res2.data || [];
      }

      const map = {};
      for (const r of rows) {
        const iso = r.completed_on ? r.completed_on : toISO(r.completed_at);
        map[iso] = (map[iso] || 0) + 1;
      }
      setByDay(map);
      setYear(new Date().getFullYear());
    } finally {
      setLoading(false);
    }
  }, [yearRange.since, yearRange.until]);

  useEffect(() => {
    if (!mounted) return;
    load();
    const ch = supabase
      .channel("analytics-realtime")
      .on(
        "postgres_changes",
        { event: "*", schema: "public", table: "habit_completions" },
        load
      )
      .subscribe();
    return () => supabase.removeChannel(ch);
  }, [mounted, load]);

  // Fetch habit details for a specific date
  const fetchHabitDetails = useCallback(async (date) => {
    if (!userId) return;
    
    setLoadingDetails(true);
    try {
      const { data, error } = await supabase
        .from("habit_completions")
        .select(`
          completed_at,
          habits (
            id,
            name,
            color,
            note
          )
        `)
        .eq("user_id", userId)
        .eq("completed_on", date)
        .order("completed_at", { ascending: true });

      if (error) {
        console.error("Error fetching habit details:", error);
        setHabitDetails([]);
      } else {
        setHabitDetails(data || []);
      }
    } catch (err) {
      console.error("Error fetching habit details:", err);
      setHabitDetails([]);
    } finally {
      setLoadingDetails(false);
    }
  }, [userId]);

  // Handle date click
  const handleDateClick = useCallback(async (dateISO) => {
    setSelectedDate(dateISO);
    await fetchHabitDetails(dateISO);
  }, [fetchHabitDetails]);

  // Close modal
  const closeModal = useCallback(() => {
    setSelectedDate(null);
    setHabitDetails([]);
  }, []);

  // Derived metrics (all computed on client after mount)
  const {
    monthCompletedDays,
    monthConsistencyPct,
    monthSpark,
    yearSpark,
    weekCompletedDays,
    yearCompletedDays,
    overallRatePct,
    streaks,
    monthHighlightSet,
  } = useMemo(() => {
    if (!mounted) {
      return {
        monthCompletedDays: 0,
        monthConsistencyPct: 0,
        monthSpark: [],
        yearSpark: [],
        weekCompletedDays: 0,
        yearCompletedDays: 0,
        overallRatePct: 0,
        streaks: { current: 0, longest: 0 },
        monthHighlightSet: new Set(),
      };
    }

    const y = month.year();
    const m0 = month.month();

    const mdays = daysInMonth(y, m0);
    const startMonthISO = `${y}-${String(m0 + 1).padStart(2, "0")}-01`;
    const endMonthISO = `${y}-${String(m0 + 1).padStart(2, "0")}-${String(
      mdays
    ).padStart(2, "0")}`;
    const allMonthDays = rangeDays(startMonthISO, endMonthISO);

    const completedMonth = allMonthDays.filter((d) => (byDay[d] || 0) > 0);
    const monthConsistency = Math.round(
      (completedMonth.length / allMonthDays.length) * 100
    );

    // ISO week
    const weekStart = dayjs().startOf("isoWeek").format("YYYY-MM-DD");
    const weekEnd = dayjs().endOf("isoWeek").format("YYYY-MM-DD");
    const weekRange = rangeDays(weekStart, weekEnd);
    const weekCompleted = weekRange.filter((d) => (byDay[d] || 0) > 0);

    // Year stats over elapsed days
    const yStart = startOfYearISO(year);
    const yEnd = endOfYearISO(year);
    const yRange = rangeDays(yStart, yEnd);
    const yCompleted = yRange.filter((d) => (byDay[d] || 0) > 0);

    const st = computeStreaks(yCompleted, todayISO);

    const makeSpark = (daysArr) =>
      daysArr.map((iso) => ({ x: iso, y: byDay[iso] || 0 }));
    const monthSparkline = makeSpark(allMonthDays);
    const yearSparkline = makeSpark(yRange);

    const elapsedDays = dayjs(todayISO).diff(dayjs(yStart), "day") + 1;
    const overallRate = Math.round((yCompleted.length / elapsedDays) * 100);

    return {
      monthCompletedDays: completedMonth.length,
      monthConsistencyPct: monthConsistency,
      monthSpark: monthSparkline,
      yearSpark: yearSparkline,
      weekCompletedDays: weekCompleted.length,
      yearCompletedDays: yCompleted.length,
      overallRatePct: overallRate,
      streaks: st,
      monthHighlightSet: new Set(completedMonth),
    };
  }, [mounted, byDay, month, todayISO, year]);

  // Until mounted, render nothing (server & client match null -> no mismatch)
  if (!mounted) return null;

  // Optional loading state (client-only)
  if (loading) {
    return (
      <section className="w-full text-gray-100 space-y-6">
        <div className="h-6 w-48 bg-gray-800 rounded" />
        <div className="grid grid-cols-1 lg:grid-cols-[280px,1fr] gap-8">
          <div className="h-64 bg-gray-900 rounded-2xl border border-gray-800" />
          <div className="space-y-5">
            <div className="h-24 bg-gray-900 rounded-2xl border border-gray-800" />
            <div className="h-24 bg-gray-900 rounded-2xl border border-gray-800" />
            <div className="h-24 bg-gray-900 rounded-2xl border border-gray-800" />
          </div>
        </div>
      </section>
    );
  }

  const donutMonth = donutPercent(monthConsistencyPct, 100);
  const donutOverall = donutPercent(overallRatePct, 100);

  // Modal component - shared across all views
  const HabitDetailsModal = () => {
    if (!selectedDate) return null;
    
    return (
      <div className="fixed inset-0 bg-black/80 backdrop-blur-md flex items-start justify-center z-50 p-4 pt-6 sm:pt-8">
        <div className="bg-gradient-to-br from-slate-800/95 via-slate-800/90 to-slate-800/95 backdrop-blur-xl rounded-2xl shadow-2xl border border-slate-700/50 w-full max-w-md max-h-[80vh] overflow-hidden mt-0 sm:mt-4">
          {/* Modal Header */}
          <div className="p-6 border-b border-slate-700/50 bg-gradient-to-r from-indigo-600/10 via-blue-600/10 to-cyan-600/10">
            <div className="flex items-center justify-between">
              <div className="flex items-center gap-3">
                <div className="w-10 h-10 rounded-xl bg-gradient-to-br from-indigo-500 via-blue-500 to-cyan-500 flex items-center justify-center shadow-lg shadow-indigo-500/50">
                  <Calendar className="w-5 h-5 text-white" />
                </div>
                <div>
                  <h3 className="text-xl font-bold text-white">
                    {new Date(selectedDate).toLocaleDateString('en-US', {
                      weekday: 'long',
                      year: 'numeric',
                      month: 'long',
                      day: 'numeric'
                    })}
                  </h3>
                  <p className="text-gray-400 text-sm">
                    {habitDetails.length} habit{habitDetails.length === 1 ? '' : 's'} completed
                  </p>
                </div>
              </div>
              <button
                onClick={closeModal}
                className="w-8 h-8 flex items-center justify-center rounded-lg bg-slate-700/50 hover:bg-slate-700 text-slate-400 hover:text-white transition-colors border border-slate-600/50"
              >
                <X size={20} />
              </button>
            </div>
          </div>

          {/* Modal Content */}
          <div className="p-6 max-h-96 overflow-y-auto">
            {loadingDetails ? (
              <div className="flex items-center justify-center py-8">
                <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-indigo-500"></div>
              </div>
            ) : habitDetails.length === 0 ? (
              <div className="text-center py-8">
                <div className="w-16 h-16 mx-auto mb-4 rounded-full bg-slate-700/30 flex items-center justify-center">
                  <Calendar className="w-8 h-8 text-slate-500" />
                </div>
                <p className="text-slate-400">No habits completed on this date</p>
              </div>
            ) : (
              <div className="space-y-3">
                {habitDetails.map((completion, index) => {
                  // Handle both object and array formats from Supabase join
                  const habit = Array.isArray(completion.habits) 
                    ? completion.habits[0] 
                    : completion.habits;
                  
                  return (
                    <div
                      key={completion.id || index}
                      className="flex items-center gap-3 p-4 bg-slate-700/30 rounded-xl border border-slate-600/30 hover:border-indigo-500/30 transition-colors"
                    >
                      <div className="w-10 h-10 rounded-lg bg-emerald-500/20 flex items-center justify-center border border-emerald-500/30">
                        <CheckCircle className="w-5 h-5 text-emerald-400" />
                      </div>
                      <div className="flex-1 min-w-0">
                        <h4 className="text-white font-semibold mb-1">
                          {habit?.name || 'Unknown Habit'}
                        </h4>
                        <p className="text-slate-400 text-sm">
                          {completion.completed_at 
                            ? `Completed at ${new Date(completion.completed_at).toLocaleTimeString(navigator.language || undefined, {
                                hour: '2-digit',
                                minute: '2-digit'
                              })}`
                            : 'Completion time not available'}
                        </p>
                        {habit?.note && (
                          <p className="text-slate-500 text-xs mt-2 italic border-l-2 border-indigo-500/30 pl-2">
                            "{habit.note}"
                          </p>
                        )}
                      </div>
                      {habit?.color && (
                        <div
                          className="w-5 h-5 rounded-full border-2 border-slate-600 shadow-sm flex-shrink-0"
                          style={{ backgroundColor: habit.color }}
                        />
                      )}
                    </div>
                  );
                })}
              </div>
            )}
          </div>
        </div>
      </div>
    );
  };

  // Define stat components
  const statComponents = {
    "current-streak": (
      <div className="bg-gradient-to-br from-slate-800/40 via-slate-800/30 to-slate-800/40 backdrop-blur-xl rounded-xl border border-slate-700/50 p-4">
        <div className="flex items-center justify-between">
          <div>
            <div className="text-2xl font-bold text-white">
              {streaks.current}
              <span className="text-sm font-normal ml-1 text-slate-400">Days</span>
            </div>
            <div className="text-xs text-slate-400 mt-1 uppercase tracking-wider">Current Streak</div>
          </div>
          <div className="w-10 h-10 rounded-lg bg-indigo-500/20 flex items-center justify-center border border-indigo-500/30">
            <span className="text-indigo-400 text-lg">🔥</span>
          </div>
        </div>
      </div>
    ),
    "longest-streak": (
      <div className="bg-gradient-to-br from-slate-800/40 via-slate-800/30 to-slate-800/40 backdrop-blur-xl rounded-xl border border-slate-700/50 p-4">
        <div className="flex items-center justify-between">
          <div>
            <div className="text-2xl font-bold text-white">
              {streaks.longest}
              <span className="text-sm font-normal ml-1 text-slate-400">Days</span>
            </div>
            <div className="text-xs text-slate-400 mt-1 uppercase tracking-wider">Longest Streak</div>
          </div>
          <div className="w-10 h-10 rounded-lg bg-emerald-500/20 flex items-center justify-center border border-emerald-500/30">
            <span className="text-emerald-400 text-lg">⭐</span>
          </div>
        </div>
      </div>
    ),
    "monthly-consistency": (
      <div className="bg-gradient-to-br from-slate-800/40 via-slate-800/30 to-slate-800/40 backdrop-blur-xl rounded-xl border border-slate-700/50 p-4">
        <div className="flex items-center justify-between mb-3">
          <div className="text-xs text-slate-400 uppercase tracking-wider">Monthly Consistency</div>
          <div className="text-xl font-bold text-white">
            {monthConsistencyPct}%
          </div>
        </div>
        <div className="w-full h-2 bg-slate-700/50 rounded-full overflow-hidden">
          <div 
            className="h-full bg-gradient-to-r from-indigo-500 to-blue-500 rounded-full transition-all duration-500"
            style={{ width: `${monthConsistencyPct}%` }}
          />
        </div>
      </div>
    ),
    "this-week": (
      <div className="bg-gradient-to-br from-slate-800/40 via-slate-800/30 to-slate-800/40 backdrop-blur-xl rounded-xl border border-slate-700/50 p-4">
        <div className="flex items-center justify-between">
          <div>
            <div className="text-2xl font-bold text-white">
              {rangeDays(
                dayjs().startOf("isoWeek").format("YYYY-MM-DD"),
                dayjs().endOf("isoWeek").format("YYYY-MM-DD")
              ).filter((d) => (byDay[d] || 0) > 0).length}
              <span className="text-sm font-normal ml-1 text-slate-400">Days</span>
            </div>
            <div className="text-xs text-slate-400 mt-1 uppercase tracking-wider">This Week</div>
          </div>
          <div className="w-10 h-10 rounded-lg bg-cyan-500/20 flex items-center justify-center border border-cyan-500/30">
            <span className="text-cyan-400 text-lg">📅</span>
          </div>
        </div>
      </div>
    ),
    "in-month": (
      <div className="bg-gradient-to-br from-slate-800/40 via-slate-800/30 to-slate-800/40 backdrop-blur-xl rounded-xl border border-slate-700/50 p-4">
        <div className="flex items-center justify-between">
          <div className="flex-1 min-w-0">
            <div className="text-2xl font-bold text-white">
              {monthCompletedDays}
              <span className="text-sm font-normal ml-1 text-slate-400">Days</span>
            </div>
            <div className="text-xs text-slate-400 mt-1 uppercase tracking-wider truncate">
              In {month.format("MMMM")}
            </div>
          </div>
          <div className="w-10 h-10 rounded-lg bg-blue-500/20 flex items-center justify-center border border-blue-500/30 ml-3">
            <span className="text-blue-400 text-lg">📊</span>
          </div>
        </div>
      </div>
    ),
    "overall-rate": (
      <div className="bg-gradient-to-br from-slate-800/40 via-slate-800/30 to-slate-800/40 backdrop-blur-xl rounded-xl border border-slate-700/50 p-4">
        <div className="flex items-center justify-between mb-3">
          <div className="text-xs text-slate-400 uppercase tracking-wider">Overall Rate</div>
          <div className="text-xl font-bold text-white">
            {overallRatePct}%
          </div>
        </div>
        <div className="w-full h-2 bg-slate-700/50 rounded-full overflow-hidden">
          <div 
            className="h-full bg-gradient-to-r from-cyan-500 to-emerald-500 rounded-full transition-all duration-500"
            style={{ width: `${overallRatePct}%` }}
          />
        </div>
      </div>
    ),
  };

  // If rendering below heatmap, show horizontal grid layout with drag-and-drop
  if (belowHeatmap) {
    return (
      <>
        <section className="w-full text-gray-100">
          <div className="bg-gradient-to-br from-slate-800/40 via-slate-800/30 to-slate-800/40 backdrop-blur-xl rounded-2xl border border-slate-700/50 shadow-2xl shadow-indigo-900/20 p-4 sm:p-6">
            <h3 className="text-lg sm:text-xl font-bold text-white mb-4 sm:mb-6 flex items-center gap-2">
              <TrendingUp className="w-4 h-4 sm:w-5 sm:h-5 text-indigo-400" />
              Additional Statistics
              <span className="text-xs text-slate-400 font-normal ml-2">(Drag to reorder)</span>
            </h3>
            <DndContext
              sensors={sensors}
              collisionDetection={closestCenter}
              onDragEnd={handleDragEnd}
            >
              <SortableContext items={statOrder} strategy={rectSortingStrategy}>
                <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
                  {statOrder.map((statId) => (
                    <SortableStatCard key={statId} id={statId}>
                      {statComponents[statId]}
                    </SortableStatCard>
                  ))}
                </div>
              </SortableContext>
            </DndContext>
          </div>
        </section>
        <HabitDetailsModal />
      </>
    );
  }

  // Compact sidebar view - Calendar only (no duplicate stats)
  if (compact) {
    return (
      <>
        <section className="w-full text-gray-100">
          <div className="space-y-6">
            {/* Calendar - Main interactive element */}
            <div className="space-y-4">
              <div>
                <h3 className="text-sm font-semibold text-slate-400 mb-3 uppercase tracking-wider">
                  Date Navigator
                </h3>
                <MiniMonth
                  month={month}
                  highlighted={monthHighlightSet}
                  onChangeMonth={setMonth}
                  onDateClick={handleDateClick}
                />
              </div>
            </div>
          </div>
        </section>
        <HabitDetailsModal />
      </>
    );
  }

  // Full view - original layout
  return (
    <section className="w-full text-gray-100">
      <div className="space-y-6">
        {/* Calendar */}
        <div className="space-y-4">
          <div>
            <h3 className="text-sm font-semibold text-slate-400 mb-3 uppercase tracking-wider">
              Selected Month
            </h3>
            <MiniMonth
              month={month}
              highlighted={monthHighlightSet}
              onChangeMonth={setMonth}
              onDateClick={handleDateClick}
            />
          </div>
        </div>

          {/* Stats Grid - Single column for sidebar */}
          <div className="space-y-4">
            {/* Current streak */}
            <div className="bg-gradient-to-br from-slate-800/40 via-slate-800/30 to-slate-800/40 backdrop-blur-xl rounded-xl border border-slate-700/50 p-4">
              <div className="flex items-center justify-between">
                <div>
                  <div className="text-3xl font-bold text-white">
                    {streaks.current}
                    <span className="text-sm font-normal ml-1 text-slate-400">Days</span>
                  </div>
                  <div className="text-xs text-slate-400 mt-1 uppercase tracking-wider">Current Streak</div>
                </div>
                <div className="w-12 h-12 rounded-lg bg-indigo-500/20 flex items-center justify-center border border-indigo-500/30">
                  <span className="text-indigo-400 text-xl">🔥</span>
                </div>
              </div>
            </div>

            {/* Longest streak */}
            <div className="bg-gradient-to-br from-slate-800/40 via-slate-800/30 to-slate-800/40 backdrop-blur-xl rounded-xl border border-slate-700/50 p-4">
              <div className="flex items-center justify-between">
                <div>
                  <div className="text-3xl font-bold text-white">
                    {streaks.longest}
                    <span className="text-sm font-normal ml-1 text-slate-400">Days</span>
                  </div>
                  <div className="text-xs text-slate-400 mt-1 uppercase tracking-wider">Longest Streak</div>
                </div>
                <div className="w-12 h-12 rounded-lg bg-emerald-500/20 flex items-center justify-center border border-emerald-500/30">
                  <span className="text-emerald-400 text-xl">⭐</span>
                </div>
              </div>
            </div>

            {/* Monthly consistency */}
            <div className="bg-gradient-to-br from-slate-800/40 via-slate-800/30 to-slate-800/40 backdrop-blur-xl rounded-xl border border-slate-700/50 p-4">
              <div className="flex items-center justify-between mb-3">
                <div className="text-xs text-slate-400 uppercase tracking-wider">Monthly Consistency</div>
                <div className="text-2xl font-bold text-white">
                  {monthConsistencyPct}%
                </div>
              </div>
              <div className="w-full h-2 bg-slate-700/50 rounded-full overflow-hidden">
                <div 
                  className="h-full bg-gradient-to-r from-indigo-500 to-blue-500 rounded-full transition-all duration-500"
                  style={{ width: `${monthConsistencyPct}%` }}
                />
              </div>
            </div>

            {/* Completed this week */}
            <div className="bg-gradient-to-br from-slate-800/40 via-slate-800/30 to-slate-800/40 backdrop-blur-xl rounded-xl border border-slate-700/50 p-4">
              <div className="flex items-center justify-between">
                <div>
                  <div className="text-3xl font-bold text-white">
                    {rangeDays(
                      dayjs().startOf("isoWeek").format("YYYY-MM-DD"),
                      dayjs().endOf("isoWeek").format("YYYY-MM-DD")
                    ).filter((d) => (byDay[d] || 0) > 0).length}
                    <span className="text-sm font-normal ml-1 text-slate-400">Days</span>
                  </div>
                  <div className="text-xs text-slate-400 mt-1 uppercase tracking-wider">This Week</div>
                </div>
                <div className="w-12 h-12 rounded-lg bg-cyan-500/20 flex items-center justify-center border border-cyan-500/30">
                  <span className="text-cyan-400 text-xl">📅</span>
                </div>
              </div>
            </div>

            {/* Completed in month */}
            <div className="bg-gradient-to-br from-slate-800/40 via-slate-800/30 to-slate-800/40 backdrop-blur-xl rounded-xl border border-slate-700/50 p-4">
              <div className="flex items-center justify-between">
                <div className="flex-1 min-w-0">
                  <div className="text-3xl font-bold text-white">
                    {monthCompletedDays}
                    <span className="text-sm font-normal ml-1 text-slate-400">Days</span>
                  </div>
                  <div className="text-xs text-slate-400 mt-1 uppercase tracking-wider truncate">
                    In {month.format("MMMM")}
                  </div>
                </div>
                <div className="w-12 h-12 rounded-lg bg-blue-500/20 flex items-center justify-center border border-blue-500/30 ml-3">
                  <span className="text-blue-400 text-xl">📊</span>
                </div>
              </div>
            </div>

            {/* Overall rate */}
            <div className="bg-gradient-to-br from-slate-800/40 via-slate-800/30 to-slate-800/40 backdrop-blur-xl rounded-xl border border-slate-700/50 p-4">
              <div className="flex items-center justify-between mb-3">
                <div className="text-xs text-slate-400 uppercase tracking-wider">Overall Rate</div>
                <div className="text-2xl font-bold text-white">
                  {overallRatePct}%
                </div>
              </div>
              <div className="w-full h-2 bg-slate-700/50 rounded-full overflow-hidden">
                <div 
                  className="h-full bg-gradient-to-r from-cyan-500 to-emerald-500 rounded-full transition-all duration-500"
                  style={{ width: `${overallRatePct}%` }}
                />
              </div>
            </div>
          </div>
      </div>

      <HabitDetailsModal />
    </section>
  );
}
