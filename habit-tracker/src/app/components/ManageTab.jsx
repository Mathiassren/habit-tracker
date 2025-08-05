import { useState } from "react";
import { supabase } from "@/services/supabase";
import { UploadIcon } from "@radix-ui/react-icons";
import Image from "next/image";

const ManageTab = ({ user, setUser }) => {
  const [fullName, setFullName] = useState(
    user?.user_metadata?.full_name || ""
  );
  const [avatarUrl, setAvatarUrl] = useState(
    user?.user_metadata?.avatar_url || ""
  );
  const [loading, setLoading] = useState(false);
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [newPassword, setNewPassword] = useState("");
  const [confirmPassword, setConfirmPassword] = useState("");
  const [passwordMessage, setPasswordMessage] = useState("");

  // Update Name
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
    setIsModalOpen(false);
  };

  // Upload Avatar
  const uploadAvatar = async (event) => {
    const file = event.target.files[0];
    if (!file) return;

    setLoading(true);
    const fileExt = file.name.split(".").pop();
    const filePath = `avatars/${user.id}.${fileExt}`;

    try {
      const { error: uploadError } = await supabase.storage
        .from("avatars")
        .upload(filePath, file, { upsert: true });

      if (uploadError) throw uploadError;

      const { data: publicUrlData } = supabase.storage
        .from("avatars")
        .getPublicUrl(filePath);

      const publicUrl = publicUrlData.publicUrl;

      await supabase.auth.updateUser({ data: { avatar_url: publicUrl } });

      setAvatarUrl(publicUrl);

      const { data: updatedUserData } = await supabase.auth.getUser();
      setUser(updatedUserData?.user);

      alert("Avatar uploaded successfully!");
    } catch (err) {
      console.error("Error uploading avatar:", err);
    } finally {
      setLoading(false);
    }
  };

  // Change Password
  const handleChangePassword = async () => {
    if (!newPassword || newPassword.length < 6) {
      setPasswordMessage("Password must be at least 6 characters long.");
      return;
    }

    if (newPassword !== confirmPassword) {
      setPasswordMessage("Passwords do not match.");
      return;
    }

    setLoading(true);
    setPasswordMessage("");

    const { error } = await supabase.auth.updateUser({
      password: newPassword,
    });

    if (error) {
      console.error("Error updating password:", error);
      setPasswordMessage("Failed to update password. Try again.");
    } else {
      setPasswordMessage("Password updated successfully.");
    }

    setLoading(false);
  };

  return (
    <div>
      <h2 className="text-lg font-bold mb-4">General</h2>

      {/* Avatar Section */}
      <div className="flex-block p-6 h-30 items-center bg-[#1A161D] border border-[#625D66] text-left rounded">
        <p className="mb-4">Change avatar</p>
        <p className="mb-4">Change the way you appear on Habify</p>
        <label className="border rounded border-[#625D66] p-2 px-4">
          Edit Avatar <UploadIcon className="inline w-4 h-4 mr-2" />
          <input type="file" className="hidden" onChange={uploadAvatar} />
        </label>
      </div>

      {/* Change Name Section */}
      <div className="flex-block p-6 items-center bg-[#1A161D] border h-30 border-[#625D66] rounded mt-6">
        <p className="mb-4">Change name</p>
        <p className="mb-4">Change the way your name will appear on Habify</p>
        <button
          onClick={() => setIsModalOpen(true)}
          className="bg-[#4F46E5] hover:bg-purple-600 text-white px-3 py-1 rounded-md text-sm"
        >
          Edit Name
        </button>
      </div>

      {/* Modal for Editing Name */}
      {isModalOpen && (
        <div className="fixed inset-0 bg-black bg-opacity-60 flex justify-center items-center z-50">
          <div className="bg-[#1A161D] p-6 rounded-lg border border-[#625D66] w-[90%] relative">
            <h3 className="text-lg font-bold text-white mb-4">Edit Name</h3>
            <input
              type="text"
              value={fullName}
              onChange={(e) => setFullName(e.target.value)}
              className="w-full bg-gray-800 text-white px-3 py-2 rounded-md border border-gray-700 outline-none"
              placeholder="Enter new name"
            />
            <div className="flex justify-end mt-4 space-x-2">
              <button
                onClick={() => setIsModalOpen(false)}
                className="bg-gray-700 text-white px-4 py-2 rounded-md"
              >
                Cancel
              </button>
              <button
                onClick={updateName}
                disabled={loading}
                className="bg-[#4F46E5] hover:bg-purple-600 text-white px-4 py-2 rounded-md"
              >
                {loading ? "Saving..." : "Save"}
              </button>
            </div>
            <button
              className="absolute top-2 right-2 text-white"
              onClick={() => setIsModalOpen(false)}
            >
              ✕
            </button>
          </div>
        </div>
      )}

      {/* Change Password Section */}
      <div className="flex-block p-6 items-center bg-[#1A161D] border h-auto border-[#625D66] rounded mt-6">
        <p className="mb-4">Change password</p>
        <p className="mb-4">
          Change the password associated with your account.
        </p>

        <input
          type="password"
          placeholder="New Password"
          className="w-full bg-gray-800 text-white px-3 py-2 mb-3 rounded-md border border-gray-700 outline-none"
          value={newPassword}
          onChange={(e) => setNewPassword(e.target.value)}
        />

        <input
          type="password"
          placeholder="Confirm New Password"
          className="w-full bg-gray-800 text-white px-3 py-2 mb-3 rounded-md border border-gray-700 outline-none"
          value={confirmPassword}
          onChange={(e) => setConfirmPassword(e.target.value)}
        />

        <button
          onClick={handleChangePassword}
          disabled={loading}
          className="bg-[#4F46E5] hover:bg-purple-600 text-white px-4 py-2 rounded-md"
        >
          {loading ? "Updating..." : "Update Password"}
        </button>

        {passwordMessage && (
          <p className="text-sm mt-3 text-white">{passwordMessage}</p>
        )}
      </div>
    </div>
  );
};

export default ManageTab;
