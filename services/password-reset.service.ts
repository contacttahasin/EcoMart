import { supabase } from "@/lib/supabase";

export type SendResetEmailResult = { success: true } | { success: false; error: string };

/**
 * Always returns success for a well-formed email, even if no account
 * exists for it — matching Supabase Auth's own anti-enumeration behavior,
 * so this can't be used to probe which emails are registered.
 */
export async function sendPasswordResetEmail(email: string): Promise<SendResetEmailResult> {
  const redirectTo = `${window.location.origin}/reset-password`;
  const { error } = await supabase.auth.resetPasswordForEmail(email.trim(), { redirectTo });
  if (error) {
    return { success: false, error: error.message };
  }
  return { success: true };
}

export type UpdatePasswordResult = { success: true } | { success: false; error: string };

export async function updatePasswordAfterReset(newPassword: string): Promise<UpdatePasswordResult> {
  const { error } = await supabase.auth.updateUser({ password: newPassword });
  if (error) {
    return { success: false, error: error.message };
  }
  return { success: true };
}

export async function fetchRoleForRedirect(): Promise<"customer" | "vendor" | "admin" | null> {
  const {
    data: { user },
  } = await supabase.auth.getUser();
  if (!user) return null;
  const { data } = await supabase.from("profiles").select("role").eq("id", user.id).single();
  return data?.role ?? null;
}
