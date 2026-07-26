"use client";

import { CheckCircle2, Loader2, Mail } from "lucide-react";
import { useState } from "react";
import { isValidEmail } from "@/services/validation.service";
import { sendPasswordResetEmail } from "@/services/password-reset.service";

const inputClass =
  "w-full rounded-lg border border-outline-variant bg-surface py-3 pl-10 pr-4 text-sm text-foreground outline-none transition-all focus:border-primary focus:ring-2 focus:ring-secondary-container/50";

type ForgotPasswordFormProps = {
  onSwitchToLogin: () => void;
};

export function ForgotPasswordForm({ onSwitchToLogin }: ForgotPasswordFormProps) {
  const [email, setEmail] = useState("");
  const [error, setError] = useState<string | null>(null);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [isSent, setIsSent] = useState(false);

  const handleSubmit = async (event: React.FormEvent) => {
    event.preventDefault();
    setError(null);

    if (!email.trim()) {
      setError("Please enter your email address.");
      return;
    }
    if (!isValidEmail(email)) {
      setError("Please enter a valid email address.");
      return;
    }

    setIsSubmitting(true);
    const result = await sendPasswordResetEmail(email);
    setIsSubmitting(false);

    if (!result.success) {
      setError(result.error);
      return;
    }
    setIsSent(true);
  };

  if (isSent) {
    return (
      <div className="text-center">
        <div className="mx-auto mb-4 flex h-14 w-14 items-center justify-center rounded-full bg-secondary-container">
          <CheckCircle2 aria-hidden="true" className="h-7 w-7 text-primary" />
        </div>
        <h1 className="text-2xl font-bold text-foreground">Check Your Email</h1>
        <p className="mt-2 text-sm text-on-surface-variant">
          If an account exists for <span className="font-medium text-foreground">{email}</span>, we&apos;ve sent a link to
          reset your password.
        </p>
        <button
          type="button"
          onClick={onSwitchToLogin}
          className="mt-6 w-full rounded-lg bg-primary py-3 text-sm font-semibold text-white shadow-md transition-all hover:bg-on-surface-variant active:scale-[0.98]"
        >
          Back to Login
        </button>
      </div>
    );
  }

  return (
    <div>
      <div className="mb-6">
        <h1 className="text-3xl font-bold text-foreground">Forgot Password?</h1>
        <p className="mt-1 text-on-surface-variant">Enter your email and we&apos;ll send you a reset link.</p>
      </div>

      <form className="space-y-3" onSubmit={handleSubmit}>
        <div className="space-y-1.5">
          <label htmlFor="email-forgot" className="text-sm font-medium text-foreground">
            Email
          </label>
          <div className="relative">
            <Mail
              aria-hidden="true"
              className="pointer-events-none absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-outline"
            />
            <input
              id="email-forgot"
              type="text"
              placeholder="name@example.com"
              value={email}
              onChange={(event) => setEmail(event.target.value)}
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
          Send Reset Link
        </button>
      </form>

      <p className="mt-6 text-center text-sm text-on-surface-variant">
        Remembered your password?{" "}
        <button type="button" onClick={onSwitchToLogin} className="font-bold text-primary hover:underline">
          Back to Login
        </button>
      </p>
    </div>
  );
}
