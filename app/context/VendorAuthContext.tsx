"use client";

import { createContext, useCallback, useContext, useEffect, useMemo, useState, type ReactNode } from "react";
import type { VendorAccount } from "@/app/types/vendor";
import { getPasswordStrengthError, isValidEmail } from "@/services/validation.service";

const VENDOR_ACCOUNTS_STORAGE_KEY = "ecomarket_vendor_accounts";
const VENDOR_SESSION_STORAGE_KEY = "ecomarket_vendor_session_id";

/** What's actually persisted to localStorage — includes the password, unlike the public VendorAccount shape. */
type StoredVendorAccount = VendorAccount & { password: string };

export type VendorSignupInput = {
  fullName: string;
  businessName: string;
  email: string;
  phone: string;
  password: string;
};

export type VendorAuthResult = { success: true } | { success: false; error: string };

type VendorAuthContextValue = {
  vendor: VendorAccount | null;
  isLoading: boolean;
  isEmailTaken: (email: string) => boolean;
  signup: (input: VendorSignupInput) => VendorAuthResult;
  login: (email: string, password: string) => VendorAuthResult;
  logout: () => void;
};

const VendorAuthContext = createContext<VendorAuthContextValue | null>(null);

function readVendorAccounts(): StoredVendorAccount[] {
  try {
    const raw = window.localStorage.getItem(VENDOR_ACCOUNTS_STORAGE_KEY);
    return raw ? (JSON.parse(raw) as StoredVendorAccount[]) : [];
  } catch {
    return [];
  }
}

function writeVendorAccounts(accounts: StoredVendorAccount[]) {
  window.localStorage.setItem(VENDOR_ACCOUNTS_STORAGE_KEY, JSON.stringify(accounts));
}

function toPublicVendor(account: StoredVendorAccount): VendorAccount {
  const { password: _password, ...publicVendor } = account;
  return publicVendor;
}

/**
 * Local-only vendor auth: registered vendor accounts and the active vendor
 * session both live in localStorage, under keys entirely separate from the
 * customer AuthContext, so a vendor and a customer session can never collide
 * and a vendor can never log in with customer credentials (or vice versa).
 * Swap the bodies of signup/login/logout for real API calls once a backend
 * exists — every vendor page reads the session through this context.
 */
export function VendorAuthProvider({ children }: { children: ReactNode }) {
  const [vendor, setVendor] = useState<VendorAccount | null>(null);
  const [isLoading, setIsLoading] = useState(true);

  useEffect(() => {
    const accounts = readVendorAccounts();
    const sessionId = window.localStorage.getItem(VENDOR_SESSION_STORAGE_KEY);
    const account = sessionId ? accounts.find((candidate) => candidate.id === sessionId) : undefined;
    setVendor(account ? toPublicVendor(account) : null);
    setIsLoading(false);
  }, []);

  const isEmailTaken = useCallback((email: string) => {
    const normalized = email.trim().toLowerCase();
    if (!normalized) return false;
    return readVendorAccounts().some((account) => account.email.trim().toLowerCase() === normalized);
  }, []);

  const signup = useCallback((input: VendorSignupInput): VendorAuthResult => {
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

    const accounts = readVendorAccounts();
    const normalizedEmail = email.toLowerCase();

    if (accounts.some((account) => account.email.trim().toLowerCase() === normalizedEmail)) {
      return { success: false, error: "A vendor account with this email already exists." };
    }

    const newAccount: StoredVendorAccount = {
      id: crypto.randomUUID(),
      fullName,
      businessName,
      email,
      phone,
      password,
      createdAt: new Date().toISOString().slice(0, 10),
    };

    writeVendorAccounts([...accounts, newAccount]);
    window.localStorage.setItem(VENDOR_SESSION_STORAGE_KEY, newAccount.id);
    setVendor(toPublicVendor(newAccount));

    return { success: true };
  }, []);

  const login = useCallback((email: string, password: string): VendorAuthResult => {
    const trimmedEmail = email.trim();

    if (!trimmedEmail || !password) {
      return { success: false, error: "Please enter your email and password." };
    }

    const normalizedEmail = trimmedEmail.toLowerCase();
    const accounts = readVendorAccounts();
    const account = accounts.find((candidate) => candidate.email.trim().toLowerCase() === normalizedEmail);

    if (!account || account.password !== password) {
      return { success: false, error: "Incorrect email or password." };
    }

    window.localStorage.setItem(VENDOR_SESSION_STORAGE_KEY, account.id);
    setVendor(toPublicVendor(account));

    return { success: true };
  }, []);

  const logout = useCallback(() => {
    window.localStorage.removeItem(VENDOR_SESSION_STORAGE_KEY);
    setVendor(null);
  }, []);

  const value = useMemo(
    () => ({ vendor, isLoading, isEmailTaken, signup, login, logout }),
    [vendor, isLoading, isEmailTaken, signup, login, logout]
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
