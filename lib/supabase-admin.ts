import "server-only";
import { createClient } from "@supabase/supabase-js";

/**
 * Elevated-privilege client for server code only (API routes under
 * app/api/**). Never import this from a "use client" component — the
 * service role key bypasses RLS entirely.
 */
export const supabaseAdmin = createClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL!,
  process.env.SUPABASE_SERVICE_ROLE_KEY!,
  { auth: { autoRefreshToken: false, persistSession: false } }
);
