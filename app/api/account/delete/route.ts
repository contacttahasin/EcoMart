import { createClient } from "@supabase/supabase-js";
import { NextResponse } from "next/server";
import { supabaseAdmin } from "@/lib/supabase-admin";

/**
 * Deleting a user's own auth.users row requires the service-role key, which
 * must never touch the browser — this route verifies the caller's bearer
 * token server-side first, then performs the deletion on their behalf.
 * Every table referencing profiles(id) uses ON DELETE CASCADE, so this one
 * call cleans up the whole account (addresses, sessions, vendor profile, etc).
 */
export async function POST(request: Request) {
  const authHeader = request.headers.get("authorization");
  const accessToken = authHeader?.startsWith("Bearer ") ? authHeader.slice(7) : null;

  if (!accessToken) {
    return NextResponse.json({ error: "Missing session token." }, { status: 401 });
  }

  const requestClient = createClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.NEXT_PUBLIC_SUPABASE_PUBLISHABLE_KEY!
  );

  const {
    data: { user },
    error: userError,
  } = await requestClient.auth.getUser(accessToken);

  if (userError || !user) {
    return NextResponse.json({ error: "Invalid or expired session." }, { status: 401 });
  }

  const { error: deleteError } = await supabaseAdmin.auth.admin.deleteUser(user.id);

  if (deleteError) {
    return NextResponse.json({ error: deleteError.message }, { status: 500 });
  }

  return NextResponse.json({ success: true });
}
