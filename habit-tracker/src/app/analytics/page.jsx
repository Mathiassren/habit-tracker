"use client";

import dynamic from "next/dynamic";

// Render the charts only on the client to avoid hydration mismatches
const HabitAnalytics = dynamic(
  () => import("@/app/components/HabitAnalytics"),
  {
    ssr: false,
    // optional: loading state while the chunk loads
    loading: () => <div className="p-8 text-gray-300">Loading analytics…</div>,
  }
);

export default function AnalyticsPage() {
  return (
    <div className="p-8">
      <HabitAnalytics />
    </div>
  );
}
