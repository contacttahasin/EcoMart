"use client";

import { createContext, useCallback, useContext, useEffect, useMemo, useState, type ReactNode } from "react";
import type { Customer } from "@/data/customers";
import { getPasswordStrengthError, isValidEmail } from "@/services/validation.service";
import { recordLoginActivity, recordSession } from "@/services/account.service";
import { supabase } from "@/lib/supabase";

export type SignupInput = {
  name: string;
  email: string;
  phone: string;
  password: string;
};

export type AuthResult = { success: true } | { success: false; error: string };

/** `otpRequired` reflects whether Supabase actually gated this signup behind
 * email confirmation (project's "Confirm email" setting) — the caller uses
 * it to decide whether to show the OTP screen instead of assuming email
 * signup always needs one. */
export type StartSignupResult = { success: true; otpRequired: boolean } | { success: false; error: string };

export type ProfileUpdate = Partial<Pick<Customer, "name" | "email" | "phone" | "avatar">>;

type AuthContextValue = {
  user: Customer | null;
  isLoading: boolean;
  startSignup: (input: SignupInput) => Promise<StartSignupResult>;
  verifySignupOtp: (email: string, token: string) => Promise<AuthResult>;
  resendSignupOtp: (email: string) => Promise<AuthResult>;
  login: (identifier: string, password: string) => Promise<AuthResult>;
  logout: () => void;
  updateProfile: (updates: ProfileUpdate) => Promise<void>;
};

const AuthContext = createContext<AuthContextValue | null>(null);

type ProfileRow = {
  role: "customer" | "vendor" | "admin";
  full_name: string | null;
  phone: string | null;
  avatar_url: string | null;
  created_at: string;
};

function toCustomer(authUser: { id: string; email?: string | null }, profile: ProfileRow): Customer {
  return {
    id: authUser.id,
    name: profile.full_name ?? "",
    email: authUser.email ?? "",
    phone: profile.phone ?? "",
    avatar: profile.avatar_url,
    joinedDate: profile.created_at.slice(0, 10),
  };
}

async function fetchProfile(userId: string): Promise<ProfileRow | null> {
  const { data, error } = await supabase
    .from("profiles")
    .select("role, full_name, phone, avatar_url, created_at")
    .eq("id", userId)
    .single();
  if (error || !data) return null;
  return data;
}

/**
 * Real Supabase Auth-backed session. A `profiles` row is auto-created by a
 * database trigger the moment `auth.users` gets a new row (see
 * supabase/migrations/*_core_identity.sql), so every signed-in user always
 * has a matching profile to read here.
 */
export function AuthProvider({ children }: { children: ReactNode }) {
  const [user, setUser] = useState<Customer | null>(null);
  const [isLoading, setIsLoading] = useState(true);

  useEffect(() => {
    let active = true;

    supabase.auth.getSession().then(async ({ data: { session } }) => {
      if (!active) return;
      if (session?.user) {
        const profile = await fetchProfile(session.user.id);
        if (active && profile?.role === "customer") setUser(toCustomer(session.user, profile));
      }
      if (active) setIsLoading(false);
    });

    const { data: listener } = supabase.auth.onAuthStateChange(async (_event, session) => {
      if (!active) return;
      if (!session?.user) {
        setUser(null);
        return;
      }
      const profile = await fetchProfile(session.user.id);
      if (!active) return;
      setUser(profile?.role === "customer" ? toCustomer(session.user, profile) : null);
    });

    return () => {
      active = false;
      listener.subscription.unsubscribe();
    };
  }, []);

  /**
   * Creates the Supabase Auth user but does not sign the customer in yet.
   * For email signup, `enable_confirmations` is on (see supabase/config.toml)
   * so this sends a 6-digit OTP to the address instead of returning a
   * session — the account only becomes usable once `verifySignupOtp`
   * succeeds. Phone signup has no confirmation gate configured, so it still
   * returns a session immediately, exactly like before.
   */
  const startSignup = useCallback(async (input: SignupInput): Promise<StartSignupResult> => {
    const name = input.name.trim();
    const email = input.email.trim();
    const phone = input.phone.trim();
    const password = input.password;

    if (!name || !password || (!email && !phone)) {
      return { success: false, error: "Please fill in all required fields." };
    }

    if (email && !isValidEmail(email)) {
      return { success: false, error: "Please enter a valid email address." };
    }

    const passwordError = getPasswordStrengthError(password);
    if (passwordError) {
      return { success: false, error: passwordError };
    }

    const { data, error } = email
      ? await supabase.auth.signUp({
          email,
          password,
          options: { data: { role: "customer", full_name: name, phone } },
        })
      : await supabase.auth.signUp({
          phone,
          password,
          options: { data: { role: "customer", full_name: name } },
        });

    if (error) {
      const message = error.message.toLowerCase().includes("already registered")
        ? `An account with this ${email ? "email" : "phone number"} already exists.`
        : error.message;
      return { success: false, error: message };
    }

    // Supabase returns a "success" response with an empty identities array for
    // an already-registered, already-confirmed identity (anti-enumeration) —
    // this is the documented way to detect that case.
    if (data.user && data.user.identities && data.user.identities.length === 0) {
      return { success: false, error: `An account with this ${email ? "email" : "phone number"} already exists.` };
    }

    if (!data.user) {
      return { success: false, error: "Something went wrong creating your account." };
    }

    // A session came back immediately — either phone signup (no confirmation
    // gate configured) or the project's "Confirm email" setting is off, so
    // no OTP screen is needed.
    if (data.session) {
      const profile = await fetchProfile(data.user.id);
      if (profile?.role === "customer") setUser(toCustomer(data.user, profile));
      await recordSession(data.user.id);
      return { success: true, otpRequired: false };
    }

    return { success: true, otpRequired: true };
  }, []);

  /** Confirms the signup OTP and finalizes the account — the customer session starts here. */
  const verifySignupOtp = useCallback(async (email: string, token: string): Promise<AuthResult> => {
    const { data, error } = await supabase.auth.verifyOtp({
      email: email.trim(),
      token: token.trim(),
      type: "signup",
    });

    if (error || !data.user) {
      return { success: false, error: error?.message ?? "Invalid or expired code. Please try again." };
    }

    const profile = await fetchProfile(data.user.id);
    if (profile?.role === "customer") setUser(toCustomer(data.user, profile));
    await recordSession(data.user.id);

    return { success: true };
  }, []);

  const resendSignupOtp = useCallback(async (email: string): Promise<AuthResult> => {
    const { error } = await supabase.auth.resend({ type: "signup", email: email.trim() });
    if (error) {
      return { success: false, error: error.message };
    }
    return { success: true };
  }, []);

  const login = useCallback(async (identifier: string, password: string): Promise<AuthResult> => {
    const trimmedIdentifier = identifier.trim();

    if (!trimmedIdentifier || !password) {
      return { success: false, error: "Please enter your email/phone and password." };
    }

    const { data, error } = trimmedIdentifier.includes("@")
      ? await supabase.auth.signInWithPassword({ email: trimmedIdentifier, password })
      : await supabase.auth.signInWithPassword({ phone: trimmedIdentifier, password });

    if (error || !data.user) {
      return { success: false, error: "Invalid email/phone or password." };
    }

    const profile = await fetchProfile(data.user.id);
    if (!profile) {
      await supabase.auth.signOut();
      return { success: false, error: "Something went wrong loading your account. Please try again." };
    }
    if (profile.role !== "customer") {
      await supabase.auth.signOut();
      return { success: false, error: "This email is registered as a vendor account. Please use the vendor login page." };
    }

    setUser(toCustomer(data.user, profile));
    await recordLoginActivity(data.user.id, true);
    await recordSession(data.user.id);

    return { success: true };
  }, []);

  const logout = useCallback(() => {
    setUser(null);
    void supabase.auth.signOut();
  }, []);

  /** Updates both the profile row and the live session state in one go. */
  const updateProfile = useCallback(
    async (updates: ProfileUpdate) => {
      if (!user) return;

      const profileUpdates: Record<string, unknown> = {};
      if (updates.name !== undefined) profileUpdates.full_name = updates.name;
      if (updates.avatar !== undefined) profileUpdates.avatar_url = updates.avatar;
      if (updates.phone !== undefined && updates.phone !== user.phone) {
        profileUpdates.phone = updates.phone;
        profileUpdates.phone_verified = false;
      }

      if (Object.keys(profileUpdates).length > 0) {
        await supabase.from("profiles").update(profileUpdates).eq("id", user.id);
      }

      // Changing email goes through Supabase's own confirmation flow rather
      // than a plain column update — it only takes effect once the user
      // clicks the link sent to the new address.
      if (updates.email !== undefined && updates.email !== user.email) {
        await supabase.auth.updateUser({ email: updates.email });
      }

      setUser({ ...user, ...updates });
    },
    [user]
  );

  const value = useMemo(
    () => ({ user, isLoading, startSignup, verifySignupOtp, resendSignupOtp, login, logout, updateProfile }),
    [user, isLoading, startSignup, verifySignupOtp, resendSignupOtp, login, logout, updateProfile]
  );

  return <AuthContext.Provider value={value}>{children}</AuthContext.Provider>;
}

export function useAuth() {
  const context = useContext(AuthContext);
  if (!context) {
    throw new Error("useAuth must be used within an AuthProvider");
  }
  return context;
}
