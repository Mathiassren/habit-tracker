"use client";

import { useEffect, useMemo, useState, useCallback } from "react";
import { supabase } from "@/services/supabase";
import dayjs from "dayjs";
import isoWeek from "dayjs/plugin/isoWeek";
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

function MiniMonth({ month, highlighted = new Set(), onChangeMonth }) {
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
    <div className="w-full max-w-xs">
      <div className="flex items-center justify-between mb-2 text-sm text-gray-300">
        <button
          className="px-2 py-1 rounded hover:bg-gray-800"
          onClick={() => onChangeMonth(month.subtract(1, "month"))}
        >
          &lt;
        </button>
        <div className="font-semibold">{month.format("MMMM YYYY")}</div>
        <button
          className="px-2 py-1 rounded hover:bg-gray-800"
          onClick={() => onChangeMonth(month.add(1, "month"))}
        >
          &gt;
        </button>
      </div>

      <div className="grid grid-cols-7 text-xs text-gray-500 mb-1">
        {["Su", "Mo", "Tu", "We", "Th", "Fr", "Sa"].map((d) => (
          <div key={d} className="text-center py-1">
            {d}
          </div>
        ))}
      </div>

      <div className="grid grid-cols-7 gap-1">
        {rows.flat().map((c) => (
          <div
            key={c.iso}
            className={`relative h-9 rounded-md text-sm ${
              c.inMonth ? "text-gray-200" : "text-gray-600"
            } flex items-center justify-center`} // center contents
          >
            <div className="relative inline-flex flex-col items-center leading-none">
              <span className="leading-none">{c.day}</span>
              {c.hit && (
                <span
                  className="absolute -bottom-3 left-2.5 -translate-x-1/2 w-2 h-2 rounded-full"
                  style={{ backgroundColor: "#9333EA" }}
                />
              )}
            </div>
          </div>
        ))}
      </div>
    </div>
  );
}

/* ------------------------------ Main Component ---------------------------- */

export default function HabitAnalytics() {
  // Gate rendering to client to avoid SSR time/locale/random differences
  const [mounted, setMounted] = useState(false);
  useEffect(() => setMounted(true), []);

  const [month, setMonth] = useState(dayjs());
  const [loading, setLoading] = useState(true);
  const [byDay, setByDay] = useState({}); // { 'YYYY-MM-DD': count }
  const [year, setYear] = useState(new Date().getFullYear());

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
        setLoading(false);
        return;
      }

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

  return (
    <section className="w-full text-gray-100">
      <div className="grid grid-cols-1 lg:grid-cols-[280px,1fr] gap-8">
        {/* Left: calendar */}
        <div className="space-y-6">
          <div className="flex items-center pt-10 gap-2">
            <span
              className="inline-block w-3 h-3 rounded-sm"
              style={{ backgroundColor: "#C084FC" }}
            />
            <h2 className="font-play text-3xl font-extrabold tracking-wide">
              Analytics
            </h2>
          </div>

          <div>
            <h3 className="text-sm font-mono text-gray-300 mb-2">
              Selected time frame
            </h3>
            <MiniMonth
              month={month}
              highlighted={monthHighlightSet}
              onChangeMonth={setMonth}
            />
          </div>
        </div>

        {/* Right: cards */}
        <div className="space-y-6">
          <h3 className="font-mono text-lg text-gray-300">Analytics</h3>

          <div className="grid md:grid-cols-3 gap-5">
            {/* Current streak */}
            <div className="rounded-2xl bg-[#0b0b0f] border border-gray-800 p-5">
              <div className="text-4xl font-extrabold">
                {streaks.current}
                <span className="text-sm font-normal ml-1">Days</span>
              </div>
              <div className="text-sm text-gray-400 mt-1">Current Streak</div>
            </div>

            {/* Longest streak */}
            <div className="rounded-2xl bg-[#0b0b0f] border border-gray-800 p-5">
              <div className="text-4xl font-extrabold">
                {streaks.longest}
                <span className="text-sm font-normal ml-1">Days</span>
              </div>
              <div className="text-sm text-gray-400 mt-1">Longest Streak</div>
            </div>

            {/* Completed in YEAR + sparkline */}
            <div className="rounded-2xl bg-[#0b0b0f] border border-gray-800 p-5">
              <div className="text-4xl font-extrabold">
                {yearCompletedDays}
                <span className="text-sm font-normal ml-1">Days</span>
              </div>
              <div className="text-sm text-gray-400 mt-1">
                Completed in {year}
              </div>
              <div className="mt-3">
                <TinyArea data={yearSpark} />
              </div>
            </div>
          </div>

          <div className="grid md:grid-cols-3 gap-5">
            {/* Monthly consistency donut */}
            <div className="rounded-2xl bg-[#0b0b0f] border border-gray-800 p-5 flex items-center gap-4">
              <svg width="54" height="54" viewBox="0 0 54 54">
                <circle
                  cx="27"
                  cy="27"
                  r={donutMonth.r}
                  stroke="#A855F7"
                  strokeWidth="6"
                  fill="none"
                />
                <circle
                  cx="27"
                  cy="27"
                  r={donutMonth.r}
                  stroke="#7E22CE"
                  strokeWidth="6"
                  strokeDasharray={`${donutMonth.dash} ${donutMonth.c}`}
                  strokeLinecap="round"
                  fill="none"
                  transform="rotate(-90 27 27)"
                />
              </svg>
              <div>
                <div className="text-3xl font-extrabold">
                  {monthConsistencyPct}
                  <span className="text-sm font-normal">%</span>
                </div>
                <div className="text-sm text-gray-400">Monthly Consistency</div>
              </div>
            </div>

            {/* Completed this week */}
            <div className="rounded-2xl bg-[#0b0b0f] border border-gray-800 p-5">
              <div className="text-4xl font-extrabold">
                {
                  // count days with any completion in current ISO week
                  rangeDays(
                    dayjs().startOf("isoWeek").format("YYYY-MM-DD"),
                    dayjs().endOf("isoWeek").format("YYYY-MM-DD")
                  ).filter((d) => (byDay[d] || 0) > 0).length
                }
                <span className="text-sm font-normal ml-1">Days</span>
              </div>
              <div className="text-sm text-gray-400 mt-1">
                Completed this week
              </div>
            </div>

            {/* Completed in selected month + sparkline */}
            <div className="rounded-2xl bg-[#0b0b0f] border border-gray-800 p-5">
              <div className="text-4xl font-extrabold">
                {monthCompletedDays}
                <span className="text-sm font-normal ml-1">Days</span>
              </div>
              <div className="text-sm text-gray-400 mt-1">
                Completed in {month.format("MMMM")}
              </div>
              <div className="mt-3">
                <TinyArea data={monthSpark} />
              </div>
            </div>
          </div>

          <h3 className="font-mono text-lg text-gray-300">Reports</h3>

          <div className="grid md:grid-cols-3 gap-5">
            <div className="rounded-2xl bg-[#0b0b0f] border border-gray-800 p-5">
              <div className="text-4xl font-extrabold">
                {monthCompletedDays}
                <span className="text-sm font-normal ml-1">Days</span>
              </div>
              <div className="text-sm text-gray-400 mt-1">
                in {month.format("MMMM")}
              </div>
            </div>

            <div className="rounded-2xl bg-[#0b0b0f] border border-gray-800 p-5">
              <div className="text-4xl font-extrabold">
                {yearCompletedDays}
                <span className="text-sm font-normal ml-1">Days</span>
              </div>
              <div className="text-sm text-gray-400 mt-1">in Total</div>
            </div>

            <div className="rounded-2xl bg-[#0b0b0f] border border-gray-800 p-5 flex items-center gap-4">
              <svg width="54" height="54" viewBox="0 0 54 54">
                <circle
                  cx="27"
                  cy="27"
                  r={donutOverall.r}
                  stroke="#A855F7"
                  strokeWidth="6"
                  fill="none"
                />
                <circle
                  cx="27"
                  cy="27"
                  r={donutOverall.r}
                  stroke="#7E22CE "
                  strokeWidth="6"
                  strokeDasharray={`${donutOverall.dash} ${donutOverall.c}`}
                  strokeLinecap="round"
                  fill="none"
                  transform="rotate(-90 27 27)"
                />
              </svg>
              <div>
                <div className="text-3xl font-extrabold">
                  {overallRatePct}
                  <span className="text-sm font-normal">%</span>
                </div>
                <div className="text-sm text-gray-400">Overall Rate</div>
              </div>
            </div>
          </div>
        </div>
      </div>
    </section>
  );
}
