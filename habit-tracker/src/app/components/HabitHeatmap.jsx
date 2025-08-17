"use client";

import dynamic from "next/dynamic";
import { useMemo } from "react";

const ActivityCalendar = dynamic(() => import("react-activity-calendar"), {
  ssr: false,
});

function toISODate(d) {
  const y = d.getFullYear();
  const m = String(d.getMonth() + 1).padStart(2, "0");
  const day = String(d.getDate()).padStart(2, "0");
  return `${y}-${m}-${day}`;
}

function buildRange(start, end) {
  const out = [];
  const d = new Date(start);
  while (d <= end) {
    out.push({ date: toISODate(d), count: 0, level: 0 });
    d.setDate(d.getDate() + 1);
  }
  return out;
}

export default function HabitHeatmap({ byDate = {}, title = "Progress Grid" }) {
  // last 12 months range
  const { start, end } = useMemo(() => {
    const e = new Date();
    const s = new Date(e);
    s.setFullYear(e.getFullYear() - 1);
    return { start: s, end: e };
  }, []);

  // Always non-empty: prefill range with zeros, then merge counts
  const data = useMemo(() => {
    const base = buildRange(start, end);
    return base.map((d) => {
      const cnt = byDate?.[d.date] ?? 0;
      return { date: d.date, count: cnt, level: Math.min(cnt, 4) };
    });
  }, [byDate, start, end]);

  const total = useMemo(() => data.reduce((a, d) => a + d.count, 0), [data]);

  return (
    <section className="select-none">
      <h3 className="font-play font-bold text-xl mb-2">{title}</h3>
      <ActivityCalendar
        data={data}
        blockSize={12}
        blockMargin={3}
        weekStart={1}
        labels={{
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
          legend: { less: "Less", more: "More" },
        }}
        theme={{
          light: ["#111827", "#4c1d95", "#5b21b6", "#6d28d9", "#8b5cf6"],
          dark: ["#111827", "#4c1d95", "#5b21b6", "#6d28d9", "#8b5cf6"],
        }}
        tooltipDataAttrs={(val) => ({
          "data-tip": `${val.date}: ${val.count} completion${
            val.count === 1 ? "" : "s"
          }`,
        })}
      />
    </section>
  );
}
