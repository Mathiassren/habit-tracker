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
    <div>
      <h2 className="font-bold font-play mb-3">Account Details</h2>

      <div className="flex flex-col gap-3 text-sm text-gray-300">
        {/* ROW: Status */}
        <div className="flex flex-wrap items-center gap-2">
          <span className="font-play md:text-lg basis-[100px] shrink-0">
            Status
          </span>
          <span className="text-xs bg-[#072424] px-2 py-1 rounded-full text-[#09D8B9]">
            {user ? "Authenticated" : "Not Authenticated"}
          </span>
        </div>

        {/* ROW: Created on */}
        <div className="flex flex-wrap items-center gap-2">
          <span className="font-play md:text-lg basis-[100px] shrink-0">
            Created on
          </span>
          <span className="text-gray-200">{createdAt}</span>
        </div>

        {/* ROW: Name (input + Save inline) */}
        <div className="flex flex-wrap items-center gap-2">
          <label
            htmlFor="full_name"
            className="font-play md:text-lg basis-[100px] shrink-0"
          >
            Name
          </label>

          <input
            id="full_name"
            type="text"
            value={fullName}
            onChange={(e) => setFullName(e.target.value)}
            autoComplete="name"
            className="min-w-0 flex-1 bg-gray-800 border border-gray-700 text-white rounded-lg px-3 py-1.5 focus:outline-none focus:ring-2 focus:ring-indigo-500"
          />

          <button
            type="button"
            onClick={updateName}
            disabled={loading}
            className="shrink-0 rounded-md bg-[#4F46E5] hover:bg-purple-600 px-3 py-1.5 text-sm text-white transition disabled:opacity-60 disabled:cursor-not-allowed"
          >
            {loading ? "Updating..." : "Save"}
          </button>
        </div>

        {/* ROW: Email */}
        <div className="flex flex-wrap items-center gap-2">
          <span className="font-play md:text-lg basis-[100px] shrink-0">
            Email
          </span>
          <span className="text-blue-400 break-words">
            {user?.email || "Unknown"}
          </span>
        </div>
      </div>
    </div>
  );
};

export default PreferencesTab;
