import { createRouteHandlerClient } from "@/services/supabase/server";
import { NextResponse } from "next/server";

// GET /api/users - Fetch user data for leaderboard
export async function GET(request) {
  try {
    const supabase = await createRouteHandlerClient();
    const { searchParams } = new URL(request.url);
    const userIds = searchParams.get("ids")?.split(",") || [];

    if (userIds.length === 0) {
      return NextResponse.json({ users: [] }, { status: 200 });
    }

    // Fetch profiles first
    const { data: profiles, error: profilesError } = await supabase
      .from("profiles")
      .select("id, full_name, avatar_url, created_at, updated_at")
      .in("id", userIds);

    if (profilesError) {
      console.error("Error fetching profiles:", profilesError);
    }

    // Create a map of profile data
    const profileMap = new Map();
    (profiles || []).forEach((profile) => {
      profileMap.set(profile.id, profile);
    });

    // For users without profiles, we can't directly query auth.users from here
    // But we can return what we have from profiles and let the client handle the rest
    const usersData = userIds.map((userId) => {
      const profile = profileMap.get(userId);
      return {
        id: userId,
        full_name: profile?.full_name || null,
        avatar_url: profile?.avatar_url || null,
        created_at: profile?.created_at || null,
        updated_at: profile?.updated_at || null,
      };
    });

    return NextResponse.json({ users: usersData }, { status: 200 });
  } catch (error) {
    console.error("Error in /api/users:", error);
    return NextResponse.json(
      { error: "Failed to fetch users" },
      { status: 500 }
    );
  }
}


