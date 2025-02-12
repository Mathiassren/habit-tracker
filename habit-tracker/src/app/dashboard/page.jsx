"use client"; // Forces client-side execution

import { useAuth } from "@/hooks/useAuth";
import { useRouter } from "next/navigation";
import { useEffect } from "react";

export default function Dashboard() {
  const { user, loading } = useAuth();
  const router = useRouter();

  useEffect(() => {
    if (!loading && !user) {
      router.push("/");
    }
  }, [user, loading]);

  if (loading) return <p>Loading...</p>;
  if (!user) return null;

  return (
    <div className="p-4">
      <h2 className="text-2xl font-bold">
        Welcome, {user.user_metadata.full_name}!
      </h2>
      <p>Your email: {user.email}</p>
    </div>
  );
}
