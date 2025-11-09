"use client";

import dynamic from "next/dynamic";
import { useMemo, useState } from "react";
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

  // Fetch habit details for a specific date
  const fetchHabitDetails = async (date) => {
    if (!userId) return;
    
    setLoading(true);
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
      setLoading(false);
    }
  };

  // Handle heat field click
  const handleHeatFieldClick = async (value) => {
    if (value && value.date) {
      setSelectedDate(value.date);
      await fetchHabitDetails(value.date);
    }
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
    const end = new Date(year, 11, 31);

    // Build continuous range Jan 1 -> today (inclusive)
    const days = [];
    for (let d = new Date(start); d <= end; d.setDate(d.getDate() + 1)) {
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

    const values =
      days.length > 0
        ? days.map((iso) => {
            const c = Number(byDate?.[iso] ?? 0);
            return { date: iso, count: c, level: levelFor(c) };
          })
        : [{ date: toISO(today), count: 0, level: 0 }];

    const sum = values.reduce((a, v) => a + (v.count || 0), 0);

    return {
      startISO: toISO(start),
      endISO: toISO(end),
      data: values,
      total: sum,
    };
  }, [byDate]);

  return (
    <section className="select-none">
      <div className="flex items-center justify-between mb-6">
        <h3 className="text-2xl font-bold text-white">{title}</h3>
        <div className="text-sm text-slate-400">
          Click any square to view details
        </div>
      </div>
      <ActivityCalendar
        data={data} // Jan 1 → today
        startDate={startISO}
        endDate={endISO}
        weekStart={weekStart}
        blockSize={14}
        blockMargin={3}
        fontSize={12}
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
          totalCount: `${total} completions in {{year}}`,
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
          const tooltipText = `${formattedDate}: ${val.count} completion${
            val.count === 1 ? "" : "s"
          }`;
          return {
            "data-tip": tooltipText,
            "title": tooltipText,
          };
        }}
        showWeekdayLabels={false}
        onClick={handleHeatFieldClick}
      />

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
                  {habitDetails.map((completion, index) => (
                    <div
                      key={index}
                      className="flex items-center gap-3 p-4 bg-slate-700/30 rounded-xl border border-slate-600/30 hover:border-indigo-500/30 transition-colors"
                    >
                      <div className="w-10 h-10 rounded-lg bg-emerald-500/20 flex items-center justify-center border border-emerald-500/30">
                        <CheckCircle className="w-5 h-5 text-emerald-400" />
                      </div>
                      <div className="flex-1 min-w-0">
                        <h4 className="text-white font-semibold mb-1">
                          {completion.habits?.name || 'Unknown Habit'}
                        </h4>
                        <p className="text-slate-400 text-sm">
                          Completed at {new Date(completion.completed_at).toLocaleTimeString('en-US', {
                            hour: '2-digit',
                            minute: '2-digit'
                          })}
                        </p>
                        {completion.habits?.note && (
                          <p className="text-slate-500 text-xs mt-2 italic border-l-2 border-indigo-500/30 pl-2">
                            "{completion.habits.note}"
                          </p>
                        )}
                      </div>
                      {completion.habits?.color && (
                        <div
                          className="w-5 h-5 rounded-full border-2 border-slate-600 shadow-sm flex-shrink-0"
                          style={{ backgroundColor: completion.habits.color }}
                        />
                      )}
                    </div>
                  ))}
                </div>
              )}
            </div>
          </div>
        </div>
      )}
    </section>
  );
}
