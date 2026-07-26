import { supabase } from "@/lib/supabase";

export type LoginActivityEntry = {
  id: string;
  created_at: string;
  user_agent: string | null;
  success: boolean;
};

export type SessionEntry = {
  id: string;
  device: string | null;
  browser: string | null;
  last_active_at: string;
  created_at: string;
};

export type NotificationPreferences = {
  orderUpdates: boolean;
  ecoTips: boolean;
  securityAlerts: boolean;
};

function parseUserAgent(ua: string): { browser: string; device: string } {
  const device = /Mobile|Android|iPhone|iPad/.test(ua) ? "Mobile" : "Desktop";
  let browser = "Unknown browser";
  if (ua.includes("Edg")) browser = "Edge";
  else if (ua.includes("Chrome")) browser = "Chrome";
  else if (ua.includes("Firefox")) browser = "Firefox";
  else if (ua.includes("Safari")) browser = "Safari";
  return { browser, device };
}

/** Called right after a successful login — awaited so a fast subsequent
 * navigation can't cancel the request before it lands. */
export async function recordLoginActivity(userId: string, success: boolean): Promise<void> {
  await supabase.from("login_activity").insert({ user_id: userId, user_agent: navigator.userAgent, success });
}

/** Creates the "Active Sessions" row for this device/login. */
export async function recordSession(userId: string): Promise<void> {
  const { browser, device } = parseUserAgent(navigator.userAgent);
  await supabase.from("user_sessions").insert({ user_id: userId, browser, device, user_agent: navigator.userAgent });
}

export async function fetchLoginActivity(userId: string, limit = 10): Promise<LoginActivityEntry[]> {
  const { data } = await supabase
    .from("login_activity")
    .select("id, created_at, user_agent, success")
    .eq("user_id", userId)
    .order("created_at", { ascending: false })
    .limit(limit);
  return data ?? [];
}

export async function fetchActiveSessions(userId: string): Promise<SessionEntry[]> {
  const { data } = await supabase
    .from("user_sessions")
    .select("id, device, browser, last_active_at, created_at")
    .eq("user_id", userId)
    .is("revoked_at", null)
    .order("last_active_at", { ascending: false });
  return data ?? [];
}

/** Supabase Auth's native "sign out everywhere but here" — no admin key needed. */
export async function signOutOtherSessions(): Promise<void> {
  await supabase.auth.signOut({ scope: "others" });
}

export type ChangePasswordResult = { success: true } | { success: false; error: string };

export async function changePassword(
  email: string,
  currentPassword: string,
  newPassword: string
): Promise<ChangePasswordResult> {
  const { error: reauthError } = await supabase.auth.signInWithPassword({ email, password: currentPassword });
  if (reauthError) {
    return { success: false, error: "Current password is incorrect." };
  }

  const { error } = await supabase.auth.updateUser({ password: newPassword });
  if (error) {
    return { success: false, error: error.message };
  }
  return { success: true };
}

export type AccountSecurityInfo = {
  emailVerified: boolean;
  phoneVerified: boolean;
  twoFactorEnabled: boolean;
};

export async function fetchAccountSecurityInfo(userId: string): Promise<AccountSecurityInfo | null> {
  const { data } = await supabase
    .from("profiles")
    .select("email_verified, phone_verified, two_factor_enabled")
    .eq("id", userId)
    .single();
  if (!data) return null;
  return {
    emailVerified: data.email_verified,
    phoneVerified: data.phone_verified,
    twoFactorEnabled: data.two_factor_enabled,
  };
}

export async function uploadAvatar(userId: string, file: File): Promise<string> {
  const extension = file.name.split(".").pop() ?? "jpg";
  const path = `${userId}/avatar.${extension}`;

  const { error } = await supabase.storage.from("avatars").upload(path, file, { upsert: true });
  if (error) throw error;

  const {
    data: { publicUrl },
  } = supabase.storage.from("avatars").getPublicUrl(path);
  return `${publicUrl}?t=${Date.now()}`;
}

export async function updateNotificationPreferences(userId: string, prefs: NotificationPreferences): Promise<void> {
  await supabase.from("profiles").update({ notification_preferences: prefs }).eq("id", userId);
}

export async function fetchNotificationPreferences(userId: string): Promise<NotificationPreferences | null> {
  const { data } = await supabase
    .from("profiles")
    .select("notification_preferences")
    .eq("id", userId)
    .single();
  return (data?.notification_preferences as NotificationPreferences) ?? null;
}

export type DeleteAccountResult = { success: true } | { success: false; error: string };

export async function deleteAccount(): Promise<DeleteAccountResult> {
  const {
    data: { session },
  } = await supabase.auth.getSession();

  if (!session) {
    return { success: false, error: "No active session." };
  }

  const response = await fetch("/api/account/delete", {
    method: "POST",
    headers: { Authorization: `Bearer ${session.access_token}` },
  });

  if (!response.ok) {
    const body = await response.json().catch(() => ({ error: "Could not delete account." }));
    return { success: false, error: body.error ?? "Could not delete account." };
  }

  // The user no longer exists server-side at this point, so GoTrue always
  // 403s trying to invalidate its session server-side — harmless noise; the
  // local session is cleared either way, which is all that matters here.
  await supabase.auth.signOut({ scope: "local" });
  return { success: true };
}

// --- Two-Factor Authentication (Supabase Auth native TOTP) ---

export async function enrollTwoFactor() {
  // Supabase rejects a second enroll with the same (default empty) friendly
  // name once one exists — if the vendor started enrolling before and never
  // verified/cancelled, clean up that abandoned factor first so they can
  // always retry instead of getting stuck on a 422.
  // listFactors().data.totp only includes *verified* TOTP factors, so an
  // abandoned unverified enrollment has to be found via data.all instead.
  const { data: allFactors } = await supabase.auth.mfa.listFactors();
  const abandoned = allFactors?.all.find((f) => f.factor_type === "totp" && f.status !== "verified");
  if (abandoned) {
    await supabase.auth.mfa.unenroll({ factorId: abandoned.id });
  }

  const { data, error } = await supabase.auth.mfa.enroll({ factorType: "totp" });
  if (error) throw error;
  return data;
}

export type VerifyTwoFactorResult = { success: true } | { success: false; error: string };

export async function verifyTwoFactorEnrollment(
  userId: string,
  factorId: string,
  code: string
): Promise<VerifyTwoFactorResult> {
  const { data: challenge, error: challengeError } = await supabase.auth.mfa.challenge({ factorId });
  if (challengeError) return { success: false, error: challengeError.message };

  const { error: verifyError } = await supabase.auth.mfa.verify({
    factorId,
    challengeId: challenge.id,
    code,
  });
  if (verifyError) return { success: false, error: verifyError.message };

  await supabase.from("profiles").update({ two_factor_enabled: true }).eq("id", userId);
  return { success: true };
}

export async function listTwoFactorFactors() {
  const { data, error } = await supabase.auth.mfa.listFactors();
  if (error) return [];
  return data.totp;
}

export async function unenrollTwoFactor(userId: string, factorId: string): Promise<void> {
  await supabase.auth.mfa.unenroll({ factorId });
  await supabase.from("profiles").update({ two_factor_enabled: false }).eq("id", userId);
}
