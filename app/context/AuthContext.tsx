"use client";

import { createContext, useCallback, useContext, useEffect, useMemo, useState, type ReactNode } from "react";
import type { Customer } from "@/data/customers";
import { getPasswordStrengthError, isValidEmail } from "@/services/validation.service";

const ACCOUNTS_STORAGE_KEY = "ecomarket_accounts";
const SESSION_STORAGE_KEY = "ecomarket_session_user_id";

/** What's actually persisted to localStorage — includes the password, unlike the public Customer shape. */
type StoredAccount = Customer & { password: string };

export type SignupInput = {
  name: string;
  email: string;
  phone: string;
  password: string;
};

export type AuthResult = { success: true } | { success: false; error: string };

export type ProfileUpdate = Partial<Pick<Customer, "name" | "email" | "phone" | "avatar">>;

type AuthContextValue = {
  user: Customer | null;
  isLoading: boolean;
  signup: (input: SignupInput) => AuthResult;
  login: (identifier: string, password: string) => AuthResult;
  logout: () => void;
  updateProfile: (updates: ProfileUpdate) => void;
};

const AuthContext = createContext<AuthContextValue | null>(null);

function readAccounts(): StoredAccount[] {
  try {
    const raw = window.localStorage.getItem(ACCOUNTS_STORAGE_KEY);
    return raw ? (JSON.parse(raw) as StoredAccount[]) : [];
  } catch {
    return [];
  }
}

function writeAccounts(accounts: StoredAccount[]) {
  window.localStorage.setItem(ACCOUNTS_STORAGE_KEY, JSON.stringify(accounts));
}

function toPublicUser(account: StoredAccount): Customer {
  const { password: _password, ...publicUser } = account;
  return publicUser;
}

/**
 * Local-only auth: registered accounts and the active session both live in
 * localStorage. Swap the bodies of signup/login/logout for real API calls
 * once a backend exists — every page reads the session through this context.
 */
export function AuthProvider({ children }: { children: ReactNode }) {
  const [user, setUser] = useState<Customer | null>(null);
  const [isLoading, setIsLoading] = useState(true);

  useEffect(() => {
    const accounts = readAccounts();
    const sessionId = window.localStorage.getItem(SESSION_STORAGE_KEY);
    const account = sessionId ? accounts.find((candidate) => candidate.id === sessionId) : undefined;
    setUser(account ? toPublicUser(account) : null);
    setIsLoading(false);
  }, []);

  const signup = useCallback((input: SignupInput): AuthResult => {
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

    const accounts = readAccounts();

    if (email && accounts.some((account) => account.email.trim().toLowerCase() === email.toLowerCase())) {
      return { success: false, error: "An account with this email already exists." };
    }

    if (phone && accounts.some((account) => account.phone.trim() === phone)) {
      return { success: false, error: "An account with this phone number already exists." };
    }

    const newAccount: StoredAccount = {
      id: crypto.randomUUID(),
      name,
      email,
      phone,
      password,
      avatar: null,
      joinedDate: new Date().toISOString().slice(0, 10),
      addresses: [],
      wishlist: [],
    };

    writeAccounts([...accounts, newAccount]);
    window.localStorage.setItem(SESSION_STORAGE_KEY, newAccount.id);
    setUser(toPublicUser(newAccount));

    return { success: true };
  }, []);

  const login = useCallback((identifier: string, password: string): AuthResult => {
    const trimmedIdentifier = identifier.trim();

    if (!trimmedIdentifier || !password) {
      return { success: false, error: "Please enter your email/phone and password." };
    }

    const normalizedIdentifier = trimmedIdentifier.toLowerCase();
    const accounts = readAccounts();
    const account = accounts.find(
      (candidate) =>
        (candidate.email.trim().toLowerCase() === normalizedIdentifier || candidate.phone.trim() === trimmedIdentifier) &&
        candidate.password === password
    );

    if (!account) {
      return { success: false, error: "Invalid email/phone or password." };
    }

    window.localStorage.setItem(SESSION_STORAGE_KEY, account.id);
    setUser(toPublicUser(account));

    return { success: true };
  }, []);

  const logout = useCallback(() => {
    window.localStorage.removeItem(SESSION_STORAGE_KEY);
    setUser(null);
  }, []);

  /** Updates both the persisted account record and the live session in one go. */
  const updateProfile = useCallback(
    (updates: ProfileUpdate) => {
      if (!user) return;

      const accounts = readAccounts();
      const nextAccounts = accounts.map((account) =>
        account.id === user.id ? { ...account, ...updates } : account
      );
      writeAccounts(nextAccounts);
      setUser({ ...user, ...updates });
    },
    [user]
  );

  const value = useMemo(
    () => ({ user, isLoading, signup, login, logout, updateProfile }),
    [user, isLoading, signup, login, logout, updateProfile]
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
