"use client";

import TaskBoard from "../components/TaskBoard";
import { CpuChipIcon } from "@heroicons/react/24/outline";

export default function WorkbenchPage() {
  return (
    <div className="min-h-screen bg-gradient-to-br from-slate-950 via-indigo-950/20 to-slate-950">
      {/* Background Pattern */}
      <div className="absolute inset-0 bg-[radial-gradient(circle_at_1px_1px,_rgba(99,102,241,0.15)_1px,_transparent_0)] bg-[size:24px_24px] opacity-40"></div>
      <div className="absolute inset-0 bg-gradient-to-br from-indigo-900/10 via-transparent to-cyan-900/10"></div>

      <div className="relative z-10 max-w-7xl mx-auto px-6 py-12">
        {/* Header Section */}
        <div className="mb-8">
          <div className="flex items-center gap-3 mb-6">
            <div className="w-12 h-12 rounded-xl bg-gradient-to-br from-indigo-500 via-blue-500 to-cyan-500 flex items-center justify-center shadow-lg shadow-indigo-500/50">
              <CpuChipIcon className="w-6 h-6 text-white" />
            </div>
            <div>
              <h1 className="text-4xl font-bold text-gradient-vibrant">AI Workbench</h1>
              <p className="text-slate-400 text-lg mt-1">
                AI-powered task planning and management
              </p>
            </div>
          </div>
        </div>

        <TaskBoard />
      </div>
    </div>
  );
}
