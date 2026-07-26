"use client";

import { AlertTriangle, CheckCircle2, Eye, EyeOff, Loader2, Lock } from "lucide-react";
import { useRouter } from "next/navigation";
import { useEffect, useState } from "react";
import { AuthHeader } from "@/app/components/auth/AuthHeader";
import { supabase } from "@/lib/supabase";
import { getPasswordStrengthError } from "@/services/validation.service";
import { fetchRoleForRedirect, updatePasswordAfterReset } from "@/services/password-reset.service";

const inputClass =
  "w-full rounded-lg border border-outline-variant bg-surface py-3 pl-10 pr-10 text-sm text-foreground outline-none transition-all focus:border-primary focus:ring-2 focus:ring-secondary-container/50";

type SessionState = "checking" | "valid" | "invalid";

export default function ResetPasswordPage() {
  const router = useRouter();
  const [sessionState, setSessionState] = useState<SessionState>("checking");

  const [password, setPassword] = useState("");
  const [confirmPassword, setConfirmPassword] = useState("");
  const [showPassword, setShowPassword] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [isDone, setIsDone] = useState(false);

  useEffect(() => {
    let active = true;

    // The recovery link's token is parsed from the URL by the Supabase
    // client automatically; this fires once that's done and a real
    // recovery session has been established.
    const { data: listener } = supabase.auth.onAuthStateChange((event, session) => {
      if (!active) return;
      if (event === "PASSWORD_RECOVERY" && session) {
        setSessionState("valid");
      }
    });

    supabase.auth.getSession().then(({ data: { session } }) => {
      if (!active) return;
      if (session) setSessionState("valid");
      else setSessionState((current) => (current === "checking" ? "invalid" : current));
    });

    const timeout = setTimeout(() => {
      if (active) setSessionState((current) => (current === "checking" ? "invalid" : current));
    }, 4000);

    return () => {
      active = false;
      clearTimeout(timeout);
      listener.subscription.unsubscribe();
    };
  }, []);

  const handleSubmit = async (event: React.FormEvent) => {
    event.preventDefault();
    setError(null);

    const strengthError = getPasswordStrengthError(password);
    if (strengthError) {
      setError(strengthError);
      return;
    }
    if (password !== confirmPassword) {
      setError("Passwords do not match.");
      return;
    }

    setIsSubmitting(true);
    const result = await updatePasswordAfterReset(password);

    if (!result.success) {
      setIsSubmitting(false);
      setError(result.error);
      return;
    }

    const role = await fetchRoleForRedirect();
    await supabase.auth.signOut({ scope: "local" });
    setIsSubmitting(false);
    setIsDone(true);

    const destination = role === "vendor" ? "/vendor/login" : "/login";
    setTimeout(() => router.push(destination), 2000);
  };

  return (
    <div className="flex min-h-screen flex-col overflow-x-hidden bg-background">
      <AuthHeader />

      <main className="flex flex-grow items-center justify-center px-4 py-12 sm:px-6">
        <div className="w-full max-w-[480px]">
          <div className="overflow-hidden rounded-2xl border border-outline-variant/30 bg-white p-6 shadow-[0px_12px_32px_rgba(0,0,0,0.08)] sm:p-8">
            {sessionState === "checking" && (
              <div className="flex flex-col items-center gap-3 py-10 text-center">
                <Loader2 aria-hidden="true" className="h-8 w-8 animate-spin text-primary" />
                <p className="text-sm text-on-surface-variant">Verifying your reset link…</p>
              </div>
            )}

            {sessionState === "invalid" && (
              <div className="flex flex-col items-center gap-3 text-center">
                <div className="mb-1 flex h-14 w-14 items-center justify-center rounded-full bg-red-100">
                  <AlertTriangle aria-hidden="true" className="h-7 w-7 text-red-600" />
                </div>
                <h1 className="text-2xl font-bold text-foreground">Link Invalid or Expired</h1>
                <p className="max-w-[320px] text-sm text-on-surface-variant">
                  This password reset link is no longer valid. Please request a new one.
                </p>
                <div className="mt-4 flex w-full flex-col gap-2">
                  <a
                    href="/login"
                    className="w-full rounded-lg bg-primary py-3 text-center text-sm font-semibold text-white shadow-md transition-all hover:bg-on-surface-variant active:scale-[0.98]"
                  >
                    Back to Customer Login
                  </a>
                  <a
                    href="/vendor/login"
                    className="w-full rounded-lg border border-outline-variant py-3 text-center text-sm font-semibold text-foreground transition-colors hover:bg-surface-container"
                  >
                    Back to Vendor Login
                  </a>
                </div>
              </div>
            )}

            {sessionState === "valid" && isDone && (
              <div className="flex flex-col items-center gap-3 text-center">
                <div className="mb-1 flex h-14 w-14 items-center justify-center rounded-full bg-secondary-container">
                  <CheckCircle2 aria-hidden="true" className="h-7 w-7 text-primary" />
                </div>
                <h1 className="text-2xl font-bold text-foreground">Password Updated</h1>
                <p className="max-w-[320px] text-sm text-on-surface-variant">
                  Your password has been changed successfully. Redirecting you to login…
                </p>
              </div>
            )}

            {sessionState === "valid" && !isDone && (
              <div>
                <div className="mb-6">
                  <h1 className="text-3xl font-bold text-foreground">Set New Password</h1>
                  <p className="mt-1 text-on-surface-variant">Choose a new password for your account.</p>
                </div>

                <form className="space-y-3" onSubmit={handleSubmit}>
                  <div className="space-y-1.5">
                    <label htmlFor="new-password" className="text-sm font-medium text-foreground">
                      New Password
                    </label>
                    <div className="relative">
                      <Lock
                        aria-hidden="true"
                        className="pointer-events-none absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-outline"
                      />
                      <input
                        id="new-password"
                        type={showPassword ? "text" : "password"}
                        placeholder="••••••••"
                        value={password}
                        onChange={(event) => setPassword(event.target.value)}
                        className={inputClass}
                      />
                      <button
                        type="button"
                        aria-label={showPassword ? "Hide password" : "Show password"}
                        onClick={() => setShowPassword((value) => !value)}
                        className="absolute right-3 top-1/2 -translate-y-1/2 text-outline transition-colors hover:text-foreground"
                      >
                        {showPassword ? <EyeOff aria-hidden="true" className="h-4 w-4" /> : <Eye aria-hidden="true" className="h-4 w-4" />}
                      </button>
                    </div>
                    <p className="ml-1 text-xs text-on-surface-variant">
                      At least 8 characters, with a letter and a number.
                    </p>
                  </div>

                  <div className="space-y-1.5">
                    <label htmlFor="confirm-new-password" className="text-sm font-medium text-foreground">
                      Confirm New Password
                    </label>
                    <div className="relative">
                      <Lock
                        aria-hidden="true"
                        className="pointer-events-none absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-outline"
                      />
                      <input
                        id="confirm-new-password"
                        type={showPassword ? "text" : "password"}
                        placeholder="••••••••"
                        value={confirmPassword}
                        onChange={(event) => setConfirmPassword(event.target.value)}
                        className={inputClass}
                      />
                    </div>
                  </div>

                  {error && (
                    <p role="alert" className="text-sm font-medium text-red-600">
                      {error}
                    </p>
                  )}

                  <button
                    type="submit"
                    disabled={isSubmitting}
                    className="mt-2 flex w-full items-center justify-center gap-2 rounded-lg bg-primary py-3 text-sm font-semibold text-white shadow-md transition-all hover:bg-on-surface-variant active:scale-[0.98] disabled:opacity-60"
                  >
                    {isSubmitting && <Loader2 aria-hidden="true" className="h-4 w-4 animate-spin" />}
                    Update Password
                  </button>
                </form>
              </div>
            )}
          </div>
        </div>
      </main>
    </div>
  );
}
