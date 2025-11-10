"use client";

import { Component } from "react";
import { AlertTriangle, RefreshCw, Home } from "lucide-react";
import Link from "next/link";

export class ErrorBoundary extends Component {
  constructor(props) {
    super(props);
    this.state = { hasError: false, error: null };
  }

  static getDerivedStateFromError(error) {
    return { hasError: true, error };
  }

  componentDidCatch(error, errorInfo) {
    console.error("ErrorBoundary caught an error:", error, errorInfo);
    // Here you could log to an error reporting service like Sentry
  }

  handleReset = () => {
    this.setState({ hasError: false, error: null });
    window.location.reload();
  };

  render() {
    if (this.state.hasError) {
      return (
        <div className="min-h-screen bg-gradient-to-br from-slate-950 via-indigo-950/20 to-slate-950 flex items-center justify-center px-6">
          {/* Background Pattern */}
          <div className="absolute inset-0 bg-[radial-gradient(circle_at_1px_1px,_rgba(99,102,241,0.15)_1px,_transparent_0)] bg-[size:24px_24px] opacity-40"></div>
          <div className="absolute inset-0 bg-gradient-to-br from-indigo-900/10 via-transparent to-cyan-900/10"></div>

          <div className="relative z-10 max-w-2xl mx-auto text-center">
            {/* Error Icon */}
            <div className="flex justify-center mb-6">
              <div className="w-20 h-20 rounded-2xl bg-red-500/20 flex items-center justify-center border border-red-500/30">
                <AlertTriangle className="w-10 h-10 text-red-400" />
              </div>
            </div>

            {/* Error Message */}
            <h1 className="text-3xl md:text-4xl font-bold text-white mb-4">
              Something went wrong
            </h1>
            <p className="text-lg text-slate-400 mb-8">
              We encountered an unexpected error. Don't worry, your data is safe.
            </p>

            {/* Error Details (only in development) */}
            {process.env.NODE_ENV === "development" && this.state.error && (
              <div className="bg-red-500/10 border border-red-500/30 rounded-lg p-4 mb-6 text-left">
                <p className="text-red-300 text-sm font-mono break-all">
                  {this.state.error.toString()}
                </p>
              </div>
            )}

            {/* Actions */}
            <div className="flex flex-col sm:flex-row items-center justify-center gap-4">
              <button
                onClick={this.handleReset}
                className="group flex items-center gap-2 px-6 py-3 bg-gradient-to-r from-indigo-600 via-blue-600 to-cyan-600 hover:from-indigo-500 hover:via-blue-500 hover:to-cyan-500 rounded-xl text-white font-medium shadow-lg shadow-indigo-500/30 hover:shadow-xl transition-all duration-300 focus:outline-none focus:ring-2 focus:ring-indigo-500 focus:ring-offset-2 focus:ring-offset-slate-950"
                aria-label="Reload page to try again"
              >
                <RefreshCw className="w-5 h-5 group-hover:rotate-180 transition-transform" aria-hidden="true" />
                <span>Try Again</span>
              </button>

              <Link
                href="/dashboard"
                className="group flex items-center gap-2 px-6 py-3 bg-gradient-to-br from-slate-800/40 to-slate-800/30 backdrop-blur-xl border border-slate-700/50 rounded-xl text-white hover:border-indigo-500/50 transition-all duration-300 focus:outline-none focus:ring-2 focus:ring-indigo-500 focus:ring-offset-2 focus:ring-offset-slate-950"
                aria-label="Go to dashboard"
              >
                <Home className="w-5 h-5" aria-hidden="true" />
                <span>Go to Dashboard</span>
              </Link>
            </div>
          </div>
        </div>
      );
    }

    return this.props.children;
  }
}

