"use client";

import { Eye, EyeOff, Lock, Mail } from "lucide-react";
import { useRouter } from "next/navigation";
import { useState } from "react";
import { useAuth } from "@/app/context/AuthContext";
import { FacebookIcon, GoogleIcon } from "./SocialIcons";

const inputClass =
  "w-full rounded-lg border border-outline-variant bg-surface py-3 pl-10 pr-4 text-sm text-foreground outline-none transition-all focus:border-primary focus:ring-2 focus:ring-secondary-container/50";

type LoginFormProps = {
  onSwitchToSignup: () => void;
  onSwitchToForgotPassword: () => void;
};

export function LoginForm({ onSwitchToSignup, onSwitchToForgotPassword }: LoginFormProps) {
  const [showPassword, setShowPassword] = useState(false);
  const [identifier, setIdentifier] = useState("");
  const [password, setPassword] = useState("");
  const [error, setError] = useState<string | null>(null);
  const { login } = useAuth();
  const router = useRouter();

  const handleSubmit = async (event: React.FormEvent) => {
    event.preventDefault();
    setError(null);

    if (!identifier.trim() || !password) {
      setError("Please enter your email/phone and password.");
      return;
    }

    const result = await login(identifier, password);

    if (!result.success) {
      setError(result.error);
      return;
    }

    router.push("/account");
  };

  return (
    <div>
      <div className="mb-6">
        <h1 className="text-3xl font-bold text-foreground">Welcome Back!</h1>
        <p className="mt-1 text-on-surface-variant">Log in to manage your orders, wishlist, and profile.</p>
      </div>

      <form className="space-y-3" onSubmit={handleSubmit}>
        <div className="space-y-1.5">
          <label htmlFor="email-login" className="text-sm font-medium text-foreground">
            Email or Phone
          </label>
          <div className="relative">
            <Mail
              aria-hidden="true"
              className="pointer-events-none absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-outline"
            />
            <input
              id="email-login"
              type="text"
              required
              placeholder="name@example.com"
              value={identifier}
              onChange={(event) => setIdentifier(event.target.value)}
              className={inputClass}
            />
          </div>
        </div>

        <div className="space-y-1.5">
          <div className="flex items-center justify-between">
            <label htmlFor="password-login" className="text-sm font-medium text-foreground">
              Password
            </label>
            <button
              type="button"
              onClick={onSwitchToForgotPassword}
              className="text-xs font-semibold text-primary hover:underline"
            >
              Forgot Password?
            </button>
          </div>
          <div className="relative">
            <Lock
              aria-hidden="true"
              className="pointer-events-none absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-outline"
            />
            <input
              id="password-login"
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
              className="absolute right-3 top-1/2 -translate-y-1/2 text-outline transition-colors hover:text-foreground"
            >
              {showPassword ? <EyeOff aria-hidden="true" className="h-4 w-4" /> : <Eye aria-hidden="true" className="h-4 w-4" />}
            </button>
          </div>
        </div>

        <div className="flex items-center gap-2 py-1">
          <input id="remember" type="checkbox" className="h-4 w-4 rounded border-outline text-primary focus:ring-primary" />
          <label htmlFor="remember" className="text-sm text-on-surface-variant">
            Remember Me
          </label>
        </div>

        {error && (
          <p role="alert" className="text-sm font-medium text-red-600">
            {error}
          </p>
        )}

        <button
          type="submit"
          className="mt-2 w-full rounded-lg bg-primary py-3 text-sm font-semibold text-white shadow-md transition-all hover:bg-on-surface-variant active:scale-[0.98]"
        >
          Log In
        </button>
      </form>

      <div className="my-6 flex items-center gap-3">
        <div className="h-px flex-grow bg-outline-variant" />
        <span className="text-xs font-semibold uppercase tracking-wider text-outline">Or Continue With</span>
        <div className="h-px flex-grow bg-outline-variant" />
      </div>

      <div className="grid grid-cols-2 gap-3">
        <button
          type="button"
          className="flex items-center justify-center gap-2 rounded-lg border border-outline-variant bg-surface px-4 py-2.5 text-sm font-medium text-foreground transition-colors hover:bg-white"
        >
          <GoogleIcon className="h-5 w-5" />
          Google
        </button>
        <button
          type="button"
          className="flex items-center justify-center gap-2 rounded-lg border border-outline-variant bg-surface px-4 py-2.5 text-sm font-medium text-foreground transition-colors hover:bg-white"
        >
          <FacebookIcon className="h-5 w-5" />
          Facebook
        </button>
      </div>

      <p className="mt-6 text-center text-sm text-on-surface-variant">
        Don&apos;t have an account?{" "}
        <button type="button" onClick={onSwitchToSignup} className="font-bold text-primary hover:underline">
          Sign Up
        </button>
      </p>
    </div>
  );
}
