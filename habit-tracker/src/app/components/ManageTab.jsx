"use client";

import { useEffect, useMemo, useState, useRef } from "react";
import { supabase } from "@/services/supabase";
import { UploadIcon } from "@radix-ui/react-icons";
import Image from "next/image";

const ManageTab = ({ user, setUser }) => {
  const DEFAULT_AVATAR = "/default-avatar.png";
  const setDefaultOnce = useRef(false);
  // --- state
  const [fullName, setFullName] = useState(
    user?.user_metadata?.full_name || ""
  );
  const [avatarUrl, setAvatarUrl] = useState(
    user?.user_metadata?.avatar_url || ""
  );
  const [msg, setMsg] = useState("");

  const [savingName, setSavingName] = useState(false);
  const [savingAvatar, setSavingAvatar] = useState(false);
  const [savingPassword, setSavingPassword] = useState(false);

  const [isModalOpen, setIsModalOpen] = useState(false);
  const [newPassword, setNewPassword] = useState("");
  const [confirmPassword, setConfirmPassword] = useState("");

  // Load avatar from profiles table first (for custom uploads), then fall back to user_metadata
  useEffect(() => {
    if (!user?.id) {
      setAvatarUrl("");
      setFullName("");
      return;
    }

    // Load from profiles table first (prioritizes custom uploads)
    (async () => {
      try {
        const { data: profile } = await supabase
          .from("profiles")
          .select("avatar_url, full_name")
          .eq("id", user.id)
          .single();

        // Use profile avatar if it exists and is a custom upload (Supabase storage)
        // Otherwise fall back to user_metadata (Google OAuth)
        const profileAvatar = profile?.avatar_url;
        const metadataAvatar = user?.user_metadata?.avatar_url;
        
        // Always use profile avatar if it exists (it's the source of truth for custom uploads)
        if (profileAvatar) {
          // Add cache-busting parameter to force refresh
          const avatarWithCache = profileAvatar.includes('?') 
            ? profileAvatar.split('?')[0] + `?v=${Date.now()}`
            : `${profileAvatar}?v=${Date.now()}`;
          setAvatarUrl(avatarWithCache);
          
          // Also update user_metadata to keep it in sync
          if (metadataAvatar !== profileAvatar) {
            await supabase.auth.updateUser({
              data: { avatar_url: profileAvatar },
            });
          }
        } else if (metadataAvatar) {
          setAvatarUrl(metadataAvatar);
        } else {
          setAvatarUrl("");
        }

        // Use profile full_name if available, otherwise user_metadata
        setFullName(profile?.full_name || user?.user_metadata?.full_name || "");
      } catch (error) {
        console.error("Error loading profile:", error);
        // Fallback to user_metadata
        const metadataAvatar = user?.user_metadata?.avatar_url;
        setAvatarUrl(metadataAvatar || "");
        setFullName(user?.user_metadata?.full_name || "");
      }
    })();
  }, [user?.id, user?.user_metadata?.avatar_url]); // More specific dependencies

  // --- ensure a default avatar for first-time users (runs once per user)
  useEffect(() => {
    if (!user?.id) return;
    if (setDefaultOnce.current) return; // guard
    const current = user.user_metadata?.avatar_url;
    if (current && current.trim() !== "") return;

    (async () => {
      try {
        // 1) persist to auth metadata
        await supabase.auth.updateUser({
          data: { avatar_url: DEFAULT_AVATAR },
        });
        // 2) persist to profiles table (upsert)
        await supabase.from("profiles").upsert(
          {
            id: user.id,
            avatar_url: DEFAULT_AVATAR,
            updated_at: new Date().toISOString(),
          },
          { onConflict: "id" }
        );
        // 3) refresh local auth user + local state
        await supabase.auth.refreshSession();
        const { data } = await supabase.auth.getUser();
        if (data?.user) setUser?.(data.user);
        setAvatarUrl(DEFAULT_AVATAR);
        setDefaultOnce.current = true;
      } catch (e) {
        console.error("Default avatar init failed:", e);
      }
    })();
  }, [user, setUser]);

  // email/password vs OAuth detection
  const hasEmailIdentity = useMemo(() => {
    if (Array.isArray(user?.identities)) {
      return user.identities.some((i) => i?.provider === "email");
    }
    return user?.app_metadata?.provider === "email";
  }, [user]);

  const refreshAuthUser = async () => {
    // refresh the JWT (so user_metadata is fresh) then get user
    await supabase.auth.refreshSession();
    const { data, error } = await supabase.auth.getUser();
    if (!error && data?.user) setUser?.(data.user);
  };

  // --- Update Name
  const updateName = async () => {
    const name = fullName.trim();
    if (!user?.id) return;

    setSavingName(true);
    try {
      // upsert ensures row exists
      const { error: profErr } = await supabase
        .from("profiles")
        .upsert(
          { id: user.id, full_name: name, updated_at: new Date().toISOString() },
          { onConflict: "id" }
        );
      if (profErr) {
        console.error(profErr);
        setMsg("Failed to save name. Please try again.");
        return;
      }

      const { error: authErr } = await supabase.auth.updateUser({
        data: { full_name: name },
      });
      if (authErr) {
        console.error(authErr);
        setMsg("Failed to save name. Please try again.");
        return;
      }

      await supabase.auth.refreshSession();
      const { data: fresh } = await supabase.auth.getUser();
      setUser?.(fresh.user);
      setMsg("Name saved successfully!");
      
      // Close the modal after successful save
      setIsModalOpen(false);
    } catch (error) {
      console.error("Error updating name:", error);
      setMsg("Failed to save name. Please try again.");
    } finally {
      setSavingName(false);
    }
  };

  // --- Upload Avatar
  const uploadAvatar = async (e) => {
    const file = e.target.files?.[0];
    if (!user?.id || !file) return;

    setSavingAvatar(true);
    setMsg("");

    try {
      const ext = (file.name.split(".").pop() || "jpg").toLowerCase();
      const filePath = `avatars/${user.id}.${ext}`;

      // Upload to Supabase storage
      const { error: upErr } = await supabase.storage
        .from("avatars")
        .upload(filePath, file, { upsert: true });
      if (upErr) {
        console.error("Upload error:", upErr);
        setMsg("Failed to upload avatar. Please try again.");
        return;
      }

      // Get public URL
      const { data } = supabase.storage.from("avatars").getPublicUrl(filePath);
      const publicUrl = data?.publicUrl
        ? `${data.publicUrl}?v=${Date.now()}`
        : "";
      if (!publicUrl) {
        setMsg("Failed to get avatar URL. Please try again.");
        return;
      }

      // Save to profiles table FIRST (this is the source of truth for custom avatars)
      const { error: profErr } = await supabase.from("profiles").upsert(
        {
          id: user.id,
          avatar_url: publicUrl,
          updated_at: new Date().toISOString(),
        },
        { onConflict: "id" }
      );
      if (profErr) {
        console.error("Profile update error:", profErr);
        setMsg("Failed to save avatar. Please try again.");
        return;
      }

      // Update user_metadata to keep it in sync
      const { error: authErr } = await supabase.auth.updateUser({
        data: { avatar_url: publicUrl },
      });
      if (authErr) {
        console.error("Auth update error:", authErr);
        // Don't fail completely - profile table has the avatar
      }

      // Refresh session and update local state
      await supabase.auth.refreshSession();
      const { data: fresh } = await supabase.auth.getUser();
      if (fresh?.user) {
        // Update user with new avatar_url in metadata
        const updatedUser = {
          ...fresh.user,
          user_metadata: {
            ...fresh.user.user_metadata,
            avatar_url: publicUrl,
          },
        };
        setUser?.(updatedUser);
      }
      // Update local avatar URL immediately with cache-busting
      setAvatarUrl(`${publicUrl}?v=${Date.now()}`);
      setMsg("Avatar uploaded successfully!");
      
      // Force a reload from profiles table to ensure sync
      setTimeout(async () => {
        try {
          const { data: profile } = await supabase
            .from("profiles")
            .select("avatar_url")
            .eq("id", user.id)
            .single();
          if (profile?.avatar_url) {
            setAvatarUrl(`${profile.avatar_url}?v=${Date.now()}`);
          }
        } catch (error) {
          console.error("Error reloading avatar:", error);
        }
      }, 500);
      
      // Clear message after 3 seconds
      setTimeout(() => setMsg(""), 3000);
    } catch (error) {
      console.error("Error uploading avatar:", error);
      setMsg("Failed to upload avatar. Please try again.");
    } finally {
      setSavingAvatar(false);
      e.target.value = "";
    }
  };

  // --- Change Password (email users only)
  const isEmailUser = Array.isArray(user?.identities)
    ? user.identities.some((i) => i?.provider === "email")
    : user?.app_metadata?.provider === "email";

  const handleChangePassword = async () => {
    if (!isEmailUser) return; // hide/disable UI as well
    if (newPassword.length < 6 || newPassword !== confirmPassword) return;

    const { error } = await supabase.auth.updateUser({ password: newPassword });
    if (error) {
      console.error(error);
      return;
    }

    await supabase.auth.refreshSession();
    const { data: fresh } = await supabase.auth.getUser();
    setUser?.(fresh.user);
    setNewPassword("");
    setConfirmPassword("");
  };

  return (
    <div className="space-y-6">
      <div className="bg-gradient-to-br from-slate-800/40 via-slate-800/30 to-slate-800/40 backdrop-blur-xl rounded-2xl border border-slate-700/50 shadow-2xl shadow-indigo-900/20 p-8">
        <h2 className="text-2xl font-bold text-white mb-6 flex items-center gap-2">
          <div className="w-1 h-6 bg-gradient-to-b from-indigo-500 to-cyan-500 rounded-full"></div>
          General Settings
        </h2>

        {msg && (
          <div className={`mb-6 p-4 rounded-xl border ${
            msg.includes("successfully") 
              ? "bg-emerald-500/20 border-emerald-500/30 text-emerald-400" 
              : "bg-red-500/20 border-red-500/30 text-red-400"
          }`}>
            <p className="text-sm font-medium">{msg}</p>
          </div>
        )}

        {/* Avatar Card */}
        <div className="bg-slate-700/20 rounded-xl border border-slate-600/30 p-4 sm:p-6 mb-6">
          <div className="mb-4">
            <h3 className="text-lg font-semibold text-white mb-1">Profile Avatar</h3>
            <p className="text-sm text-slate-400">
              Change the way you appear on Habify
            </p>
          </div>

          <div className="flex flex-col sm:flex-row items-center sm:items-center gap-4 sm:gap-6">
            <div className="relative flex-shrink-0">
              <div className="absolute inset-0 bg-gradient-to-r from-indigo-500 via-blue-500 to-cyan-500 rounded-full blur-lg opacity-30"></div>
              {avatarUrl ? (
                <Image
                  key={avatarUrl} // Force re-render when avatarUrl changes
                  src={avatarUrl}
                  alt="Avatar"
                  width={80}
                  height={80}
                  className="relative rounded-full border-4 border-indigo-500/50 object-cover shadow-xl w-20 h-20"
                  unoptimized
                />
              ) : (
                <div className="relative w-20 h-20 rounded-full bg-slate-700 border-4 border-indigo-500/50 grid place-items-center overflow-hidden shadow-xl">
                  <img
                    key={user?.user_metadata?.avatar_url || "default"}
                    src={user?.user_metadata?.avatar_url || "/default-avatar.png"}
                    alt="User Avatar"
                    className="w-full h-full object-cover"
                  />
                </div>
              )}
            </div>

            <label className="flex-1 w-full cursor-pointer">
              <div className="border-2 border-dashed border-slate-600/50 hover:border-indigo-500/50 rounded-xl p-4 transition-all group">
                <div className="flex items-center gap-3">
                  <div className="w-10 h-10 rounded-lg bg-indigo-500/20 flex items-center justify-center border border-indigo-500/30 group-hover:bg-indigo-500/30 transition-colors flex-shrink-0">
                    <UploadIcon className="w-5 h-5 text-indigo-400" />
                  </div>
                  <div className="flex-1 min-w-0">
                    <p className="text-white font-medium group-hover:text-indigo-300 transition-colors">
                      {savingAvatar ? "Uploading..." : "Upload New Avatar"}
                    </p>
                    <p className="text-xs text-slate-400">PNG, JPG up to 5MB</p>
                  </div>
                </div>
              </div>
              <input
                type="file"
                accept="image/*"
                className="hidden"
                onChange={uploadAvatar}
                disabled={savingAvatar}
              />
            </label>
          </div>
        </div>

        {/* Name Card */}
        <div className="bg-slate-700/20 rounded-xl border border-slate-600/30 p-4 sm:p-6 mb-6">
          <div className="mb-4">
            <h3 className="text-lg font-semibold text-white mb-1">Display Name</h3>
            <p className="text-sm text-slate-400">
              Change how your name appears on Habify
            </p>
          </div>
          <button
            onClick={() => setIsModalOpen(true)}
            className="w-full sm:w-auto bg-gradient-to-r from-indigo-600 via-blue-600 to-cyan-600 hover:from-indigo-500 hover:via-blue-500 hover:to-cyan-500 text-white px-6 py-3 rounded-xl text-sm font-medium shadow-lg shadow-indigo-500/30 transition-all"
          >
            Edit Name
          </button>
        </div>

      {isModalOpen && (
        <div className="fixed inset-0 bg-black/80 backdrop-blur-md flex justify-center items-center z-50 p-4">
          <div className="bg-gradient-to-br from-slate-800/95 via-slate-800/90 to-slate-800/95 backdrop-blur-xl rounded-2xl shadow-2xl border border-slate-700/50 w-full max-w-md overflow-hidden relative">
            <div className="p-6 border-b border-slate-700/50 bg-gradient-to-r from-indigo-600/10 via-blue-600/10 to-cyan-600/10">
              <h3 className="text-xl font-bold text-white">Edit Name</h3>
              <p className="text-slate-400 text-sm mt-1">Update your display name</p>
            </div>
            <div className="p-6">
              <input
                type="text"
                value={fullName}
                onChange={(e) => setFullName(e.target.value)}
                className="w-full bg-slate-700/30 text-white px-4 py-3 rounded-xl border border-slate-600/30 focus:border-indigo-500 focus:ring-2 focus:ring-indigo-500/50 outline-none transition-all mb-4"
                placeholder="Enter new name"
                onKeyDown={(e) => {
                  if (e.key === 'Enter' && fullName.trim() && !savingName) {
                    updateName();
                  }
                }}
              />
              <div className="flex justify-end gap-3">
                <button
                  onClick={() => setIsModalOpen(false)}
                  className="px-4 py-2 rounded-xl bg-slate-700/50 hover:bg-slate-700 text-white transition-colors border border-slate-600/50"
                >
                  Cancel
                </button>
                <button
                  onClick={updateName}
                  disabled={savingName || !fullName.trim()}
                  className="px-4 py-2 rounded-xl bg-gradient-to-r from-indigo-600 via-blue-600 to-cyan-600 hover:from-indigo-500 hover:via-blue-500 hover:to-cyan-500 text-white shadow-lg shadow-indigo-500/30 transition-all disabled:opacity-50 disabled:cursor-not-allowed"
                >
                  {savingName ? (
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
            <button
              className="absolute top-4 right-4 w-8 h-8 flex items-center justify-center rounded-lg bg-slate-700/50 hover:bg-slate-700 text-slate-400 hover:text-white transition-colors border border-slate-600/50"
              onClick={() => setIsModalOpen(false)}
            >
              ✕
            </button>
          </div>
        </div>
      )}

        {/* Password Card */}
        <div className="bg-slate-700/20 rounded-xl border border-slate-600/30 p-4 sm:p-6">
          <h3 className="text-lg font-semibold text-white mb-1">Change Password</h3>

          {!hasEmailIdentity ? (
            <div className="mt-4 p-4 bg-blue-500/10 border border-blue-500/30 rounded-xl">
              <p className="text-sm text-blue-300">
                This account uses an external provider (e.g., Google). Manage your
                password in your provider's settings.
              </p>
            </div>
          ) : (
            <>
              <p className="text-sm text-slate-400 mb-4 mt-2">
                Change the password associated with your account.
              </p>

              <div className="space-y-3">
                <input
                  type="password"
                  placeholder="New Password"
                  className="w-full bg-slate-800/50 text-white px-4 py-3 rounded-xl border border-slate-600/30 focus:border-indigo-500 focus:ring-2 focus:ring-indigo-500/50 outline-none transition-all"
                  value={newPassword}
                  onChange={(e) => setNewPassword(e.target.value)}
                />

                <input
                  type="password"
                  placeholder="Confirm New Password"
                  className="w-full bg-slate-800/50 text-white px-4 py-3 rounded-xl border border-slate-600/30 focus:border-indigo-500 focus:ring-2 focus:ring-indigo-500/50 outline-none transition-all"
                  value={confirmPassword}
                  onChange={(e) => setConfirmPassword(e.target.value)}
                />

                {newPassword && newPassword.length < 6 && (
                  <p className="text-xs text-red-400">Password must be at least 6 characters</p>
                )}
                {newPassword && confirmPassword && newPassword !== confirmPassword && (
                  <p className="text-xs text-red-400">Passwords do not match</p>
                )}

                <button
                  onClick={handleChangePassword}
                  disabled={savingPassword || newPassword.length < 6 || newPassword !== confirmPassword}
                  className="w-full px-4 py-3 rounded-xl bg-gradient-to-r from-indigo-600 via-blue-600 to-cyan-600 hover:from-indigo-500 hover:via-blue-500 hover:to-cyan-500 text-white shadow-lg shadow-indigo-500/30 transition-all disabled:opacity-50 disabled:cursor-not-allowed font-medium"
                >
                  {savingPassword ? (
                    <span className="flex items-center justify-center gap-2">
                      <span className="w-4 h-4 border-2 border-white/30 border-t-white rounded-full animate-spin"></span>
                      Updating Password...
                    </span>
                  ) : (
                    "Update Password"
                  )}
                </button>
              </div>
            </>
          )}
        </div>
      </div>
    </div>
  );
};

export default ManageTab;
