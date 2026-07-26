"use client";

import { useState } from "react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { ArrowLeft, ArrowRight, CheckCircle2, Eye, EyeOff, Loader2, Lock, Mail, Store, User } from "lucide-react";
import { useVendorAuth } from "@/app/context/VendorAuthContext";
import { isValidEmail } from "@/services/validation.service";
import { sendPasswordResetEmail } from "@/services/password-reset.service";

const inputClass =
  "w-full rounded-lg border border-outline-variant bg-surface py-3 pl-10 pr-4 text-sm text-foreground outline-none transition-all focus:border-primary focus:ring-2 focus:ring-secondary-container/50";

export default function VendorLoginPage() {
  const [view, setView] = useState<"login" | "forgot">("login");
  const [showPassword, setShowPassword] = useState(false);
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [error, setError] = useState<string | null>(null);
  const { login } = useVendorAuth();
  const router = useRouter();
  const year = new Date().getFullYear();

  const [resetEmail, setResetEmail] = useState("");
  const [resetError, setResetError] = useState<string | null>(null);
  const [resetSubmitting, setResetSubmitting] = useState(false);
  const [resetSent, setResetSent] = useState(false);

  const handleSubmit = async (event: React.FormEvent) => {
    event.preventDefault();
    setError(null);

    if (!email.trim() || !password) {
      setError("Please enter your email and password.");
      return;
    }

    const result = await login(email, password);

    if (!result.success) {
      setError(result.error);
      return;
    }

    router.push("/vendor/dashboard");
  };

  const handleResetSubmit = async (event: React.FormEvent) => {
    event.preventDefault();
    setResetError(null);

    if (!resetEmail.trim()) {
      setResetError("Please enter your registered email address.");
      return;
    }
    if (!isValidEmail(resetEmail)) {
      setResetError("Please enter a valid email address.");
      return;
    }

    setResetSubmitting(true);
    const result = await sendPasswordResetEmail(resetEmail);
    setResetSubmitting(false);

    if (!result.success) {
      setResetError(result.error);
      return;
    }
    setResetSent(true);
  };

  const backToLogin = () => {
    setView("login");
    setResetSent(false);
    setResetError(null);
    setResetEmail("");
  };

  return (
    <div className="flex min-h-screen flex-col bg-background">
      <header className="sticky top-0 z-50 flex w-full items-center justify-between bg-surface px-4 py-3 shadow-[0px_12px_32px_rgba(0,0,0,0.12)] sm:px-6">
        <span className="text-xl font-bold text-primary sm:text-2xl">EcoMarket</span>
        <Link
          href="/"
          className="flex items-center gap-1.5 text-sm font-medium text-on-surface-variant transition-colors hover:text-primary"
        >
          <ArrowLeft aria-hidden="true" className="h-4 w-4" />
          Back to Marketplace
        </Link>
      </header>

      <main className="flex flex-grow items-center justify-center px-4 py-12 sm:px-6">
        <div className="w-full max-w-[480px] overflow-hidden rounded-2xl border border-outline-variant bg-white shadow-[0px_12px_32px_rgba(0,0,0,0.08)]">
          {view === "login" ? (
            <>
              <div className="flex flex-col items-center gap-2 px-6 pt-8 text-center sm:px-8">
                <div className="mb-2 flex h-16 w-16 items-center justify-center rounded-full bg-secondary-container">
                  <Store aria-hidden="true" className="h-8 w-8 text-primary" />
                </div>
                <h1 className="text-2xl font-bold text-foreground">Vendor Portal Login</h1>
                <p className="max-w-[320px] text-sm text-on-surface-variant">
                  Access your store dashboard, inventory, and sales analytics.
                </p>
              </div>

              <form className="flex flex-col gap-4 px-6 pb-8 pt-6 sm:px-8" onSubmit={handleSubmit}>
                <div className="space-y-1.5">
                  <label htmlFor="vendor-id" className="text-sm font-medium text-foreground">
                    Registered Email / Store ID
                  </label>
                  <div className="relative">
                    <User
                      aria-hidden="true"
                      className="pointer-events-none absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-on-surface-variant"
                    />
                    <input
                      id="vendor-id"
                      type="text"
                      placeholder="email@store.com or EM-12345"
                      value={email}
                      onChange={(event) => setEmail(event.target.value)}
                      className={inputClass}
                    />
                  </div>
                </div>

                <div className="space-y-1.5">
                  <label htmlFor="vendor-password" className="text-sm font-medium text-foreground">
                    Password
                  </label>
                  <div className="relative">
                    <Lock
                      aria-hidden="true"
                      className="pointer-events-none absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-on-surface-variant"
                    />
                    <input
                      id="vendor-password"
                      type={showPassword ? "text" : "password"}
                      placeholder="••••••••"
                      value={password}
                      onChange={(event) => setPassword(event.target.value)}
                      className={`${inputClass} pr-10`}
                    />
                    <button
                      type="button"
                      aria-label={showPassword ? "Hide password" : "Show password"}
                      onClick={() => setShowPassword((value) => !value)}
                      className="absolute right-3 top-1/2 -translate-y-1/2 text-on-surface-variant transition-colors hover:text-primary"
                    >
                      {showPassword ? (
                        <EyeOff aria-hidden="true" className="h-4 w-4" />
                      ) : (
                        <Eye aria-hidden="true" className="h-4 w-4" />
                      )}
                    </button>
                  </div>
                </div>

                <div className="flex items-center justify-between py-1">
                  <label htmlFor="remember-store" className="flex cursor-pointer items-center gap-2">
                    <input
                      id="remember-store"
                      type="checkbox"
                      className="h-[18px] w-[18px] rounded border-outline-variant accent-primary"
                    />
                    <span className="text-sm text-on-surface-variant">Remember Store Session</span>
                  </label>
                  <button
                    type="button"
                    onClick={() => setView("forgot")}
                    className="text-sm font-semibold text-primary hover:underline"
                  >
                    Forgot Vendor Password?
                  </button>
                </div>

                {error && (
                  <p role="alert" className="text-sm font-medium text-red-600">
                    {error}
                  </p>
                )}

                <button
                  type="submit"
                  className="flex w-full items-center justify-center gap-2 rounded-lg bg-primary py-3 text-sm font-semibold text-white shadow-md transition-all hover:bg-on-surface-variant active:scale-[0.98]"
                >
                  Login to Seller Dashboard
                  <ArrowRight aria-hidden="true" className="h-4 w-4" />
                </button>

                <div className="border-t border-outline-variant pt-4 text-center">
                  <p className="text-sm text-on-surface-variant">
                    Want to start selling with us?{" "}
                    <Link href="/vendor/register" className="font-bold text-primary hover:underline">
                      Register as a Vendor
                    </Link>
                  </p>
                </div>
              </form>
            </>
          ) : resetSent ? (
            <div className="flex flex-col items-center gap-3 px-6 py-10 text-center sm:px-8">
              <div className="mb-1 flex h-16 w-16 items-center justify-center rounded-full bg-secondary-container">
                <CheckCircle2 aria-hidden="true" className="h-8 w-8 text-primary" />
              </div>
              <h1 className="text-2xl font-bold text-foreground">Check Your Email</h1>
              <p className="max-w-[320px] text-sm text-on-surface-variant">
                If a vendor account exists for <span className="font-medium text-foreground">{resetEmail}</span>, we&apos;ve
                sent a link to reset your password.
              </p>
              <button
                type="button"
                onClick={backToLogin}
                className="mt-4 w-full rounded-lg bg-primary py-3 text-sm font-semibold text-white shadow-md transition-all hover:bg-on-surface-variant active:scale-[0.98]"
              >
                Back to Login
              </button>
            </div>
          ) : (
            <>
              <div className="flex flex-col items-center gap-2 px-6 pt-8 text-center sm:px-8">
                <div className="mb-2 flex h-16 w-16 items-center justify-center rounded-full bg-secondary-container">
                  <Mail aria-hidden="true" className="h-8 w-8 text-primary" />
                </div>
                <h1 className="text-2xl font-bold text-foreground">Reset Vendor Password</h1>
                <p className="max-w-[320px] text-sm text-on-surface-variant">
                  Enter your registered vendor email and we&apos;ll send you a reset link.
                </p>
              </div>

              <form className="flex flex-col gap-4 px-6 pb-8 pt-6 sm:px-8" onSubmit={handleResetSubmit}>
                <div className="space-y-1.5">
                  <label htmlFor="vendor-reset-email" className="text-sm font-medium text-foreground">
                    Registered Email
                  </label>
                  <div className="relative">
                    <Mail
                      aria-hidden="true"
                      className="pointer-events-none absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-on-surface-variant"
                    />
                    <input
                      id="vendor-reset-email"
                      type="text"
                      placeholder="email@store.com"
                      value={resetEmail}
                      onChange={(event) => setResetEmail(event.target.value)}
                      className={inputClass}
                    />
                  </div>
                </div>

                {resetError && (
                  <p role="alert" className="text-sm font-medium text-red-600">
                    {resetError}
                  </p>
                )}

                <button
                  type="submit"
                  disabled={resetSubmitting}
                  className="flex w-full items-center justify-center gap-2 rounded-lg bg-primary py-3 text-sm font-semibold text-white shadow-md transition-all hover:bg-on-surface-variant active:scale-[0.98] disabled:opacity-60"
                >
                  {resetSubmitting && <Loader2 aria-hidden="true" className="h-4 w-4 animate-spin" />}
                  Send Reset Link
                </button>

                <div className="border-t border-outline-variant pt-4 text-center">
                  <button type="button" onClick={backToLogin} className="text-sm font-bold text-primary hover:underline">
                    Back to Login
                  </button>
                </div>
              </form>
            </>
          )}
        </div>
      </main>

      <footer className="flex w-full flex-col items-center gap-4 border-t border-outline-variant bg-surface px-4 py-6 sm:flex-row sm:justify-between sm:px-6">
        <div className="flex flex-col items-center gap-1 sm:items-start">
          <span className="text-lg font-bold text-foreground">EcoMarket</span>
          <span className="text-xs text-on-surface-variant">
            © {year} EcoMarket Vendor Portal. All rights reserved.
          </span>
        </div>
        <div className="flex flex-wrap justify-center gap-6">
          <a
            href="#"
            className="text-xs text-on-surface-variant transition-colors hover:text-primary hover:underline"
          >
            Vendor Guidelines
          </a>
          <a
            href="#"
            className="text-xs text-on-surface-variant transition-colors hover:text-primary hover:underline"
          >
            Support Center
          </a>
          <a
            href="#"
            className="text-xs text-on-surface-variant transition-colors hover:text-primary hover:underline"
          >
            Terms of Service
          </a>
          <a
            href="#"
            className="text-xs text-on-surface-variant transition-colors hover:text-primary hover:underline"
          >
            Privacy Policy
          </a>
        </div>
      </footer>
    </div>
  );
}
