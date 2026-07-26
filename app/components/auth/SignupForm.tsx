"use client";

import { AnimatePresence, motion } from "framer-motion";
import { Loader2, Lock, Mail, Phone, ShieldCheck, User } from "lucide-react";
import { useRouter } from "next/navigation";
import { useState } from "react";
import { useAuth } from "@/app/context/AuthContext";
import { EmailOtpVerification, type OtpActionResult } from "@/app/components/auth/EmailOtpVerification";

const inputClass =
  "w-full rounded-lg border border-outline-variant bg-surface py-3 pl-10 pr-4 text-sm text-foreground outline-none transition-all focus:border-primary focus:ring-2 focus:ring-secondary-container/50";

type ContactMethod = "email" | "phone";
type SignupStage = "form" | "otp";

type SignupFormProps = {
  onSwitchToLogin: () => void;
};

export function SignupForm({ onSwitchToLogin }: SignupFormProps) {
  const [contactMethod, setContactMethod] = useState<ContactMethod>("email");
  const [fullName, setFullName] = useState("");
  const [contact, setContact] = useState("");
  const [password, setPassword] = useState("");
  const [confirmPassword, setConfirmPassword] = useState("");
  const [error, setError] = useState<string | null>(null);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [stage, setStage] = useState<SignupStage>("form");
  const { startSignup, verifySignupOtp, resendSignupOtp } = useAuth();
  const router = useRouter();

  const switchContactMethod = (method: ContactMethod) => {
    setContactMethod(method);
    setContact("");
  };

  const handleSubmit = async (event: React.FormEvent) => {
    event.preventDefault();
    setError(null);

    if (!fullName.trim() || !contact.trim() || !password || !confirmPassword) {
      setError("Please fill in all required fields.");
      return;
    }

    if (password !== confirmPassword) {
      setError("Password and Confirm Password do not match.");
      return;
    }

    setIsSubmitting(true);
    const result = await startSignup({
      name: fullName,
      email: contactMethod === "email" ? contact : "",
      phone: contactMethod === "phone" ? contact : "",
      password,
    });
    setIsSubmitting(false);

    if (!result.success) {
      setError(result.error);
      return;
    }

    if (result.otpRequired) {
      setStage("otp");
      return;
    }

    router.push("/account");
  };

  const handleVerifyOtp = async (code: string): Promise<OtpActionResult> => {
    const result = await verifySignupOtp(contact, code);
    if (result.success) {
      router.push("/account");
    }
    return result;
  };

  const handleResendOtp = () => resendSignupOtp(contact);

  const handleChangeEmail = () => {
    setStage("form");
    setError(null);
  };

  return (
    <div>
      <div className="mb-6">
        <h1 className="text-3xl font-bold text-foreground">
          {stage === "otp" ? "Verify Your Email" : "Create Your Account"}
        </h1>
        <p className="mt-1 text-on-surface-variant">
          {stage === "otp"
            ? "You're almost there — enter the code to activate your account."
            : "Join EcoMarket and start shopping sustainably."}
        </p>
      </div>

      <AnimatePresence mode="wait">
        {stage === "form" ? (
          <motion.form
            key="form"
            initial={{ opacity: 0, y: 10 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0, y: -10 }}
            transition={{ duration: 0.25, ease: "easeOut" }}
            className="space-y-3"
            onSubmit={handleSubmit}
          >
            <div className="space-y-1.5">
              <label htmlFor="name-signup" className="text-sm font-medium text-foreground">
                Full Name
              </label>
              <div className="relative">
                <User
                  aria-hidden="true"
                  className="pointer-events-none absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-outline"
                />
                <input
                  id="name-signup"
                  type="text"
                  required
                  placeholder="John Doe"
                  value={fullName}
                  onChange={(event) => setFullName(event.target.value)}
                  className={inputClass}
                />
              </div>
            </div>

            <div className="space-y-1.5">
              <div className="flex items-center justify-between">
                <label htmlFor="contact-signup" className="text-sm font-medium text-foreground">
                  {contactMethod === "email" ? "Email Address" : "Phone Number"}
                </label>
                <div className="flex rounded-full border border-outline-variant bg-surface p-0.5 text-xs font-semibold">
                  <button
                    type="button"
                    onClick={() => switchContactMethod("email")}
                    className={`rounded-full px-3 py-1 transition-colors ${
                      contactMethod === "email"
                        ? "bg-primary text-white"
                        : "text-on-surface-variant hover:text-foreground"
                    }`}
                  >
                    Email
                  </button>
                  <button
                    type="button"
                    onClick={() => switchContactMethod("phone")}
                    className={`rounded-full px-3 py-1 transition-colors ${
                      contactMethod === "phone"
                        ? "bg-primary text-white"
                        : "text-on-surface-variant hover:text-foreground"
                    }`}
                  >
                    Phone
                  </button>
                </div>
              </div>
              <div className="relative">
                {contactMethod === "email" ? (
                  <Mail
                    aria-hidden="true"
                    className="pointer-events-none absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-outline"
                  />
                ) : (
                  <Phone
                    aria-hidden="true"
                    className="pointer-events-none absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-outline"
                  />
                )}
                <input
                  id="contact-signup"
                  type={contactMethod === "email" ? "email" : "tel"}
                  required
                  value={contact}
                  onChange={(event) => setContact(event.target.value)}
                  placeholder={contactMethod === "email" ? "name@example.com" : "+880 1XXX-XXXXXX"}
                  className={inputClass}
                />
              </div>
            </div>

            <div className="grid grid-cols-1 gap-3 sm:grid-cols-2">
              <div className="space-y-1.5">
                <label htmlFor="password-signup" className="text-sm font-medium text-foreground">
                  Password
                </label>
                <div className="relative">
                  <Lock
                    aria-hidden="true"
                    className="pointer-events-none absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-outline"
                  />
                  <input
                    id="password-signup"
                    type="password"
                    required
                    placeholder="••••••••"
                    value={password}
                    onChange={(event) => setPassword(event.target.value)}
                    className={inputClass}
                  />
                </div>
              </div>
              <div className="space-y-1.5">
                <label htmlFor="confirm-signup" className="text-sm font-medium text-foreground">
                  Confirm
                </label>
                <div className="relative">
                  <ShieldCheck
                    aria-hidden="true"
                    className="pointer-events-none absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-outline"
                  />
                  <input
                    id="confirm-signup"
                    type="password"
                    required
                    placeholder="••••••••"
                    value={confirmPassword}
                    onChange={(event) => setConfirmPassword(event.target.value)}
                    className={inputClass}
                  />
                </div>
              </div>
            </div>

            <p className="py-1 text-xs italic text-on-surface-variant">
              By creating an account, you agree to our Terms of Service and Privacy Policy.
            </p>

            {error && (
              <p role="alert" className="text-sm font-medium text-red-600">
                {error}
              </p>
            )}

            <button
              type="submit"
              disabled={isSubmitting}
              className="mt-2 flex w-full items-center justify-center gap-2 rounded-lg bg-primary py-3 text-sm font-semibold text-white shadow-md transition-all hover:bg-on-surface-variant active:scale-[0.98] disabled:cursor-not-allowed disabled:opacity-60"
            >
              {isSubmitting && <Loader2 aria-hidden="true" className="h-4 w-4 animate-spin" />}
              Create Account
            </button>
          </motion.form>
        ) : (
          <motion.div
            key="otp"
            initial={{ opacity: 0, y: 10 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0, y: -10 }}
            transition={{ duration: 0.25, ease: "easeOut" }}
          >
            <EmailOtpVerification
              email={contact}
              onChangeEmail={handleChangeEmail}
              onVerify={handleVerifyOtp}
              onResend={handleResendOtp}
            />
          </motion.div>
        )}
      </AnimatePresence>

      <p className="mt-6 text-center text-sm text-on-surface-variant">
        Already have an account?{" "}
        <button type="button" onClick={onSwitchToLogin} className="font-bold text-primary hover:underline">
          Log In
        </button>
      </p>
    </div>
  );
}
