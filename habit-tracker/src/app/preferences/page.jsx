"use client";

import { useAuth } from "@/hooks/useAuth";
import { useRouter } from "next/navigation";
import { useEffect, useState } from "react";
import AppTab from "@/app/components/AppTab";
import ManageTab from "@/app/components/ManageTab";
import PreferencesTab from "@/app/components/PreferencesTab";
import TabNavigation from "@/app/components/TabNavigation";
import { AdjustmentsHorizontalIcon } from "@heroicons/react/24/outline";

export default function Dashboard() {
  const { user, setUser, loading, logout } = useAuth();
  const router = useRouter();
  const [activeTab, setActiveTab] = useState("preferences");

  const createdAt = user?.created_at 
    ? new Date(user.created_at).toLocaleDateString("en-US", {
        year: "numeric",
        month: "long",
        day: "numeric",
      })
    : "Unknown";

  return (
    <div className="min-h-screen bg-gradient-to-br from-slate-950 via-indigo-950/20 to-slate-950">
      {/* Background Pattern */}
      <div className="absolute inset-0 bg-[radial-gradient(circle_at_1px_1px,_rgba(99,102,241,0.15)_1px,_transparent_0)] bg-[size:24px_24px] opacity-40"></div>
      <div className="absolute inset-0 bg-gradient-to-br from-indigo-900/10 via-transparent to-cyan-900/10"></div>

      <div className="relative z-10 max-w-5xl mx-auto px-4 sm:px-6 py-6 sm:py-12">
        {/* Header Section */}
        <div className="mb-6 sm:mb-8">
          <div className="flex flex-col sm:flex-row items-start sm:items-center gap-3 sm:gap-3 mb-4 sm:mb-6">
            <div className="w-10 h-10 sm:w-12 sm:h-12 rounded-xl bg-gradient-to-br from-indigo-500 via-blue-500 to-cyan-500 flex items-center justify-center shadow-lg shadow-indigo-500/50 flex-shrink-0">
              <AdjustmentsHorizontalIcon className="w-5 h-5 sm:w-6 sm:h-6 text-white" />
            </div>
            <div className="flex-1 min-w-0">
              <h1 className="text-2xl sm:text-3xl md:text-4xl font-bold text-gradient-vibrant leading-tight">Preferences</h1>
              <p className="text-slate-400 text-sm sm:text-base md:text-lg mt-1">
                Manage your account settings and preferences
              </p>
            </div>
          </div>

          <TabNavigation activeTab={activeTab} setActiveTab={setActiveTab} />
        </div>

        {/* Tab Content */}
        <div className="mt-8">
          {activeTab === "app" && <AppTab />}
          {activeTab === "manage" && <ManageTab user={user} setUser={setUser} />}
          {activeTab === "preferences" && (
            <PreferencesTab user={user} createdAt={createdAt} setUser={setUser} />
          )}
        </div>
      </div>
    </div>
  );
}
