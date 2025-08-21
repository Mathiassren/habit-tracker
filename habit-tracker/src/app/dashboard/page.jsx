"use client";

import { useAuth } from "@/hooks/useAuth";
import { useRouter } from "next/navigation";
import { useEffect } from "react";
import Link from "next/link";
import {
  HomeIcon,
  ChartBarIcon,
  DocumentChartBarIcon,
  AdjustmentsHorizontalIcon,
} from "@heroicons/react/24/outline";
import Lottie from "lottie-react";
import dashboardAnim from "../../../public/animations/Space.json"; // <-- put JSON here

export default function Dashboard() {
  const { user, loading } = useAuth();
  const router = useRouter();

  // Protect route
  useEffect(() => {
    if (!loading && !user) {
      router.push("/");
    }
  }, [user, loading, router]);

  if (loading) return null;
  if (!user) return null;

  return (
    <div className="relative min-h-screen flex flex-col items-center justify-start bg-gray-950 overflow-hidden">
      {/* Subtle animated background */}
      <div className="absolute inset-0 opacity-40 w-100 pointer-events-none">
        <Lottie animationData={dashboardAnim} loop autoPlay />
      </div>

      {/* Profile */}
      <div className="relative z-10 flex flex-col items-center mt-16">
        <img
          src={user.user_metadata?.avatar_url || "/default-avatar.png"}
          alt={user.user_metadata?.full_name || "User Avatar"}
          className="w-24 h-24 rounded-full shadow-lg border-2 border-purple-500 object-cover"
          referrerPolicy="no-referrer"
        />
        <h2 className="mt-6 text-3xl font-bold text-white drop-shadow">
          Welcome, {user.user_metadata?.full_name || "friend"}!
        </h2>
        <p className="text-gray-300 mt-1">{user.email}</p>
      </div>

      {/* Navigation Grid */}
      <section className="relative z-10 grid grid-cols-2 gap-6 mt-14">
        <NavCard
          href="/"
          icon={<HomeIcon className="w-12 h-12 text-purple-400" />}
          label="Home"
        />
        <NavCard
          href="/heatmap"
          icon={<ChartBarIcon className="w-12 h-12 text-pink-400" />}
          label="Dashboard"
        />
        <NavCard
          href="/dailylog"
          icon={<DocumentChartBarIcon className="w-12 h-12 text-emerald-400" />}
          label="Daily Log"
        />
        <NavCard
          href="/preferences"
          icon={
            <AdjustmentsHorizontalIcon className="w-12 h-12 text-blue-400" />
          }
          label="Preferences"
        />
      </section>
    </div>
  );
}

/* Reusable tile */
function NavCard({ href, icon, label }) {
  return (
    <Link href={href} className="group">
      <div className="bg-gray-800/70 backdrop-blur-md w-40 h-40 rounded-2xl flex flex-col items-center justify-center shadow-lg transition-transform duration-300 group-hover:scale-105 group-hover:bg-gray-700">
        {icon}
        <span className="text-white font-medium mt-2">{label}</span>
      </div>
    </Link>
  );
}
