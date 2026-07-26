"use client";

import { CheckCircle2, Loader2, Lock, Send, UploadCloud } from "lucide-react";
import { useRef, useState } from "react";
import type { VendorBusinessInfo, VendorPayoutInfo, VendorPersonalInfo, VendorVerificationInfo } from "@/app/types/vendor";
import { BUSINESS_CATEGORIES, BUSINESS_TYPES } from "@/services/vendor.service";

const inputClass =
  "h-12 w-full rounded-lg border border-outline-variant bg-surface-container-lowest px-4 text-sm text-foreground outline-none transition-all focus:border-primary focus:ring-2 focus:ring-secondary-container/50";

type Step4Props = {
  registrationData: {
    personal: VendorPersonalInfo;
    business: VendorBusinessInfo;
    verification: VendorVerificationInfo;
  };
  initialData?: Partial<VendorPayoutInfo>;
  onSubmit: (data: VendorPayoutInfo) => Promise<{ success: true } | { success: false; error: string }>;
};

function SummaryItem({ label, value }: { label: string; value: string }) {
  return (
    <div>
      <dt className="text-xs font-medium text-on-surface-variant">{label}</dt>
      <dd className="text-sm font-medium text-foreground">{value}</dd>
    </div>
  );
}

export function Step4({ registrationData, initialData, onSubmit }: Step4Props) {
  const [bankName, setBankName] = useState(initialData?.bankName ?? "");
  const [branch, setBranch] = useState(initialData?.branch ?? "");
  const [accountHolderName, setAccountHolderName] = useState(initialData?.accountHolderName ?? "");
  const [accountNumber, setAccountNumber] = useState(initialData?.accountNumber ?? "");
  const [verificationDocumentFileName, setVerificationDocumentFileName] = useState(
    initialData?.verificationDocumentFileName ?? null
  );
  const [legalAgreementAccepted, setLegalAgreementAccepted] = useState(
    initialData?.legalAgreementAccepted ?? false
  );
  const [reviewConfirmed, setReviewConfirmed] = useState(false);
  const [isDragging, setIsDragging] = useState(false);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const fileInputRef = useRef<HTMLInputElement>(null);

  const { personal, business, verification } = registrationData;
  const businessTypeLabel = BUSINESS_TYPES.find((type) => type.value === business.businessType)?.label ?? "—";
  const businessCategoryLabel =
    BUSINESS_CATEGORIES.find((category) => category.value === business.businessCategory)?.label ?? "—";

  const handleSubmit = async (event: React.FormEvent) => {
    event.preventDefault();
    setError(null);

    if (!bankName.trim() || !branch.trim() || !accountHolderName.trim() || !accountNumber.trim()) {
      setError("Please fill in all required bank details.");
      return;
    }

    if (!reviewConfirmed) {
      setError("Please confirm that the information above is accurate before submitting.");
      return;
    }

    if (!legalAgreementAccepted) {
      setError("Please accept the legal agreement before submitting.");
      return;
    }

    setIsSubmitting(true);
    const result = await onSubmit({
      bankName,
      branch,
      accountHolderName,
      accountNumber,
      verificationDocumentFileName,
      legalAgreementAccepted,
    });

    if (!result.success) {
      setError(result.error);
      setIsSubmitting(false);
    }
  };

  return (
    <div className="mx-auto max-w-3xl space-y-6">
      <form onSubmit={handleSubmit} className="space-y-6">
        <div className="rounded-xl bg-surface-container-lowest p-6 shadow-[0px_2px_12px_rgba(0,0,0,0.04)] md:p-12">
          <div className="mb-8">
            <h1 className="mb-1 text-3xl font-bold tracking-tight text-foreground">Review &amp; Submit</h1>
            <p className="text-on-surface-variant">Please confirm everything below is correct before submitting.</p>
          </div>

          <dl className="grid grid-cols-1 gap-4 sm:grid-cols-2">
            <SummaryItem label="Full Name" value={personal.fullLegalName} />
            <SummaryItem label="Business Name" value={personal.businessName} />
            <SummaryItem label="Email" value={personal.email} />
            <SummaryItem label="Phone Number" value={personal.phone} />
            <SummaryItem label="Shop/Business Name" value={business.shopName} />
            <SummaryItem label="Business Type" value={businessTypeLabel} />
            <SummaryItem label="Business Category" value={businessCategoryLabel} />
            <SummaryItem label="Postal Code" value={business.postalCode} />
            <div className="sm:col-span-2">
              <dt className="text-xs font-medium text-on-surface-variant">Warehouse / Store Address</dt>
              <dd className="text-sm font-medium text-foreground">{business.address}</dd>
            </div>
            <SummaryItem label="Face ID Verification" value={verification.selfieCaptured ? "Verified" : "Not completed"} />
          </dl>

          <div className="mt-6 flex items-start gap-3 border-t border-outline-variant pt-6">
            <input
              id="confirm-review"
              type="checkbox"
              required
              checked={reviewConfirmed}
              onChange={(event) => setReviewConfirmed(event.target.checked)}
              className="mt-0.5 h-5 w-5 shrink-0 rounded border-outline-variant accent-primary"
            />
            <label htmlFor="confirm-review" className="cursor-pointer select-none text-sm text-on-surface-variant">
              I confirm that the information above is accurate and I&apos;m ready to submit my vendor application.
            </label>
          </div>
        </div>

        <div className="rounded-xl bg-surface-container-lowest p-6 shadow-[0px_2px_12px_rgba(0,0,0,0.04)] md:p-12">
          <div className="mb-8">
            <h2 className="mb-1 text-3xl font-bold tracking-tight text-foreground">Payout Setup</h2>
            <p className="text-on-surface-variant">Enter your bank details to receive payments from sales.</p>
          </div>

          <div className="space-y-6">
            <div className="grid grid-cols-1 gap-6 md:grid-cols-2">
              <div className="flex flex-col gap-1.5">
                <label htmlFor="bank-name" className="text-sm font-medium text-on-surface-variant">
                  Bank Name
                </label>
                <input
                  id="bank-name"
                  type="text"
                  required
                  placeholder="e.g. EcoBank International"
                  value={bankName}
                  onChange={(event) => setBankName(event.target.value)}
                  className={inputClass}
                />
              </div>
              <div className="flex flex-col gap-1.5">
                <label htmlFor="branch" className="text-sm font-medium text-on-surface-variant">
                  Branch
                </label>
                <input
                  id="branch"
                  type="text"
                  required
                  placeholder="e.g. Central Business District"
                  value={branch}
                  onChange={(event) => setBranch(event.target.value)}
                  className={inputClass}
                />
              </div>
              <div className="flex flex-col gap-1.5">
                <label htmlFor="account-holder" className="text-sm font-medium text-on-surface-variant">
                  Account Holder Name
                </label>
                <input
                  id="account-holder"
                  type="text"
                  required
                  placeholder="Full name as per bank records"
                  value={accountHolderName}
                  onChange={(event) => setAccountHolderName(event.target.value)}
                  className={inputClass}
                />
              </div>
              <div className="flex flex-col gap-1.5">
                <label htmlFor="account-number" className="text-sm font-medium text-on-surface-variant">
                  Account Number
                </label>
                <input
                  id="account-number"
                  type="text"
                  required
                  placeholder="Enter account number"
                  value={accountNumber}
                  onChange={(event) => setAccountNumber(event.target.value)}
                  className={inputClass}
                />
              </div>
            </div>

            <div>
              <label className="mb-1.5 block text-sm font-medium text-on-surface-variant">
                Verification Document
              </label>
              <div
                onClick={() => fileInputRef.current?.click()}
                onDragOver={(event) => {
                  event.preventDefault();
                  setIsDragging(true);
                }}
                onDragLeave={() => setIsDragging(false)}
                onDrop={(event) => {
                  event.preventDefault();
                  setIsDragging(false);
                  const file = event.dataTransfer.files[0];
                  if (file) setVerificationDocumentFileName(file.name);
                }}
                className={`group flex cursor-pointer flex-col items-center justify-center gap-2 rounded-xl border-2 border-dashed p-12 text-center transition-all ${
                  isDragging
                    ? "border-primary bg-secondary-container/20"
                    : "border-outline-variant bg-surface-container-low hover:border-primary"
                }`}
              >
                <input
                  ref={fileInputRef}
                  type="file"
                  accept="image/*,.pdf"
                  className="hidden"
                  onChange={(event) => {
                    const file = event.target.files?.[0];
                    if (file) setVerificationDocumentFileName(file.name);
                  }}
                />
                <div className="flex h-16 w-16 items-center justify-center rounded-full bg-secondary-container text-primary transition-transform group-hover:scale-110">
                  <UploadCloud aria-hidden="true" className="h-8 w-8" />
                </div>
                <p className="font-semibold text-foreground">Upload Cancelled Cheque or Bank Statement</p>
                <p className="text-sm text-on-surface-variant">Drag and drop or click to browse files</p>
                {verificationDocumentFileName && (
                  <p className="mt-1 flex items-center gap-1.5 text-sm font-medium text-primary">
                    <CheckCircle2 aria-hidden="true" className="h-4 w-4" />
                    {verificationDocumentFileName}
                  </p>
                )}
              </div>
              <p className="mt-1.5 text-xs text-on-surface-variant">Accepted formats: PDF, JPG, PNG (Max 5MB)</p>
            </div>

            <div className="flex items-start gap-3 rounded-lg bg-surface-container-high p-4">
              <Lock aria-hidden="true" className="mt-0.5 h-5 w-5 shrink-0 text-primary" />
              <p className="text-sm text-foreground">
                <span className="font-semibold text-primary">Your data is encrypted and kept strictly confidential.</span>
                <br />
                <span className="text-on-surface-variant">
                  EcoMarket uses industry-standard 256-bit AES encryption to protect your banking details. This
                  information is only used for automated settlement processing.
                </span>
              </p>
            </div>

            <div className="flex items-start gap-3">
              <input
                id="legal-agreement"
                type="checkbox"
                required
                checked={legalAgreementAccepted}
                onChange={(event) => setLegalAgreementAccepted(event.target.checked)}
                className="mt-0.5 h-5 w-5 shrink-0 rounded border-outline-variant accent-primary"
              />
              <label htmlFor="legal-agreement" className="cursor-pointer select-none text-sm text-on-surface-variant">
                I agree that providing false identity or fraudulent store details will lead to immediate legal action
                and account suspension.
              </label>
            </div>

            {error && (
              <p role="alert" className="text-sm font-medium text-red-600">
                {error}
              </p>
            )}

            <div className="border-t border-outline-variant pt-6">
              <button
                type="submit"
                disabled={isSubmitting}
                className="flex h-14 w-full items-center justify-center gap-2 rounded-lg bg-primary text-base font-bold text-white shadow-md transition-all hover:bg-primary-container active:opacity-80 disabled:cursor-not-allowed disabled:opacity-70"
              >
                {isSubmitting ? (
                  <>
                    <Loader2 aria-hidden="true" className="h-5 w-5 animate-spin" />
                    Processing...
                  </>
                ) : (
                  <>
                    Submit Vendor Application for Review
                    <Send aria-hidden="true" className="h-5 w-5" />
                  </>
                )}
              </button>
            </div>
          </div>
        </div>
      </form>
    </div>
  );
}
