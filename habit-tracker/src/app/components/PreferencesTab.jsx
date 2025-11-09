import { useState } from "react";
import { supabase } from "@/services/supabase";

const PreferencesTab = ({ user, createdAt, setUser = () => {} }) => {
  const [fullName, setFullName] = useState(
    user?.user_metadata?.full_name || ""
  );
  const [loading, setLoading] = useState(false);

  const updateName = async () => {
    if (!fullName.trim()) return;
    setLoading(true);

    const { error: authError } = await supabase.auth.updateUser({
      data: { full_name: fullName },
    });

    const { error: profileError } = await supabase
      .from("profiles")
      .update({ full_name: fullName, updated_at: new Date() })
      .eq("id", user.id);

    if (authError || profileError) {
      console.error("Failed to update name:", authError || profileError);
      setLoading(false);
      return;
    }

    const { data: updatedUser } = await supabase.auth.getUser();
    setUser(updatedUser?.user);
    setLoading(false);
  };

  return (
    <div className="space-y-6">
      <div className="bg-gradient-to-br from-slate-800/40 via-slate-800/30 to-slate-800/40 backdrop-blur-xl rounded-2xl border border-slate-700/50 shadow-2xl shadow-indigo-900/20 p-8">
        <h2 className="text-2xl font-bold text-white mb-6 flex items-center gap-2">
          <div className="w-1 h-6 bg-gradient-to-b from-indigo-500 to-cyan-500 rounded-full"></div>
          Account Details
        </h2>

        <div className="space-y-6">
          {/* Status Card */}
          <div className="bg-slate-700/20 rounded-xl border border-slate-600/30 p-4">
            <div className="flex items-center justify-between">
              <div className="flex items-center gap-3">
                <div className="w-10 h-10 rounded-lg bg-indigo-500/20 flex items-center justify-center border border-indigo-500/30">
                  <span className="text-indigo-400 text-xl">✓</span>
                </div>
                <div>
                  <p className="text-sm text-slate-400 uppercase tracking-wider mb-1">Status</p>
                  <p className="text-lg font-semibold text-white">
                    {user ? "Authenticated" : "Not Authenticated"}
                  </p>
                </div>
              </div>
              <span className="text-xs bg-indigo-500/20 px-3 py-1.5 rounded-full text-cyan-400 border border-indigo-500/30">
                {user ? "Active" : "Inactive"}
              </span>
            </div>
          </div>

          {/* Created Date Card */}
          <div className="bg-slate-700/20 rounded-xl border border-slate-600/30 p-4">
            <div className="flex items-center gap-3">
              <div className="w-10 h-10 rounded-lg bg-blue-500/20 flex items-center justify-center border border-blue-500/30">
                <span className="text-blue-400 text-xl">📅</span>
              </div>
              <div>
                <p className="text-sm text-slate-400 uppercase tracking-wider mb-1">Account Created</p>
                <p className="text-lg font-semibold text-white">{createdAt}</p>
              </div>
            </div>
          </div>

          {/* Name Card */}
          <div className="bg-slate-700/20 rounded-xl border border-slate-600/30 p-4">
            <label htmlFor="full_name" className="block text-sm text-slate-400 uppercase tracking-wider mb-3">
              Display Name
            </label>
            <div className="flex items-center gap-3">
              <input
                id="full_name"
                type="text"
                value={fullName}
                onChange={(e) => setFullName(e.target.value)}
                autoComplete="name"
                className="flex-1 bg-slate-800/50 border border-slate-600/30 text-white rounded-xl px-4 py-3 focus:outline-none focus:ring-2 focus:ring-indigo-500/50 focus:border-indigo-500 transition-all"
                placeholder="Enter your name"
              />
              <button
                type="button"
                onClick={updateName}
                disabled={loading || !fullName.trim()}
                className="shrink-0 rounded-xl bg-gradient-to-r from-indigo-600 via-blue-600 to-cyan-600 hover:from-indigo-500 hover:via-blue-500 hover:to-cyan-500 px-6 py-3 text-sm font-medium text-white transition-all shadow-lg shadow-indigo-500/30 disabled:opacity-50 disabled:cursor-not-allowed disabled:hover:from-indigo-600 disabled:hover:via-blue-600 disabled:hover:to-cyan-600"
              >
                {loading ? (
                  <span className="flex items-center gap-2">
                    <span className="w-4 h-4 border-2 border-white/30 border-t-white rounded-full animate-spin"></span>
                    Saving...
                  </span>
                ) : (
                  "Save"
                )}
              </button>
            </div>
          </div>

          {/* Email Card */}
          <div className="bg-slate-700/20 rounded-xl border border-slate-600/30 p-4">
            <div className="flex items-center gap-3">
              <div className="w-10 h-10 rounded-lg bg-cyan-500/20 flex items-center justify-center border border-cyan-500/30">
                <span className="text-cyan-400 text-xl">✉</span>
              </div>
              <div className="flex-1 min-w-0">
                <p className="text-sm text-slate-400 uppercase tracking-wider mb-1">Email Address</p>
                <p className="text-lg font-semibold text-cyan-400 break-words">
                  {user?.email || "Unknown"}
                </p>
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};

export default PreferencesTab;
