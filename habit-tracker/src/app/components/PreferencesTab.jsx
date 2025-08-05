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
      <h2 className="font-bold font-play mb-4">Account Details</h2>
      <div className="grid grid-cols-[100px_1fr] gap-y-2 text-sm text-gray-300">
        <span className="font-play">Status</span>
        <span>
          <span className="text-xs bg-[#072424] px-2 rounded-full p-1 text-[#09D8B9]">
            {user ? "Authenticated" : "Not Authenticated"}
          </span>
        </span>

        <span className="font-play">Created on</span>
        <span>{createdAt}</span>

        <span className="font-play">Name</span>
        <div className="flex-block items-center">
          <input
            type="text"
            value={fullName}
            onChange={(e) => setFullName(e.target.value)}
            className="bg-gray-800 text-white px-3 py-1 rounded-md outline-none border border-gray-700"
          />
          <button
            onClick={updateName}
            disabled={loading}
            className="bg-[#4F46E5] mt-4 hover:bg-purple-600 text-white px-3 py-1 rounded-md text-sm"
          >
            {loading ? "Updating..." : "Save"}
          </button>
        </div>
        <span className="font-play">Email</span>
        <span className="text-blue-400">{user?.email || "Unknown"}</span>
      </div>
    </div>
  );
};

export default PreferencesTab;
