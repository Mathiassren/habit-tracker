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

  // keep local fields in sync when parent user changes
  useEffect(() => {
    setFullName(user?.user_metadata?.full_name || "");
    setAvatarUrl(user?.user_metadata?.avatar_url || "");
  }, [user]);

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

    // upsert ensures row exists
    const { error: profErr } = await supabase
      .from("profiles")
      .upsert(
        { id: user.id, full_name: name, updated_at: new Date().toISOString() },
        { onConflict: "id" }
      );
    if (profErr) {
      console.error(profErr);
      return;
    }

    const { error: authErr } = await supabase.auth.updateUser({
      data: { full_name: name },
    });
    if (authErr) {
      console.error(authErr);
      return;
    }

    await supabase.auth.refreshSession();
    const { data: fresh } = await supabase.auth.getUser();
    setUser?.(fresh.user);
  };

  // --- Upload Avatar
  const uploadAvatar = async (e) => {
    const file = e.target.files?.[0];
    if (!user?.id || !file) return;

    const ext = (file.name.split(".").pop() || "jpg").toLowerCase();
    const filePath = `avatars/${user.id}.${ext}`;

    const { error: upErr } = await supabase.storage
      .from("avatars")
      .upload(filePath, file, { upsert: true });
    if (upErr) {
      console.error(upErr);
      return;
    }

    const { data } = supabase.storage.from("avatars").getPublicUrl(filePath);
    const publicUrl = data?.publicUrl
      ? `${data.publicUrl}?v=${Date.now()}`
      : "";
    if (!publicUrl) return;

    const { error: profErr } = await supabase.from("profiles").upsert(
      {
        id: user.id,
        avatar_url: publicUrl,
        updated_at: new Date().toISOString(),
      },
      { onConflict: "id" }
    );
    if (profErr) {
      console.error(profErr);
      return;
    }

    await supabase.auth.updateUser({ data: { avatar_url: publicUrl } });

    await supabase.auth.refreshSession();
    const { data: fresh } = await supabase.auth.getUser();
    setUser?.(fresh.user);
    setAvatarUrl(publicUrl);
    e.target.value = "";
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
    <div>
      <h2 className="text-lg font-bold mb-4">General</h2>

      {msg && <p className="mb-4 text-sm text-white/90">{msg}</p>}

      {/* Avatar */}
      <div className="flex-block p-6 h-30 items-center bg-[#1A161D] border border-[#625D66] text-left rounded">
        <p className="mb-1 font-semibold">Change avatar</p>
        <p className="mb-4 text-white/70">
          Change the way you appear on Habify
        </p>

        <div className="flex items-center gap-4">
          {avatarUrl ? (
            <Image
              src={avatarUrl}
              alt="Avatar"
              width={64}
              height={64}
              unoptimized // skips Next Image optimization (no whitelist needed)
            />
          ) : (
            <div className="w-16 h-16 rounded-full bg-gray-700 grid place-items-center text-xs text-white/60">
              <img
                src={user.user_metadata?.avatar_url || "/default-avatar.png"} // Prevent null error
                alt="User Avatar"
              />
            </div>
          )}

          <label className="border rounded border-[#625D66] p-2 px-4 inline-flex items-center gap-2 cursor-pointer">
            <UploadIcon className="inline w-4 h-4" />
            <span>{savingAvatar ? "Uploading..." : "Edit Avatar"}</span>
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

      {/* Name */}
      <div className="flex-block p-6 items-center bg-[#1A161D] border h-30 border-[#625D66] rounded mt-6">
        <p className="mb-1 font-semibold">Change name</p>
        <p className="mb-4 text-white/70">
          Change how your name appears on Habify
        </p>
        <button
          onClick={() => setIsModalOpen(true)}
          className="bg-[#4F46E5] hover:bg-purple-600 text-white px-3 py-1 rounded-md text-sm"
        >
          Edit Name
        </button>
      </div>

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
                disabled={savingName}
                className="bg-[#4F46E5] hover:bg-purple-600 text-white px-4 py-2 rounded-md"
              >
                {savingName ? "Saving..." : "Save"}
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

      {/* Password */}
      <div className="flex-block p-6 items-center bg-[#1A161D] border h-auto border-[#625D66] rounded mt-6">
        <p className="mb-1 font-semibold">Change password</p>

        {!hasEmailIdentity ? (
          <p className="mb-2 text-white/80">
            This account uses an external provider (e.g., Google). Manage your
            password in your provider’s settings.
          </p>
        ) : (
          <>
            <p className="mb-4 text-white/70">
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
              disabled={savingPassword}
              className="bg-[#4F46E5] hover:bg-purple-600 text-white px-4 py-2 rounded-md"
            >
              {savingPassword ? "Updating..." : "Update Password"}
            </button>
          </>
        )}
      </div>
    </div>
  );
};

export default ManageTab;
