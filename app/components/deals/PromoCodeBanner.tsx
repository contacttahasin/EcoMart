"use client";

import { Check, Ticket } from "lucide-react";
import { useState } from "react";

const PROMO_CODE = "DEAL2026";

export function PromoCodeBanner() {
  const [copied, setCopied] = useState(false);

  const handleCopy = async () => {
    try {
      await navigator.clipboard.writeText(PROMO_CODE);
      setCopied(true);
      setTimeout(() => setCopied(false), 2000);
    } catch {
      // clipboard access denied — nothing to do
    }
  };

  return (
    <div className="relative flex flex-col items-center justify-between gap-6 overflow-hidden rounded-2xl bg-primary-container p-8 text-white shadow-xl md:flex-row">
      <div className="relative z-10 flex items-center gap-6">
        <div className="rounded-xl bg-white/15 p-4">
          <Ticket aria-hidden="true" className="h-10 w-10" />
        </div>
        <div>
          <h3 className="text-xl font-bold">Extra Savings for Eco-Warriors</h3>
          <p className="opacity-90">
            Use code <span className="border-b border-dashed font-bold">{PROMO_CODE}</span> for extra $5 OFF on
            orders above $50
          </p>
        </div>
      </div>
      <button
        type="button"
        onClick={handleCopy}
        className="relative z-10 flex items-center gap-2 rounded-xl bg-white px-8 py-3 font-bold text-primary-container shadow-lg transition-all active:scale-95 hover:bg-secondary-container"
      >
        {copied ? (
          <>
            <Check aria-hidden="true" className="h-4 w-4" />
            Copied!
          </>
        ) : (
          "Copy Code"
        )}
      </button>

      <div aria-hidden="true" className="pointer-events-none absolute right-0 top-0 h-full w-1/3 opacity-10">
        <div className="grid h-full grid-cols-4 gap-2">
          <div className="h-full rotate-12 bg-white" />
          <div className="h-full -translate-y-12 rotate-12 bg-white" />
          <div className="h-full translate-y-8 rotate-12 bg-white" />
        </div>
      </div>
    </div>
  );
}
