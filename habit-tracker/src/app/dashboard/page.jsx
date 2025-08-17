"use client"; // Forces client-side execution

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

export default function Dashboard() {
  const { user, loading } = useAuth();
  const router = useRouter();

  useEffect(() => {
    if (!loading && !user) {
      router.push("/");
    }
  }, [user, loading]);

  if (loading) return;
  if (!user) return null;

  return (
    <div className="p-8">
      <div className="flex items-center justify-center">
        <img
          src={user.user_metadata?.avatar_url || null} // Prevent null error
          alt="User Avatar"
          className="w-20 h-20 mb-10 rounded-full"
        />
      </div>
      <h2 className="text-2xl font-bold">
        Welcome, {user.user_metadata.full_name}!
      </h2>

      <img alt="" />
      <p className="mt-2">Email: {user.email}</p>
      <section className="grid grid-cols-2 gap-4 mt-4">
        <Link href="/">
          <div className="bg-gray-800 w-36 h-36 rounded-lg items-center flex flex-col justify-center">
            <HomeIcon className="w-10 h-10 mb-1 text-gray-400" />
            Home
          </div>
        </Link>
        <Link href="/dashboard">
          <div className="bg-gray-800 w-36 h-36 rounded-lg items-center flex flex-col justify-center">
            <ChartBarIcon className="w-10 h-10 mb-1 text-gray-400" />
            Dashboard
          </div>
        </Link>
        <Link href="/dailylog">
          <div className="bg-gray-800 w-36 h-36 rounded-lg items-center flex flex-col justify-center">
            <DocumentChartBarIcon className="w-10 h-10 mb-1 text-gray-400" />
            Daily Log
          </div>
        </Link>
        <Link href="/preferences">
          <div className="bg-gray-800 w-36 h-36 rounded-lg items-center flex flex-col justify-center">
            <AdjustmentsHorizontalIcon className="w-10 h-10 mb-1 text-gray-400" />
            Preferences
          </div>
        </Link>
      </section>
    </div>
  );
}
