"use client";

import dynamic from "next/dynamic";
import { useMemo } from "react";

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
}) {
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
      <h3 className="font-play font-bold text-xl mb-2">{title}</h3>
      <ActivityCalendar
        data={data} // Jan 1 → today
        startDate={startISO}
        endDate={endISO}
        weekStart={weekStart}
        blockSize={11}
        blockMargin={2}
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
          dark: ["#27272a", "#4c1d95", "#5b21b6", "#6d28d9", "#a78bfa"],
          light: ["#27272a", "#4c1d95", "#5b21b6", "#6d28d9", "#a78bfa"],
        }}
        tooltipDataAttrs={(val) => ({
          "data-tip": `${val.date}: ${val.count} completion${
            val.count === 1 ? "" : "s"
          }`,
        })}
        showWeekdayLabels={false}
      />
    </section>
  );
}
