import { useState, useEffect } from "react";
import { supabase } from "@/services/supabase";
import { CheckCircle2, Calendar, Mail } from "lucide-react";

const PreferencesTab = ({ user, createdAt, setUser = () => {} }) => {
  const [fullName, setFullName] = useState(
    user?.user_metadata?.full_name || ""
  );
  const [loading, setLoading] = useState(false);
  const [message, setMessage] = useState("");

  // Sync fullName when user changes
  useEffect(() => {
    setFullName(user?.user_metadata?.full_name || "");
  }, [user]);

  const updateName = async () => {
    if (!fullName.trim()) {
      setMessage("Please enter a name");
      setTimeout(() => setMessage(""), 3000);
      return;
    }
    
    setLoading(true);
    setMessage("");

    try {
      const { error: authError } = await supabase.auth.updateUser({
        data: { full_name: fullName.trim() },
      });

      if (authError) {
        throw authError;
      }

      const { error: profileError } = await supabase
        .from("profiles")
        .update({ full_name: fullName.trim(), updated_at: new Date().toISOString() })
        .eq("id", user.id);

      if (profileError) {
        throw profileError;
      }

      const { data: { user: updatedUser } } = await supabase.auth.getUser();
      if (updatedUser) {
        setUser(updatedUser);
        setMessage("Name updated successfully!");
        setTimeout(() => setMessage(""), 3000);
      }
    } catch (error) {
      console.error("Failed to update name:", error);
      setMessage(error.message || "Failed to update name. Please try again.");
      setTimeout(() => setMessage(""), 5000);
    } finally {
      setLoading(false);
    }
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
                <div className="w-12 h-12 rounded-xl bg-gradient-to-br from-indigo-600/30 to-purple-600/30 flex items-center justify-center border border-indigo-500/40 shadow-lg shadow-indigo-500/20">
                  <CheckCircle2 className="w-6 h-6 text-indigo-400" />
                </div>
                <div>
                  <p className="text-xs text-slate-400 uppercase tracking-wider mb-1">Status</p>
                  <p className="text-lg font-semibold text-white">
                    {user ? "Authenticated" : "Not Authenticated"}
                  </p>
                </div>
              </div>
              <span className="px-4 py-2 rounded-full text-xs font-medium bg-gradient-to-r from-indigo-600/30 to-purple-600/30 text-cyan-300 border border-indigo-500/40 shadow-sm">
                {user ? "Active" : "Inactive"}
              </span>
            </div>
          </div>

          {/* Created Date Card */}
          <div className="bg-slate-700/20 rounded-xl border border-slate-600/30 p-4">
            <div className="flex items-center gap-3">
              <div className="w-10 h-10 rounded-lg bg-blue-500/20 flex items-center justify-center border border-blue-500/30">
                <Calendar className="w-5 h-5 text-blue-400" />
              </div>
              <div>
                <p className="text-xs text-slate-400 uppercase tracking-wider mb-1">Account Created</p>
                <p className="text-lg font-semibold text-white">{createdAt}</p>
              </div>
            </div>
          </div>

          {/* Name Card */}
          <div className="bg-slate-700/20 rounded-xl border border-slate-600/30 p-4">
            <label htmlFor="full_name" className="block text-sm text-slate-400 uppercase tracking-wider mb-3">
              Display Name
            </label>
            {message && (
              <div className={`mb-3 p-3 rounded-xl text-sm ${
                message.includes("successfully") 
                  ? "bg-emerald-500/20 border border-emerald-500/30 text-emerald-400" 
                  : "bg-red-500/20 border border-red-500/30 text-red-400"
              }`}>
                {message}
              </div>
            )}
            <div className="flex flex-col sm:flex-row items-stretch sm:items-center gap-3">
              <input
                id="full_name"
                type="text"
                value={fullName}
                onChange={(e) => setFullName(e.target.value)}
                onKeyDown={(e) => {
                  if (e.key === "Enter" && fullName.trim() && !loading) {
                    updateName();
                  }
                }}
                autoComplete="name"
                className="flex-1 bg-slate-800/50 border border-slate-600/30 text-white rounded-xl px-4 py-3 focus:outline-none focus:ring-2 focus:ring-indigo-500/50 focus:border-indigo-500 transition-all"
                placeholder="Enter your name"
              />
              <button
                type="button"
                onClick={updateName}
                disabled={loading || !fullName.trim()}
                className="shrink-0 rounded-xl bg-gradient-to-r from-indigo-600 via-blue-600 to-cyan-600 hover:from-indigo-500 hover:via-blue-500 hover:to-cyan-500 px-6 py-3 text-sm font-medium text-white transition-all shadow-lg shadow-indigo-500/30 disabled:opacity-50 disabled:cursor-not-allowed disabled:hover:from-indigo-600 disabled:hover:via-blue-600 disabled:hover:to-cyan-600 whitespace-nowrap"
              >
                {loading ? (
                  <span className="flex items-center justify-center gap-2">
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
                <Mail className="w-5 h-5 text-cyan-400" />
              </div>
              <div className="flex-1 min-w-0">
                <p className="text-xs text-slate-400 uppercase tracking-wider mb-1">Email Address</p>
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
