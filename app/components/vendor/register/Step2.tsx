"use client";

import { ArrowLeft, ArrowRight, ChevronDown, MapPin, ShieldCheck, Warehouse } from "lucide-react";
import { useState } from "react";
import type { VendorBusinessInfo } from "@/app/types/vendor";
import { BUSINESS_CATEGORIES, BUSINESS_TYPES } from "@/services/vendor.service";
import { DocumentDropzone } from "./DocumentDropzone";

const inputClass =
  "w-full rounded-lg border border-outline-variant bg-surface-container-lowest px-4 py-3 text-sm text-foreground outline-none transition-all focus:border-primary focus:ring-2 focus:ring-secondary-container/50";

type Step2Props = {
  initialData?: Partial<VendorBusinessInfo>;
  onNext: (data: VendorBusinessInfo) => void;
  onBack: () => void;
};

export function Step2({ initialData, onNext, onBack }: Step2Props) {
  const [shopName, setShopName] = useState(initialData?.shopName ?? "");
  const [businessType, setBusinessType] = useState(initialData?.businessType ?? "");
  const [businessCategory, setBusinessCategory] = useState(initialData?.businessCategory ?? "");
  const [address, setAddress] = useState(initialData?.address ?? "");
  const [postalCode, setPostalCode] = useState(initialData?.postalCode ?? "");
  const [tradeLicenseFileName, setTradeLicenseFileName] = useState(initialData?.tradeLicenseFileName ?? null);
  const [error, setError] = useState<string | null>(null);

  const handleSubmit = (event: React.FormEvent) => {
    event.preventDefault();
    setError(null);

    if (!tradeLicenseFileName) {
      setError("Please upload your Trade License document before continuing.");
      return;
    }

    onNext({ shopName, businessType, businessCategory, address, postalCode, tradeLicenseFileName });
  };

  return (
    <div className="mx-auto flex max-w-4xl flex-col gap-12 md:flex-row">
      <div className="hidden md:block md:w-5/12">
        <div className="sticky top-28">
          <h1 className="mb-2 text-3xl font-bold tracking-tight text-foreground">Business Profile</h1>
          <p className="mb-6 text-on-surface-variant">
            Tell us about your company and store logistics. This helps us personalize your merchant dashboard and
            calculate shipping estimates.
          </p>
          <div className="relative aspect-square w-full overflow-hidden rounded-xl border border-outline-variant shadow-lg">
            <div className="flex h-full w-full items-center justify-center bg-gradient-to-br from-primary-container to-tertiary">
              <Warehouse aria-hidden="true" className="h-20 w-20 text-white/70" />
            </div>
            <div className="absolute inset-0 flex flex-col justify-end bg-gradient-to-t from-black/60 to-transparent p-6">
              <p className="text-sm italic text-white">
                &ldquo;EcoMarket helped us scale our organic boutique to over 500 orders a month.&rdquo;
              </p>
              <p className="mt-1 text-xs text-white/80">— Green Leaf Co.</p>
            </div>
          </div>
        </div>
      </div>

      <div className="w-full md:w-7/12">
        <div className="rounded-xl border border-outline-variant/40 bg-white/90 p-6 shadow-[0px_2px_12px_rgba(0,0,0,0.04)] backdrop-blur-sm md:p-12">
          <form className="space-y-6" onSubmit={handleSubmit}>
            <div className="flex flex-col gap-1.5">
              <label htmlFor="shop-name" className="text-sm font-medium text-foreground">
                Official Shop/Business Name
              </label>
              <input
                id="shop-name"
                type="text"
                required
                placeholder="e.g. Green Earth Collective"
                value={shopName}
                onChange={(event) => setShopName(event.target.value)}
                className={inputClass}
              />
            </div>

            <div className="grid grid-cols-1 gap-6 md:grid-cols-2">
              <div className="flex flex-col gap-1.5">
                <label htmlFor="business-type" className="text-sm font-medium text-foreground">
                  Business Type
                </label>
                <div className="relative">
                  <select
                    id="business-type"
                    required
                    value={businessType}
                    onChange={(event) => setBusinessType(event.target.value)}
                    className={`${inputClass} appearance-none pr-10 ${businessType ? "" : "text-on-surface-variant"}`}
                  >
                    <option value="" disabled>
                      Select Type
                    </option>
                    {BUSINESS_TYPES.map((type) => (
                      <option key={type.value} value={type.value}>
                        {type.label}
                      </option>
                    ))}
                  </select>
                  <ChevronDown
                    aria-hidden="true"
                    className="pointer-events-none absolute right-3 top-1/2 h-4 w-4 -translate-y-1/2 text-on-surface-variant"
                  />
                </div>
              </div>

              <div className="flex flex-col gap-1.5">
                <label htmlFor="business-category" className="text-sm font-medium text-foreground">
                  Business Category
                </label>
                <div className="relative">
                  <select
                    id="business-category"
                    required
                    value={businessCategory}
                    onChange={(event) => setBusinessCategory(event.target.value)}
                    className={`${inputClass} appearance-none pr-10 ${businessCategory ? "" : "text-on-surface-variant"}`}
                  >
                    <option value="" disabled>
                      Select Category
                    </option>
                    {BUSINESS_CATEGORIES.map((category) => (
                      <option key={category.value} value={category.value}>
                        {category.label}
                      </option>
                    ))}
                  </select>
                  <ChevronDown
                    aria-hidden="true"
                    className="pointer-events-none absolute right-3 top-1/2 h-4 w-4 -translate-y-1/2 text-on-surface-variant"
                  />
                </div>
              </div>
            </div>

            <div className="flex flex-col gap-1.5">
              <label htmlFor="address" className="text-sm font-medium text-foreground">
                Full Warehouse / Store Address
              </label>
              <textarea
                id="address"
                required
                rows={3}
                placeholder="Enter your full street address, building number, and city..."
                value={address}
                onChange={(event) => setAddress(event.target.value)}
                className={inputClass}
              />
            </div>

            <div className="flex flex-col gap-1.5">
              <label htmlFor="postal-code" className="text-sm font-medium text-foreground">
                Postal Code
              </label>
              <div className="relative">
                <MapPin
                  aria-hidden="true"
                  className="pointer-events-none absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-on-surface-variant"
                />
                <input
                  id="postal-code"
                  type="text"
                  required
                  placeholder="XXXXXX"
                  value={postalCode}
                  onChange={(event) => setPostalCode(event.target.value)}
                  className={`${inputClass} pl-10`}
                />
              </div>
            </div>

            <div className="flex flex-col gap-1.5">
              <label className="text-sm font-medium text-foreground">Trade License Upload</label>
              <DocumentDropzone
                label="Trade License Document"
                hint="PNG, JPG, or PDF"
                fileName={tradeLicenseFileName}
                onFileSelected={setTradeLicenseFileName}
              />
            </div>

            {error && (
              <p role="alert" className="text-sm font-medium text-red-600">
                {error}
              </p>
            )}

            <div className="flex items-center justify-between border-t border-outline-variant pt-6">
              <button
                type="button"
                onClick={onBack}
                className="flex items-center gap-2 rounded-lg border border-primary px-6 py-3 text-sm font-bold text-primary transition-all hover:bg-secondary-container/40 active:opacity-80"
              >
                <ArrowLeft aria-hidden="true" className="h-4 w-4" />
                Back
              </button>
              <button
                type="submit"
                className="flex items-center gap-2 rounded-lg bg-primary px-6 py-3 text-sm font-bold text-white shadow-md transition-all hover:bg-primary-container active:opacity-80"
              >
                Next: Document Verification
                <ArrowRight aria-hidden="true" className="h-4 w-4" />
              </button>
            </div>
          </form>
        </div>

        <div className="mt-6 flex items-start gap-2 px-4">
          <ShieldCheck aria-hidden="true" className="mt-0.5 h-4 w-4 shrink-0 text-secondary" />
          <p className="text-sm text-on-surface-variant">
            EcoMarket uses industry-standard encryption to protect your business data. Your sensitive documents will
            only be used for identity and business verification purposes.
          </p>
        </div>
      </div>
    </div>
  );
}
