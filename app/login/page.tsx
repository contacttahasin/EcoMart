"use client";

import { AnimatePresence, motion } from "framer-motion";
import Link from "next/link";
import { Leaf, ShieldCheck, Truck } from "lucide-react";
import { useState } from "react";
import { AuthHeader } from "@/app/components/auth/AuthHeader";
import { LoginForm } from "@/app/components/auth/LoginForm";
import { SignupForm } from "@/app/components/auth/SignupForm";

const TRUST_ITEMS = [
  { icon: Leaf, label: "100% Eco" },
  { icon: ShieldCheck, label: "Secure Shop" },
  { icon: Truck, label: "Carbon Neutral" },
];

export default function LoginPage() {
  const [view, setView] = useState<"login" | "signup">("login");
  const year = new Date().getFullYear();

  return (
    <div className="flex min-h-screen flex-col overflow-x-hidden bg-background">
      <AuthHeader />

      <main className="relative flex flex-grow items-center justify-center px-4 py-12 sm:px-6">
        <div aria-hidden="true" className="pointer-events-none absolute inset-0 z-0 overflow-hidden opacity-30">
          <div className="absolute right-0 top-0 h-[500px] w-[500px] -translate-y-1/2 translate-x-1/2 rounded-full bg-secondary-container blur-[120px]" />
          <div className="absolute bottom-0 left-0 h-[400px] w-[400px] -translate-x-1/4 translate-y-1/2 rounded-full bg-secondary-container blur-[100px]" />
        </div>

        <div className="z-10 w-full max-w-[480px]">
          <div className="overflow-hidden rounded-2xl border border-outline-variant/30 bg-white p-6 shadow-[0px_12px_32px_rgba(0,0,0,0.08)] sm:p-8">
            <AnimatePresence mode="wait">
              <motion.div
                key={view}
                initial={{ opacity: 0, y: 10 }}
                animate={{ opacity: 1, y: 0 }}
                exit={{ opacity: 0, y: -10 }}
                transition={{ duration: 0.25, ease: "easeOut" }}
              >
                {view === "login" ? (
                  <LoginForm onSwitchToSignup={() => setView("signup")} />
                ) : (
                  <SignupForm onSwitchToLogin={() => setView("login")} />
                )}
              </motion.div>
            </AnimatePresence>
          </div>

          <div className="mt-8 flex justify-center gap-8 opacity-40">
            {TRUST_ITEMS.map(({ icon: Icon, label }) => (
              <div key={label} className="flex flex-col items-center gap-1">
                <Icon aria-hidden="true" className="h-6 w-6 text-primary" />
                <span className="text-xs font-semibold uppercase tracking-tight text-foreground">{label}</span>
              </div>
            ))}
          </div>
        </div>
      </main>

      <footer className="flex w-full flex-col items-center gap-4 border-t border-outline-variant/30 bg-surface px-4 py-6 sm:flex-row sm:justify-between sm:px-6">
        <p className="text-xs text-on-surface-variant">© {year} EcoMarket. All rights reserved.</p>
        <div className="flex gap-6">
          <Link href="#" className="text-xs text-on-surface-variant transition-colors hover:text-primary">
            Privacy Policy
          </Link>
          <Link href="#" className="text-xs text-on-surface-variant transition-colors hover:text-primary">
            Terms of Service
          </Link>
          <Link href="#" className="text-xs text-on-surface-variant transition-colors hover:text-primary">
            Help Center
          </Link>
        </div>
      </footer>
    </div>
  );
}
