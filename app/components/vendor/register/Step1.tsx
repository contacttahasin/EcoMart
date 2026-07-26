"use client";

import { AnimatePresence, motion } from "framer-motion";
import { ArrowRight, Eye, EyeOff, Loader2, Lock } from "lucide-react";
import { useRef, useState } from "react";
import { useVendorAuth } from "@/app/context/VendorAuthContext";
import type { VendorPersonalInfo } from "@/app/types/vendor";
import { getPasswordStrengthError, isValidEmail } from "@/services/validation.service";
import { EmailOtpVerification, type OtpActionResult } from "@/app/components/auth/EmailOtpVerification";

const inputClass =
  "h-12 w-full rounded-lg border border-outline-variant bg-white px-4 text-sm text-foreground outline-none transition-all focus:border-primary focus:ring-2 focus:ring-secondary-container/50";

const OTP_LENGTH = 6;

type Step1Props = {
  initialData?: Partial<VendorPersonalInfo>;
  onNext: (data: VendorPersonalInfo) => void;
};

type Stage = "form" | "otp";

export function Step1({ initialData, onNext }: Step1Props) {
  const [fullLegalName, setFullLegalName] = useState(initialData?.fullLegalName ?? "");
  const [businessName, setBusinessName] = useState(initialData?.businessName ?? "");
  const [phone, setPhone] = useState(initialData?.phone ?? "");
  const [email, setEmail] = useState(initialData?.email ?? "");
  const [password, setPassword] = useState(initialData?.password ?? "");
  const [confirmPassword, setConfirmPassword] = useState(initialData?.password ?? "");
  const [showPassword, setShowPassword] = useState(false);
  const [showConfirmPassword, setShowConfirmPassword] = useState(false);
  const [otpSent, setOtpSent] = useState(false);
  const [otp, setOtp] = useState<string[]>(Array(OTP_LENGTH).fill(""));
  const [error, setError] = useState<string | null>(null);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [stage, setStage] = useState<Stage>("form");
  const [emailVerified, setEmailVerified] = useState(initialData?.emailVerified ?? false);
  const otpRefs = useRef<Array<HTMLInputElement | null>>([]);
  const { isEmailTaken, startSignup, verifySignupOtp, resendSignupOtp } = useVendorAuth();

  const phoneVerified = otp.every((digit) => digit !== "");

  const handleSendOtp = () => {
    setOtpSent(true);
    requestAnimationFrame(() => otpRefs.current[0]?.focus());
  };

  const handleOtpChange = (index: number, value: string) => {
    const digit = value.replace(/\D/g, "").slice(-1);
    setOtp((prev) => {
      const next = [...prev];
      next[index] = digit;
      return next;
    });
    if (digit && index < OTP_LENGTH - 1) {
      otpRefs.current[index + 1]?.focus();
    }
  };

  const handleOtpKeyDown = (index: number, event: React.KeyboardEvent<HTMLInputElement>) => {
    if (event.key === "Backspace" && !otp[index] && index > 0) {
      otpRefs.current[index - 1]?.focus();
    }
  };

  const handleSubmit = async (event: React.FormEvent) => {
    event.preventDefault();
    setError(null);

    if (!fullLegalName.trim() || !businessName.trim() || !phone.trim() || !email.trim() || !password || !confirmPassword) {
      setError("Please fill in all required fields.");
      return;
    }

    if (!isValidEmail(email)) {
      setError("Please enter a valid email address.");
      return;
    }

    const passwordError = getPasswordStrengthError(password);
    if (passwordError) {
      setError(passwordError);
      return;
    }

    if (password !== confirmPassword) {
      setError("Password and Confirm Password do not match.");
      return;
    }

    // Coming back from Step 2/3 without changing email or password — the
    // account was already created and confirmed earlier in this session, so
    // there's no need to send another OTP.
    if (emailVerified && email === initialData?.email && password === initialData?.password) {
      onNext({ fullLegalName, businessName, phone, phoneVerified, email, emailVerified: true, password });
      return;
    }

    if (await isEmailTaken(email)) {
      setError("A vendor account with this email already exists.");
      return;
    }

    setIsSubmitting(true);
    const result = await startSignup({ fullName: fullLegalName, businessName, email, phone, password });
    setIsSubmitting(false);

    if (!result.success) {
      setError(result.error);
      return;
    }

    if (!result.otpRequired) {
      setEmailVerified(true);
      onNext({ fullLegalName, businessName, phone, phoneVerified, email, emailVerified: true, password });
      return;
    }

    setStage("otp");
  };

  const handleVerifyOtp = async (code: string): Promise<OtpActionResult> => {
    const result = await verifySignupOtp(email, code, businessName);
    if (result.success) {
      setEmailVerified(true);
      onNext({ fullLegalName, businessName, phone, phoneVerified, email, emailVerified: true, password });
    }
    return result;
  };

  const handleResendOtp = () => resendSignupOtp(email);

  const handleChangeEmail = () => {
    setStage("form");
    setError(null);
  };

  return (
    <div className="mx-auto max-w-200">
      <div className="mb-8">
        <h1 className="mb-1 text-3xl font-bold tracking-tight text-foreground">
          {stage === "otp" ? "Verify Your Email" : "Personal & Contact Verification"}
        </h1>
        <p className="text-lg text-on-surface-variant">
          {stage === "otp"
            ? "Enter the code we sent you to activate your merchant account."
            : "Verify your identity to secure your merchant account."}
        </p>
      </div>

      <div className="rounded-xl border border-outline-variant/30 bg-surface-container-lowest p-6 shadow-[0px_2px_12px_rgba(0,0,0,0.04)] sm:p-12">
        <AnimatePresence mode="wait">
          {stage === "otp" ? (
            <motion.div
              key="otp"
              initial={{ opacity: 0, y: 10 }}
              animate={{ opacity: 1, y: 0 }}
              exit={{ opacity: 0, y: -10 }}
              transition={{ duration: 0.25, ease: "easeOut" }}
            >
              <EmailOtpVerification
                email={email}
                onChangeEmail={handleChangeEmail}
                onVerify={handleVerifyOtp}
                onResend={handleResendOtp}
              />
            </motion.div>
          ) : (
            <motion.form
              key="form"
              initial={{ opacity: 0, y: 10 }}
              animate={{ opacity: 1, y: 0 }}
              exit={{ opacity: 0, y: -10 }}
              transition={{ duration: 0.25, ease: "easeOut" }}
              className="space-y-6"
              onSubmit={handleSubmit}
            >
              <div className="flex flex-col gap-1.5">
                <label htmlFor="full-name" className="text-sm font-medium text-on-surface-variant">
                  Full Legal Name (as per National ID)
                </label>
                <input
                  id="full-name"
                  type="text"
                  required
                  placeholder="Johnathan Doe"
                  value={fullLegalName}
                  onChange={(event) => setFullLegalName(event.target.value)}
                  className={inputClass}
                />
              </div>

              <div className="flex flex-col gap-1.5">
                <label htmlFor="business-name" className="text-sm font-medium text-on-surface-variant">
                  Business Name
                </label>
                <input
                  id="business-name"
                  type="text"
                  required
                  placeholder="Green Earth Collective"
                  value={businessName}
                  onChange={(event) => setBusinessName(event.target.value)}
                  className={inputClass}
                />
              </div>

              <div className="flex flex-col gap-1.5">
                <label htmlFor="phone" className="text-sm font-medium text-on-surface-variant">
                  Phone Number
                </label>
                <div className="flex gap-2">
                  <input
                    id="phone"
                    type="tel"
                    required
                    placeholder="+1 (555) 000-0000"
                    value={phone}
                    onChange={(event) => setPhone(event.target.value)}
                    className={`${inputClass} grow`}
                  />
                  <button
                    type="button"
                    onClick={handleSendOtp}
                    disabled={!phone}
                    className="h-12 shrink-0 rounded-lg bg-primary px-4 text-sm font-medium text-white transition-colors hover:bg-secondary active:opacity-90 disabled:cursor-not-allowed disabled:opacity-50"
                  >
                    Send OTP
                  </button>
                </div>
              </div>

              {otpSent && (
                <div className="flex flex-col gap-1.5">
                  <label className="text-sm font-medium text-on-surface-variant">Verify OTP (6 digits)</label>
                  <div className="flex gap-2">
                    {otp.map((digit, index) => (
                      <input
                        key={index}
                        ref={(el) => {
                          otpRefs.current[index] = el;
                        }}
                        type="text"
                        inputMode="numeric"
                        maxLength={1}
                        value={digit}
                        onChange={(event) => handleOtpChange(index, event.target.value)}
                        onKeyDown={(event) => handleOtpKeyDown(index, event)}
                        className="h-12 w-12 rounded-lg border border-outline-variant bg-white text-center text-xl font-bold outline-none transition-all focus:border-primary focus:ring-2 focus:ring-secondary-container/50"
                      />
                    ))}
                  </div>
                  <span className="mt-1 text-xs font-semibold text-secondary">
                    OTP sent to your mobile. Valid for 5:00 minutes.
                  </span>
                </div>
              )}

              <div className="flex flex-col gap-1.5">
                <label htmlFor="email" className="text-sm font-medium text-on-surface-variant">
                  Email Address
                </label>
                <input
                  id="email"
                  type="email"
                  required
                  placeholder="you@example.com"
                  value={email}
                  onChange={(event) => setEmail(event.target.value)}
                  className={inputClass}
                />
              </div>

              <div className="grid grid-cols-1 gap-4 sm:grid-cols-2">
                <div className="flex flex-col gap-1.5">
                  <label htmlFor="vendor-password" className="text-sm font-medium text-on-surface-variant">
                    Password
                  </label>
                  <div className="relative">
                    <input
                      id="vendor-password"
                      type={showPassword ? "text" : "password"}
                      required
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
                <div className="flex flex-col gap-1.5">
                  <label htmlFor="vendor-confirm-password" className="text-sm font-medium text-on-surface-variant">
                    Confirm Password
                  </label>
                  <div className="relative">
                    <input
                      id="vendor-confirm-password"
                      type={showConfirmPassword ? "text" : "password"}
                      required
                      placeholder="••••••••"
                      value={confirmPassword}
                      onChange={(event) => setConfirmPassword(event.target.value)}
                      className={`${inputClass} pr-10`}
                    />
                    <button
                      type="button"
                      aria-label={showConfirmPassword ? "Hide password" : "Show password"}
                      onClick={() => setShowConfirmPassword((value) => !value)}
                      className="absolute right-3 top-1/2 -translate-y-1/2 text-on-surface-variant transition-colors hover:text-primary"
                    >
                      {showConfirmPassword ? (
                        <EyeOff aria-hidden="true" className="h-4 w-4" />
                      ) : (
                        <Eye aria-hidden="true" className="h-4 w-4" />
                      )}
                    </button>
                  </div>
                </div>
              </div>

              <div className="flex items-center gap-2 rounded-lg border border-dashed border-outline-variant bg-surface-container-low px-4 py-3">
                <Lock aria-hidden="true" className="h-5 w-5 shrink-0 text-secondary" />
                <p className="text-sm text-on-surface-variant">
                  Your data is encrypted and kept strictly confidential.
                </p>
              </div>

              {error && (
                <p role="alert" className="text-sm font-medium text-red-600">
                  {error}
                </p>
              )}

              <button
                type="submit"
                disabled={isSubmitting}
                className="flex h-14 w-full items-center justify-center gap-2 rounded-lg bg-primary text-base font-bold text-white transition-all hover:shadow-lg active:scale-[0.99] disabled:cursor-not-allowed disabled:opacity-60"
              >
                {isSubmitting && <Loader2 aria-hidden="true" className="h-5 w-5 animate-spin" />}
                Next: Business Information
                <ArrowRight aria-hidden="true" className="h-5 w-5" />
              </button>
            </motion.form>
          )}
        </AnimatePresence>
      </div>
    </div>
  );
}
