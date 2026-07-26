"use client";

import { motion } from "framer-motion";
import { CheckCircle2, Loader2, Mail, Pencil } from "lucide-react";
import { useEffect, useRef, useState } from "react";

const OTP_LENGTH = 6;
const RESEND_SECONDS = 60;

export type OtpActionResult = { success: true } | { success: false; error: string };

type EmailOtpVerificationProps = {
  email: string;
  onChangeEmail: () => void;
  onVerify: (code: string) => Promise<OtpActionResult>;
  onResend: () => Promise<OtpActionResult>;
};

/**
 * Inline 6-digit email OTP verification block, shared by the Customer
 * signup form and the Vendor registration wizard's Step 1 — both send a
 * Supabase Auth "signup" OTP and confirm it with this same UI/interaction.
 */
export function EmailOtpVerification({ email, onChangeEmail, onVerify, onResend }: EmailOtpVerificationProps) {
  const [digits, setDigits] = useState<string[]>(() => Array(OTP_LENGTH).fill(""));
  const [error, setError] = useState<string | null>(null);
  const [isVerifying, setIsVerifying] = useState(false);
  const [isResending, setIsResending] = useState(false);
  const [resendCooldown, setResendCooldown] = useState(RESEND_SECONDS);
  const [resendMessage, setResendMessage] = useState<string | null>(null);
  const inputRefs = useRef<Array<HTMLInputElement | null>>([]);

  useEffect(() => {
    requestAnimationFrame(() => inputRefs.current[0]?.focus());
  }, []);

  useEffect(() => {
    if (resendCooldown <= 0) return;
    const timer = window.setInterval(() => setResendCooldown((value) => value - 1), 1000);
    return () => window.clearInterval(timer);
  }, [resendCooldown]);

  const focusIndex = (index: number) => inputRefs.current[index]?.focus();

  const handleChange = (index: number, rawValue: string) => {
    const digit = rawValue.replace(/\D/g, "").slice(-1);
    setDigits((prev) => {
      const next = [...prev];
      next[index] = digit;
      return next;
    });
    setError(null);
    if (digit && index < OTP_LENGTH - 1) focusIndex(index + 1);
  };

  const handleKeyDown = (index: number, event: React.KeyboardEvent<HTMLInputElement>) => {
    if (event.key === "Backspace" && !digits[index] && index > 0) {
      focusIndex(index - 1);
    }
  };

  const handlePaste = (event: React.ClipboardEvent<HTMLInputElement>) => {
    const pasted = event.clipboardData.getData("text").replace(/\D/g, "").slice(0, OTP_LENGTH);
    if (!pasted) return;
    event.preventDefault();
    const next = Array(OTP_LENGTH).fill("");
    for (let i = 0; i < pasted.length; i += 1) next[i] = pasted[i];
    setDigits(next);
    focusIndex(Math.min(pasted.length, OTP_LENGTH - 1));
  };

  const handleVerify = async () => {
    const code = digits.join("");
    if (code.length < OTP_LENGTH) {
      setError("Please enter the full 6-digit code.");
      return;
    }
    setError(null);
    setResendMessage(null);
    setIsVerifying(true);
    const result = await onVerify(code);
    setIsVerifying(false);
    if (!result.success) {
      setError(result.error);
      setDigits(Array(OTP_LENGTH).fill(""));
      focusIndex(0);
    }
  };

  const handleResend = async () => {
    if (resendCooldown > 0 || isResending) return;
    setError(null);
    setResendMessage(null);
    setIsResending(true);
    const result = await onResend();
    setIsResending(false);
    if (!result.success) {
      setError(result.error);
      return;
    }
    setResendCooldown(RESEND_SECONDS);
    setResendMessage("A new code is on its way.");
    setDigits(Array(OTP_LENGTH).fill(""));
    focusIndex(0);
  };

  return (
    <motion.div
      initial={{ opacity: 0, y: 10 }}
      animate={{ opacity: 1, y: 0 }}
      exit={{ opacity: 0, y: -10 }}
      transition={{ duration: 0.3, ease: "easeOut" }}
    >
      <div className="rounded-xl border border-outline-variant/50 bg-surface-container-low p-4 sm:p-5">
        <div className="flex items-start gap-3">
          <div className="flex h-9 w-9 shrink-0 items-center justify-center rounded-full bg-secondary-container">
            <Mail aria-hidden="true" className="h-4 w-4 text-primary" />
          </div>
          <div className="min-w-0">
            <p className="text-sm font-medium text-foreground">
              We&apos;ve sent a 6-digit verification code to your email.
            </p>
            <p className="mt-0.5 flex flex-wrap items-center gap-x-1.5 gap-y-0.5 text-xs text-on-surface-variant">
              <span className="break-all font-semibold text-foreground">{email}</span>
              <button
                type="button"
                onClick={onChangeEmail}
                className="inline-flex items-center gap-1 font-semibold text-primary hover:underline"
              >
                <Pencil aria-hidden="true" className="h-3 w-3" />
                Change Email
              </button>
            </p>
          </div>
        </div>

        <div className="mt-4 flex justify-between gap-1.5 sm:gap-2">
          {digits.map((digit, index) => (
            <input
              key={index}
              ref={(el) => {
                inputRefs.current[index] = el;
              }}
              type="text"
              inputMode="numeric"
              autoComplete="one-time-code"
              maxLength={1}
              value={digit}
              onChange={(event) => handleChange(index, event.target.value)}
              onKeyDown={(event) => handleKeyDown(index, event)}
              onPaste={handlePaste}
              aria-label={`Digit ${index + 1} of verification code`}
              className="h-11 w-full min-w-0 rounded-lg border border-outline-variant bg-surface text-center text-lg font-bold text-foreground outline-none transition-all focus:border-primary focus:ring-2 focus:ring-secondary-container/50 sm:h-12 sm:text-xl"
            />
          ))}
        </div>

        {error && (
          <p role="alert" className="mt-3 text-sm font-medium text-red-600">
            {error}
          </p>
        )}
        {!error && resendMessage && (
          <p className="mt-3 flex items-center gap-1.5 text-sm font-medium text-primary">
            <CheckCircle2 aria-hidden="true" className="h-4 w-4" />
            {resendMessage}
          </p>
        )}

        <div className="mt-4 flex flex-col gap-2 sm:flex-row">
          <button
            type="button"
            onClick={handleVerify}
            disabled={isVerifying}
            className="flex h-11 flex-1 items-center justify-center gap-2 rounded-lg bg-primary text-sm font-semibold text-white shadow-md transition-all hover:bg-on-surface-variant active:scale-[0.98] disabled:cursor-not-allowed disabled:opacity-60"
          >
            {isVerifying && <Loader2 aria-hidden="true" className="h-4 w-4 animate-spin" />}
            Verify Code
          </button>
          <button
            type="button"
            onClick={handleResend}
            disabled={resendCooldown > 0 || isResending}
            className="flex h-11 items-center justify-center gap-2 whitespace-nowrap rounded-lg border border-outline-variant px-4 text-sm font-semibold text-foreground transition-all hover:bg-surface disabled:cursor-not-allowed disabled:opacity-50"
          >
            {isResending && <Loader2 aria-hidden="true" className="h-4 w-4 animate-spin" />}
            {resendCooldown > 0 ? `Resend in ${resendCooldown}s` : "Resend Code"}
          </button>
        </div>
      </div>
    </motion.div>
  );
}
