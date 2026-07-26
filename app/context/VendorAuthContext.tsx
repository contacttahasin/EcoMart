"use client";

import { createContext, useCallback, useContext, useEffect, useMemo, useState, type ReactNode } from "react";
import type { VendorAccount } from "@/app/types/vendor";
import { getPasswordStrengthError, isValidEmail } from "@/services/validation.service";
import { recordLoginActivity, recordSession } from "@/services/account.service";
import { supabase } from "@/lib/supabase";

export type VendorSignupInput = {
  fullName: string;
  businessName: string;
  email: string;
  phone: string;
  password: string;
};

export type VendorAuthResult = { success: true } | { success: false; error: string };

/** `otpRequired` reflects whether Supabase actually gated this signup behind
 * email confirmation (project's "Confirm email" setting) — the caller uses
 * it to decide whether to show the OTP screen. */
export type StartVendorSignupResult = { success: true; otpRequired: boolean } | { success: false; error: string };

type VendorAuthContextValue = {
  vendor: VendorAccount | null;
  isLoading: boolean;
  isEmailTaken: (email: string) => Promise<boolean>;
  startSignup: (input: VendorSignupInput) => Promise<StartVendorSignupResult>;
  verifySignupOtp: (email: string, token: string, businessName: string) => Promise<VendorAuthResult>;
  resendSignupOtp: (email: string) => Promise<VendorAuthResult>;
  login: (email: string, password: string) => Promise<VendorAuthResult>;
  logout: () => void;
  setVendorAvatar: (url: string) => void;
};

const VendorAuthContext = createContext<VendorAuthContextValue | null>(null);

type VendorProfileJoin = { business_name: string; logo_url: string | null };

type VendorSessionRow = {
  role: "customer" | "vendor" | "admin";
  full_name: string | null;
  phone: string | null;
  avatar_url: string | null;
  created_at: string;
  vendor_profiles: VendorProfileJoin | VendorProfileJoin[] | null;
};

function firstVendorProfile(joined: VendorSessionRow["vendor_profiles"]): VendorProfileJoin | null {
  if (!joined) return null;
  return Array.isArray(joined) ? (joined[0] ?? null) : joined;
}

function toVendorAccount(authUser: { id: string; email?: string | null }, row: VendorSessionRow): VendorAccount {
  const businessProfile = firstVendorProfile(row.vendor_profiles);
  return {
    id: authUser.id,
    fullName: row.full_name ?? "",
    businessName: businessProfile?.business_name ?? "",
    email: authUser.email ?? "",
    phone: row.phone ?? "",
    // The store logo is the vendor's visual identity across the app (navbar,
    // dashboard headers) — falls back to the personal profile photo if no
    // logo has been uploaded yet.
    avatar: businessProfile?.logo_url ?? row.avatar_url,
    createdAt: row.created_at.slice(0, 10),
  };
}

async function fetchVendorSession(userId: string): Promise<VendorSessionRow | null> {
  const { data, error } = await supabase
    .from("profiles")
    .select("role, full_name, phone, avatar_url, created_at, vendor_profiles(business_name, logo_url)")
    .eq("id", userId)
    .single();
  if (error || !data) return null;
  return data as unknown as VendorSessionRow;
}

/** Seeds a minimal vendor_profiles row now (shop_name/slug are required +
 * unique) — Step 2-4 of the registration wizard fills in the real business
 * details a moment later via VendorContext.addVendor(). Requires an
 * authenticated session (RLS: auth.uid() = id), so this only runs once the
 * account is confirmed. */
async function seedVendorProfile(userId: string, businessName: string) {
  await supabase.from("vendor_profiles").upsert({
    id: userId,
    business_name: businessName,
    shop_name: businessName,
    slug: `vendor-${userId}`,
  });
}

/**
 * Real Supabase Auth-backed vendor session, kept in a separate context from
 * the customer `AuthContext` for the same reason as before: a vendor and a
 * customer session must never collide. Identity now lives in the same
 * `auth.users` table as customers (role = 'vendor' in `profiles`), but the
 * two contexts still read/write completely independently.
 */
export function VendorAuthProvider({ children }: { children: ReactNode }) {
  const [vendor, setVendor] = useState<VendorAccount | null>(null);
  const [isLoading, setIsLoading] = useState(true);

  useEffect(() => {
    let active = true;

    supabase.auth.getSession().then(async ({ data: { session } }) => {
      if (!active) return;
      if (session?.user) {
        const row = await fetchVendorSession(session.user.id);
        if (active && row?.role === "vendor") setVendor(toVendorAccount(session.user, row));
      }
      if (active) setIsLoading(false);
    });

    const { data: listener } = supabase.auth.onAuthStateChange(async (_event, session) => {
      if (!active) return;
      if (!session?.user) {
        setVendor(null);
        return;
      }
      const row = await fetchVendorSession(session.user.id);
      if (!active) return;
      setVendor(row?.role === "vendor" ? toVendorAccount(session.user, row) : null);
    });

    return () => {
      active = false;
      listener.subscription.unsubscribe();
    };
  }, []);

  const isEmailTaken = useCallback(async (email: string) => {
    const normalized = email.trim().toLowerCase();
    if (!normalized) return false;
    const { data } = await supabase.rpc("is_email_registered", { check_email: normalized });
    return Boolean(data);
  }, []);

  /**
   * Creates the Supabase Auth user for the vendor but doesn't sign them in
   * yet — `enable_confirmations` is on (see supabase/config.toml), so this
   * sends a 6-digit OTP to their email instead of returning a session. The
   * account (and the seed vendor_profiles row) is only finalized once
   * `verifySignupOtp` succeeds, in Step 1 of the registration wizard.
   */
  const startSignup = useCallback(async (input: VendorSignupInput): Promise<StartVendorSignupResult> => {
    const fullName = input.fullName.trim();
    const businessName = input.businessName.trim();
    const email = input.email.trim();
    const phone = input.phone.trim();
    const password = input.password;

    if (!fullName || !businessName || !email || !phone || !password) {
      return { success: false, error: "Please fill in all required fields." };
    }

    if (!isValidEmail(email)) {
      return { success: false, error: "Please enter a valid email address." };
    }

    const passwordError = getPasswordStrengthError(password);
    if (passwordError) {
      return { success: false, error: passwordError };
    }

    const { data, error } = await supabase.auth.signUp({
      email,
      password,
      options: { data: { role: "vendor", full_name: fullName, phone } },
    });

    if (error) {
      const message = error.message.toLowerCase().includes("already registered")
        ? "A vendor account with this email already exists."
        : error.message;
      return { success: false, error: message };
    }

    if (data.user && data.user.identities && data.user.identities.length === 0) {
      return { success: false, error: "A vendor account with this email already exists." };
    }

    if (!data.user) {
      return { success: false, error: "Something went wrong creating your account." };
    }

    // A session came back immediately — the project's "Confirm email"
    // setting is off, so there's no OTP to send; finalize right away like
    // signup used to work.
    if (data.session) {
      await seedVendorProfile(data.user.id, businessName);
      const row = await fetchVendorSession(data.user.id);
      if (row?.role === "vendor") setVendor(toVendorAccount(data.user, row));
      await Promise.all([recordLoginActivity(data.user.id, true), recordSession(data.user.id)]);
      return { success: true, otpRequired: false };
    }

    return { success: true, otpRequired: true };
  }, []);

  /**
   * Confirms the signup OTP and finalizes the vendor account — the session
   * (and the seed vendor_profiles row, needed before RLS allows writes to
   * it) is only created here. Step 2-4 of the registration wizard fills in
   * the real business details afterwards via VendorContext.addVendor().
   */
  const verifySignupOtp = useCallback(
    async (email: string, token: string, businessName: string): Promise<VendorAuthResult> => {
      const { data, error } = await supabase.auth.verifyOtp({
        email: email.trim(),
        token: token.trim(),
        type: "signup",
      });

      if (error || !data.user) {
        return { success: false, error: error?.message ?? "Invalid or expired code. Please try again." };
      }

      await seedVendorProfile(data.user.id, businessName);

      const row = await fetchVendorSession(data.user.id);
      if (row?.role === "vendor") setVendor(toVendorAccount(data.user, row));
      await Promise.all([recordLoginActivity(data.user.id, true), recordSession(data.user.id)]);

      return { success: true };
    },
    []
  );

  const resendSignupOtp = useCallback(async (email: string): Promise<VendorAuthResult> => {
    const { error } = await supabase.auth.resend({ type: "signup", email: email.trim() });
    if (error) {
      return { success: false, error: error.message };
    }
    return { success: true };
  }, []);

  const login = useCallback(async (email: string, password: string): Promise<VendorAuthResult> => {
    const trimmedEmail = email.trim();

    if (!trimmedEmail || !password) {
      return { success: false, error: "Please enter your email and password." };
    }

    const { data, error } = await supabase.auth.signInWithPassword({ email: trimmedEmail, password });

    if (error || !data.user) {
      return { success: false, error: "Incorrect email or password." };
    }

    const row = await fetchVendorSession(data.user.id);
    if (!row) {
      await supabase.auth.signOut();
      return { success: false, error: "Something went wrong loading your account. Please try again." };
    }
    if (row.role !== "vendor") {
      await supabase.auth.signOut();
      return { success: false, error: "This email is registered as a customer account. Please use the customer login page." };
    }

    setVendor(toVendorAccount(data.user, row));
    await Promise.all([recordLoginActivity(data.user.id, true), recordSession(data.user.id)]);

    return { success: true };
  }, []);

  const logout = useCallback(() => {
    setVendor(null);
    void supabase.auth.signOut();
  }, []);

  /** Reflects a freshly-uploaded store logo into the live session immediately, without waiting for a refetch. */
  const setVendorAvatar = useCallback((url: string) => {
    setVendor((prev) => (prev ? { ...prev, avatar: url } : prev));
  }, []);

  const value = useMemo(
    () => ({
      vendor,
      isLoading,
      isEmailTaken,
      startSignup,
      verifySignupOtp,
      resendSignupOtp,
      login,
      logout,
      setVendorAvatar,
    }),
    [vendor, isLoading, isEmailTaken, startSignup, verifySignupOtp, resendSignupOtp, login, logout, setVendorAvatar]
  );

  return <VendorAuthContext.Provider value={value}>{children}</VendorAuthContext.Provider>;
}

export function useVendorAuth() {
  const context = useContext(VendorAuthContext);
  if (!context) {
    throw new Error("useVendorAuth must be used within a VendorAuthProvider");
  }
  return context;
}
