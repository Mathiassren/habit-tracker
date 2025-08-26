"use client";

import { useAuth } from "@/hooks/useAuth";
import { useRouter } from "next/navigation";
import { useEffect, useState } from "react";
import AppTab from "@/app/components/AppTab";
import ManageTab from "@/app/components/ManageTab";
import PreferencesTab from "@/app/components/PreferencesTab";
import TabNavigation from "@/app/components/TabNavigation";
import LogoutButton from "@/app/components/LogoutButton";
import { Mosaic } from "react-loading-indicators";
import BottomNav from "@/app/components/bottomNav";

export default function Dashboard() {
  const { user, setUser, loading, logout } = useAuth();
  const router = useRouter();
  const [activeTab, setActiveTab] = useState("preferences");

  const createdAt = new Date(user?.created_at).toLocaleDateString("da-DK", {
    year: "numeric",
    month: "long",
    day: "numeric",
  });

  return (
    <div className="p-8 desktop-container">
      <h1 className="font-play font-bold text-xl">Preferences</h1>
      <h2 className="text-lg font-play text-gray-300">
        Welcome, {user?.user_metadata?.full_name?.split(" ")[0] || "Guest"}!
      </h2>

      <TabNavigation activeTab={activeTab} setActiveTab={setActiveTab} />

      <div className="mt-4">
        {activeTab === "app" && <AppTab />}
        {activeTab === "manage" && <ManageTab user={user} setUser={setUser} />}
        {activeTab === "preferences" && (
          <PreferencesTab user={user} createdAt={createdAt} />
        )}
      </div>
    </div>
  );
}
