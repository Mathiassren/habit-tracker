"use client";

import dynamic from "next/dynamic";
import React, { useEffect, useMemo, useState } from "react";
import AnalyticsPage from "../analytics/page";
import { supabase } from "@/services/supabase";
import { X, Calendar, CheckCircle } from "lucide-react";

const ActivityCalendar = dynamic(() => import("react-activity-calendar"), {
  ssr: false,
});

// Local YYYY-MM-DD
function toISO(d) {
  const y = d.getFullYear();
  const m = String(d.getMonth() + 1).padStart(2, "0");
  const day = String(d.getDate()).padStart(2, "0");
  return `${y}-${m}-${day}`;
}

export default function HabitHeatmap({
  byDate = {}, // { 'YYYY-MM-DD': number }
  title = "Progress Grid",
  weekStart = 1, // 1 = Monday (feel free to set 0 for Sunday)
  userId = null,
}) {
  const [selectedDate, setSelectedDate] = useState(null);
  const [habitDetails, setHabitDetails] = useState([]);
  const [loading, setLoading] = useState(false);
  const [isDesktop, setIsDesktop] = useState(false);

  // Detect desktop for responsive sizing
  useEffect(() => {
    const checkDesktop = () => {
      setIsDesktop(typeof window !== 'undefined' && window.innerWidth >= 1024);
    };
    checkDesktop();
    window.addEventListener('resize', checkDesktop);
    return () => window.removeEventListener('resize', checkDesktop);
  }, []);

  // Fetch habit details for a specific date
  const fetchHabitDetails = async (date) => {
    if (!userId) return;
    
    setLoading(true);
    try {
      // Try querying by completed_on first
      let { data, error } = await supabase
        .from("habit_completions")
        .select(`
          completed_at,
          completed_on,
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

      // If no results or error, try fallback using completed_at date range
      if (error || !data || data.length === 0) {
        const start = new Date(`${date}T00:00:00`).toISOString();
        const end = new Date(`${date}T23:59:59.999`).toISOString();
        
        const res2 = await supabase
          .from("habit_completions")
          .select(`
            completed_at,
            completed_on,
            habits (
              id,
              name,
              color,
              note
            )
          `)
          .eq("user_id", userId)
          .gte("completed_at", start)
          .lte("completed_at", end)
          .order("completed_at", { ascending: true });
        
        if (res2.error) {
          console.error("Error fetching habit details (fallback):", res2.error);
          setHabitDetails([]);
        } else {
          setHabitDetails(res2.data || []);
        }
      } else {
        setHabitDetails(data || []);
      }
    } catch (err) {
      console.error("Error fetching habit details:", err);
      setHabitDetails([]);
    } finally {
      setLoading(false);
    }
  };

  // Handle heat field click
  const handleHeatFieldClick = async (value) => {
    if (!value) return;
    
    // Handle different value formats from react-activity-calendar
    // The value can be an object with {date, count, level} or just a date string
    let dateStr = null;
    
    if (typeof value === 'object' && value !== null) {
      dateStr = value.date || value.dateStr || value;
    } else if (typeof value === 'string') {
      dateStr = value;
    }
    
    if (!dateStr) {
      console.warn("No date found in click value:", value);
      return;
    }
    
    // Ensure date is in YYYY-MM-DD format
    let formattedDate = dateStr;
    if (dateStr instanceof Date) {
      formattedDate = toISO(dateStr);
    } else if (typeof dateStr === 'string') {
      // If it's already in ISO format, use it; otherwise try to parse
      if (!dateStr.match(/^\d{4}-\d{2}-\d{2}$/)) {
        const parsed = new Date(dateStr);
        if (!isNaN(parsed.getTime())) {
          formattedDate = toISO(parsed);
        } else {
          console.warn("Could not parse date:", dateStr);
          return;
        }
      }
    }
    
    setSelectedDate(formattedDate);
    await fetchHabitDetails(formattedDate);
  };

  // Close modal
  const closeModal = () => {
    setSelectedDate(null);
    setHabitDetails([]);
  };
  const { startISO, endISO, data, total } = useMemo(() => {
    const today = new Date();
    today.setHours(0, 0, 0, 0);

    const year = today.getFullYear();
    const start = new Date(year, 0, 1);
    start.setHours(0, 0, 0, 0);
    // Use end of year for proper calendar display
    const endOfYear = new Date(year, 11, 31);
    endOfYear.setHours(23, 59, 59, 999);

    // Build continuous range Jan 1 -> end of year (inclusive) for full calendar display
    // This ensures all squares are clickable
    const days = [];
    for (let d = new Date(start); d <= endOfYear; d.setDate(d.getDate() + 1)) {
      days.push(toISO(d));
    }

    // Find max to scale levels (0..4). If all zeros, levels stay 0.
    let max = 0;
    for (const iso of days) {
      const c = Number(byDate?.[iso] ?? 0);
      if (c > max) max = c;
    }
    const t1 = max > 0 ? Math.max(1, Math.ceil(max * 0.25)) : 1;
    const t2 = max > 0 ? Math.max(t1 + 1, Math.ceil(max * 0.5)) : 2;
    const t3 = max > 0 ? Math.max(t2 + 1, Math.ceil(max * 0.75)) : 3;
    const t4 = max > 0 ? max : 4;

    const levelFor = (c) => {
      if (c <= 0) return 0;
      if (c <= t1) return 1;
      if (c <= t2) return 2;
      if (c <= t3) return 3;
      return 4;
    };

    // Include ALL dates (even future ones) so all squares are clickable
    const values = days.map((iso) => {
      const c = Number(byDate?.[iso] ?? 0);
      return { date: iso, count: c, level: levelFor(c) };
    });

    const sum = values.reduce((a, v) => a + (v.count || 0), 0);

    return {
      startISO: toISO(start),
      endISO: toISO(endOfYear),
      data: values,
      total: sum,
    };
  }, [byDate]);

  return (
    <section>
      <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-2 sm:gap-0 mb-4 lg:mb-3">
        <h3 className="text-lg sm:text-xl lg:text-xl font-bold text-white">{title}</h3>
        <div className="text-xs text-slate-400 hidden sm:block">
          Click any square to view details
        </div>
      </div>
      <div 
        className="overflow-x-auto -mx-2 px-2 heatmap-scroll lg:overflow-x-visible" 
        style={{ cursor: 'pointer' }}
      >
        <ActivityCalendar
          data={data} // Jan 1 → Dec 31 (all dates included for clickability)
          startDate={startISO}
          endDate={endISO}
          weekStart={weekStart}
          blockSize={isDesktop ? 10 : 12}
          blockMargin={isDesktop ? 3 : 4}
          fontSize={isDesktop ? 10 : 11}
          colorScheme="dark"
          hideTotalCount={false}
          labels={{
            legend: { less: "Less", more: "More" },
            months: [
              "Jan",
              "Feb",
              "Mar",
              "Apr",
              "May",
              "Jun",
              "Jul",
              "Aug",
              "Sep",
              "Oct",
              "Nov",
              "Dec",
            ],
            totalCount: `${total} completion${total === 1 ? '' : 's'} in {{year}}`,
            weekDays: ["Sun", "Mon", "Tue", "Wed", "Thu", "Fri", "Sat"],
          }}
          theme={{
            dark: ["#27272a", "#312e81", "#4338ca", "#6366f1", "#818cf8"],
            light: ["#27272a", "#312e81", "#4338ca", "#6366f1", "#818cf8"],
          }}
          tooltipDataAttrs={(val) => {
            const date = new Date(val.date);
            const formattedDate = date.toLocaleDateString('en-US', {
              weekday: 'short',
              year: 'numeric',
              month: 'short',
              day: 'numeric'
            });
            const tooltipText = val.count > 0 
              ? `${formattedDate}: ${val.count} habit${val.count === 1 ? "" : "s"} completed\nClick to see details`
              : `${formattedDate}: No completions\nClick to view`;
            return {
              "data-tip": tooltipText,
              "title": tooltipText,
            };
          }}
          showWeekdayLabels={false}
          onClick={handleHeatFieldClick}
        />
      </div>

      {/* Habit Details Modal */}
      {selectedDate && (
        <div className="fixed inset-0 bg-black/80 backdrop-blur-md flex items-center justify-center z-50 p-4">
          <div className="bg-gradient-to-br from-slate-800/95 via-slate-800/90 to-slate-800/95 backdrop-blur-xl rounded-2xl shadow-2xl border border-slate-700/50 w-full max-w-md max-h-[80vh] overflow-hidden">
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
              {loading ? (
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
      )}
    </section>
  );
}
