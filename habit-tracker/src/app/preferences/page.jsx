"use client"; // Forces client-side execution

import { useAuth } from "@/hooks/useAuth";
import { useRouter } from "next/navigation";
import { useEffect, useState } from "react";
import { CopyIcon, CheckIcon, Pencil2Icon } from "@radix-ui/react-icons"; // ✅ Import Icons

export default function Dashboard() {
  const { user, loading } = useAuth();
  const router = useRouter();
  const [copied, setCopied] = useState(false);

  useEffect(() => {
    if (!loading && !user) {
      router.push("/");
    }
  }, [user, loading]);

  if (loading) return <p>Loading...</p>;
  if (!user) return null;

  const createdAt = new Date(user?.created_at).toLocaleDateString("da-DK", {
    year: "numeric",
    month: "long",
    day: "numeric",
  });

  const firstName = user?.user_metadata?.full_name?.split(" ")[0] || "Guest";
  const fullName = user?.user_metadata?.full_name || "Unknown";

  // ✅ Copy to clipboard function
  const copyToClipboard = async () => {
    try {
      await navigator.clipboard.writeText(user.id);
      setCopied(true);
      setTimeout(() => setCopied(false), 2000); // Reset after 2s
    } catch (err) {
      console.error("Failed to copy:", err);
    }
  };

  return (
    <div className="p-8">
      <h1 className="font-play font-bold text-xl">Preferences</h1>
      <h2 className="text-lg font-play text-gray-300">Welcome, {firstName}!</h2>

      <div className="mt-6">
        <h2 className="font-bold font-play mb-4">Account Details</h2>

        <div className="grid grid-cols-[100px_1fr] gap-y-2 text-sm text-gray-300">
          {/* ✅ Status Row */}
          <span className="font-play">Status</span>
          <span className="bg-green-600 text-xs text-white p-1 px-2 rounded-lg">
            {user ? "Authenticated" : "Not Authenticated"}
          </span>

          {/* ✅ Created On Row */}
          <span className="font-play">Created on</span>
          <span>{createdAt}</span>

          {/* ✅ Name Row with Edit Icon */}
          <span className="font-play">Name</span>
          <div className="flex items-center">
            <span>{fullName}</span>
            <Pencil2Icon className="ml-2 w-4 h-4 text-gray-500 hover:text-gray-400 cursor-pointer" />
          </div>

          {/* ✅ Email Row */}
          <span className="font-play">Email</span>
          <span className="text-blue-400">{user.email}</span>

          {/* ✅ User ID Row with Copy Button */}
          <span className="font-play">User ID</span>
          <div className="flex items-center">
            <span className="font-mono bg-gray-800 text-white px-2 py-1 rounded-md">
              {user.id}
            </span>
            <button
              onClick={copyToClipboard}
              className="ml-2 p-1 bg-gray-700 hover:bg-gray-600 rounded-md transition"
              title="Copy User ID"
            >
              {copied ? (
                <CheckIcon className="w-4 h-4 text-green-500" />
              ) : (
                <CopyIcon className="w-4 h-4 text-gray-300" />
              )}
            </button>
          </div>
        </div>

        {copied && (
          <p className="text-sm text-green-500 font-play mt-2">
            Copied to clipboard!
          </p>
        )}
      </div>
    </div>
  );
}
