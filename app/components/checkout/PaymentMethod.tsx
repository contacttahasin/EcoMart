"use client";

import { CreditCard, Nfc, Smartphone } from "lucide-react";
import { useState } from "react";

type PaymentOption = "card" | "bkash" | "nagad";

const inputClass =
  "w-full rounded-lg border border-outline-variant bg-white px-4 py-2.5 text-sm text-foreground outline-none transition-all placeholder:text-on-surface-variant/60 focus:border-primary focus:ring-2 focus:ring-secondary-container/40";

export function PaymentMethod() {
  const [method, setMethod] = useState<PaymentOption>("card");

  return (
    <div className="space-y-4 rounded-xl border border-outline-variant bg-white p-4 shadow-[0px_2px_12px_rgba(0,0,0,0.04)] sm:p-6">
      <div className="flex flex-wrap gap-3">
        <button
          type="button"
          onClick={() => setMethod("card")}
          className={`flex items-center gap-2 rounded-lg border px-4 py-2.5 text-sm font-medium transition-colors ${
            method === "card"
              ? "border-2 border-primary bg-surface text-foreground"
              : "border-outline-variant bg-white text-on-surface-variant hover:bg-surface"
          }`}
        >
          <CreditCard aria-hidden="true" className="h-4 w-4 text-primary" />
          Credit Card
        </button>
        <button
          type="button"
          onClick={() => setMethod("bkash")}
          className={`flex items-center gap-2 rounded-lg border px-4 py-2.5 text-sm font-medium transition-colors ${
            method === "bkash"
              ? "border-2 border-primary bg-surface text-foreground"
              : "border-outline-variant bg-white text-on-surface-variant hover:bg-surface"
          }`}
        >
          <Smartphone aria-hidden="true" className="h-4 w-4 text-pink-600" />
          bKash
        </button>
        <button
          type="button"
          onClick={() => setMethod("nagad")}
          className={`flex items-center gap-2 rounded-lg border px-4 py-2.5 text-sm font-medium transition-colors ${
            method === "nagad"
              ? "border-2 border-primary bg-surface text-foreground"
              : "border-outline-variant bg-white text-on-surface-variant hover:bg-surface"
          }`}
        >
          <Smartphone aria-hidden="true" className="h-4 w-4 text-orange-600" />
          Nagad
        </button>
      </div>

      {method === "card" ? (
        <div className="grid grid-cols-1 gap-4 pt-2 md:grid-cols-2">
          <div className="space-y-1.5 md:col-span-2">
            <label className="text-sm font-medium text-on-surface-variant">Card Number</label>
            <div className="relative">
              <input className={`${inputClass} pr-11`} type="text" placeholder="0000 0000 0000 0000" />
              <Nfc
                aria-hidden="true"
                className="pointer-events-none absolute right-3.5 top-1/2 h-5 w-5 -translate-y-1/2 text-on-surface-variant"
              />
            </div>
          </div>
          <div className="space-y-1.5">
            <label className="text-sm font-medium text-on-surface-variant">Expiry Date</label>
            <input className={inputClass} type="text" placeholder="MM/YY" />
          </div>
          <div className="space-y-1.5">
            <label className="text-sm font-medium text-on-surface-variant">CVV</label>
            <input className={inputClass} type="text" placeholder="123" />
          </div>
        </div>
      ) : (
        <div className="space-y-1.5 pt-2">
          <label className="text-sm font-medium text-on-surface-variant">
            {method === "bkash" ? "bKash" : "Nagad"} Account Number
          </label>
          <input className={inputClass} type="tel" placeholder="01XXXXXXXXX" />
          <p className="pt-1 text-sm text-on-surface-variant">
            You&apos;ll receive a payment request on this {method === "bkash" ? "bKash" : "Nagad"} number to
            confirm and complete your payment.
          </p>
        </div>
      )}
    </div>
  );
}
