"use client";

import Link from "next/link";
import { useRouter } from "next/navigation";
import { Home, ArrowLeft, Search } from "lucide-react";

export default function NotFound() {
  const router = useRouter();

  return (
    <div className="min-h-screen bg-gradient-to-br from-slate-950 via-indigo-950/20 to-slate-950 flex items-center justify-center px-6 relative overflow-hidden">
      {/* Background Pattern */}
      <div className="absolute inset-0 bg-[radial-gradient(circle_at_1px_1px,_rgba(99,102,241,0.15)_1px,_transparent_0)] bg-[size:24px_24px] opacity-40"></div>
      <div className="absolute inset-0 bg-gradient-to-br from-indigo-900/10 via-transparent to-cyan-900/10"></div>
      
      {/* Animated gradient orbs */}
      <div className="absolute top-1/4 left-1/4 w-96 h-96 bg-indigo-500/20 rounded-full blur-3xl animate-pulse"></div>
      <div className="absolute bottom-1/4 right-1/4 w-96 h-96 bg-cyan-500/20 rounded-full blur-3xl animate-pulse" style={{ animationDelay: '1s' }}></div>

      <div className="relative z-10 max-w-2xl mx-auto text-center">
        {/* 404 Number */}
        <div className="mb-8">
          <h1 className="text-9xl font-extrabold bg-gradient-to-r from-indigo-400 via-blue-400 to-cyan-400 bg-clip-text text-transparent mb-4">
            404
          </h1>
          <div className="w-32 h-1 bg-gradient-to-r from-indigo-500 via-blue-500 to-cyan-500 mx-auto rounded-full"></div>
        </div>

        {/* Message */}
        <div className="mb-12">
          <h2 className="text-3xl md:text-4xl font-bold text-white mb-4">
            Page Not Found
          </h2>
          <p className="text-lg text-slate-400 mb-2">
            Oops! The page you're looking for doesn't exist.
          </p>
          <p className="text-slate-500">
            It might have been moved, deleted, or you entered the wrong URL.
          </p>
        </div>

        {/* Actions */}
        <div className="flex flex-col sm:flex-row items-center justify-center gap-4">
          <button
            onClick={() => router.back()}
            className="group flex items-center gap-2 px-6 py-3 bg-gradient-to-r from-slate-800/40 to-slate-800/30 backdrop-blur-xl border border-slate-700/50 rounded-xl text-white hover:border-indigo-500/50 transition-all duration-300 shadow-lg hover:shadow-xl"
          >
            <ArrowLeft className="w-5 h-5 group-hover:-translate-x-1 transition-transform" />
            <span className="font-medium">Go Back</span>
          </button>
          
          <Link
            href="/dashboard"
            className="group flex items-center gap-2 px-6 py-3 bg-gradient-to-r from-indigo-600 via-blue-600 to-cyan-600 hover:from-indigo-500 hover:via-blue-500 hover:to-cyan-500 rounded-xl text-white font-medium shadow-lg shadow-indigo-500/30 hover:shadow-xl hover:shadow-indigo-500/50 transition-all duration-300 transform hover:scale-105"
          >
            <Home className="w-5 h-5 group-hover:scale-110 transition-transform" />
            <span>Go to Dashboard</span>
          </Link>
        </div>

        {/* Quick Links */}
        <div className="mt-12 pt-8 border-t border-slate-700/50">
          <p className="text-sm text-slate-400 mb-4">Quick Links:</p>
          <div className="flex flex-wrap items-center justify-center gap-4">
            <Link
              href="/dashboard"
              className="text-sm text-indigo-400 hover:text-indigo-300 transition-colors"
            >
              Dashboard
            </Link>
            <span className="text-slate-600">•</span>
            <Link
              href="/heatmap"
              className="text-sm text-indigo-400 hover:text-indigo-300 transition-colors"
            >
              Analytics
            </Link>
            <span className="text-slate-600">•</span>
            <Link
              href="/dailylog"
              className="text-sm text-indigo-400 hover:text-indigo-300 transition-colors"
            >
              Daily Log
            </Link>
            <span className="text-slate-600">•</span>
            <Link
              href="/journal"
              className="text-sm text-indigo-400 hover:text-indigo-300 transition-colors"
            >
              Journal
            </Link>
            <span className="text-slate-600">•</span>
            <Link
              href="/preferences"
              className="text-sm text-indigo-400 hover:text-indigo-300 transition-colors"
            >
              Preferences
            </Link>
          </div>
        </div>
      </div>
    </div>
  );
}










