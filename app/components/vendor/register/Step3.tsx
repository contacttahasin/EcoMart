"use client";

import {
  ArrowLeft,
  BadgeCheck,
  Building2,
  Camera,
  CheckCircle2,
  Info,
  Lock,
  Paperclip,
  ScanFace,
} from "lucide-react";
import { useRef, useState } from "react";
import type { VendorVerificationInfo } from "@/app/types/vendor";
import { DocumentDropzone } from "./DocumentDropzone";

const inputClass =
  "w-full rounded-lg border border-outline-variant bg-white px-4 py-3 text-sm text-foreground outline-none transition-all focus:border-primary focus:ring-2 focus:ring-secondary-container/50";

type Step3Props = {
  initialData?: Partial<VendorVerificationInfo>;
  onNext: (data: VendorVerificationInfo) => void;
  onBack: () => void;
};

export function Step3({ initialData, onNext, onBack }: Step3Props) {
  const [idFrontFileName, setIdFrontFileName] = useState(initialData?.idFrontFileName ?? null);
  const [idBackFileName, setIdBackFileName] = useState(initialData?.idBackFileName ?? null);
  const [businessRegistrationFileName, setBusinessRegistrationFileName] = useState(
    initialData?.businessRegistrationFileName ?? null
  );
  const [tradeLicenseNumber, setTradeLicenseNumber] = useState(initialData?.tradeLicenseNumber ?? "");
  const [tin, setTin] = useState(initialData?.tin ?? "");
  const [selfieCaptured, setSelfieCaptured] = useState(initialData?.selfieCaptured ?? false);
  const [selfieStatus, setSelfieStatus] = useState("Place your face within the frame and click to capture");
  const [selfiePending, setSelfiePending] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const businessRegInputRef = useRef<HTMLInputElement>(null);

  const handleCaptureSelfie = () => {
    if (selfiePending) return;
    setSelfiePending(true);
    setSelfieStatus("Requesting camera access...");
    setTimeout(() => {
      setSelfieStatus("Camera not connected in demo mode. Place your face within the frame.");
      setSelfiePending(false);
      setSelfieCaptured(true);
    }, 2000);
  };

  const handleSubmit = (event: React.FormEvent) => {
    event.preventDefault();
    setError(null);

    if (!selfieCaptured) {
      setError("Please complete the Face ID / Live Selfie verification before continuing.");
      return;
    }

    onNext({
      idFrontFileName,
      idBackFileName,
      businessRegistrationFileName,
      tradeLicenseNumber,
      tin,
      selfieCaptured,
    });
  };

  return (
    <div className="mx-auto max-w-5xl">
      <div className="mb-12 text-center">
        <h1 className="mb-1 text-3xl font-bold tracking-tight text-foreground">Document Verification</h1>
        <p className="text-lg text-on-surface-variant">
          Upload legal documents to prevent fraud and verify your business.
        </p>
      </div>

      <form onSubmit={handleSubmit} className="grid grid-cols-1 items-start gap-6 lg:grid-cols-12">
        <div className="space-y-6 lg:col-span-7">
          <div className="rounded-xl border border-outline-variant/30 bg-surface-container-lowest p-6 shadow-[0px_2px_12px_rgba(0,0,0,0.04)]">
            <div className="mb-6 flex items-center gap-2">
              <BadgeCheck aria-hidden="true" className="h-5 w-5 text-primary" />
              <h2 className="text-xl font-semibold text-foreground">Identity Verification</h2>
            </div>
            <div className="grid grid-cols-1 gap-6 md:grid-cols-2">
              <DocumentDropzone
                label="Front of ID / Passport"
                hint="PNG, JPG, or PDF"
                fileName={idFrontFileName}
                onFileSelected={setIdFrontFileName}
              />
              <DocumentDropzone
                label="Back of ID / Passport"
                hint="Not required for passports"
                fileName={idBackFileName}
                onFileSelected={setIdBackFileName}
              />
            </div>
          </div>

          <div className="rounded-xl border border-outline-variant/30 bg-surface-container-lowest p-6 shadow-[0px_2px_12px_rgba(0,0,0,0.04)]">
            <div className="mb-6 flex items-center gap-2">
              <Building2 aria-hidden="true" className="h-5 w-5 text-primary" />
              <h2 className="text-xl font-semibold text-foreground">Business &amp; Tax Details</h2>
            </div>
            <div className="space-y-6">
              <div className="grid grid-cols-1 gap-6 md:grid-cols-2">
                <div className="flex flex-col gap-1.5">
                  <label htmlFor="trade-license" className="text-sm font-medium text-on-surface-variant">
                    Trade License Number
                  </label>
                  <input
                    id="trade-license"
                    type="text"
                    placeholder="e.g. TL-8829-2024"
                    value={tradeLicenseNumber}
                    onChange={(event) => setTradeLicenseNumber(event.target.value)}
                    className={inputClass}
                  />
                </div>
                <div className="flex flex-col gap-1.5">
                  <label htmlFor="tin" className="text-sm font-medium text-on-surface-variant">
                    TIN (Tax ID Number)
                  </label>
                  <input
                    id="tin"
                    type="text"
                    placeholder="12-3456789"
                    value={tin}
                    onChange={(event) => setTin(event.target.value)}
                    className={inputClass}
                  />
                </div>
              </div>

              <div className="flex items-center gap-4">
                <p className="flex-1 text-sm text-on-surface-variant">
                  {businessRegistrationFileName ?? "Upload a clear copy of your official Business Registration certificate."}
                </p>
                <input
                  ref={businessRegInputRef}
                  type="file"
                  accept="image/*,.pdf"
                  className="hidden"
                  onChange={(event) => {
                    const file = event.target.files?.[0];
                    if (file) setBusinessRegistrationFileName(file.name);
                  }}
                />
                <button
                  type="button"
                  onClick={() => businessRegInputRef.current?.click()}
                  className="flex h-10 shrink-0 items-center gap-1.5 rounded-lg bg-secondary px-4 text-sm font-medium text-white transition-opacity hover:opacity-90"
                >
                  {businessRegistrationFileName ? (
                    <CheckCircle2 aria-hidden="true" className="h-4 w-4" />
                  ) : (
                    <Paperclip aria-hidden="true" className="h-4 w-4" />
                  )}
                  {businessRegistrationFileName ? "Uploaded" : "Upload File"}
                </button>
              </div>
            </div>
          </div>
        </div>

        <div className="space-y-6 lg:col-span-5">
          <div className="rounded-xl border border-outline-variant/30 bg-surface-container-lowest p-6 shadow-[0px_2px_12px_rgba(0,0,0,0.04)]">
            <div className="mb-6 flex items-center gap-2">
              <ScanFace aria-hidden="true" className="h-5 w-5 text-primary" />
              <h2 className="text-xl font-semibold text-foreground">Live Selfie Check</h2>
            </div>

            <button
              type="button"
              onClick={handleCaptureSelfie}
              className="group relative mx-auto flex aspect-square w-full max-w-[320px] items-center justify-center overflow-hidden rounded-full border-4 border-outline-variant/30 bg-surface-container transition-all hover:border-primary"
            >
              <div className="absolute inset-0 flex items-center justify-center bg-black/5">
                <div className="flex flex-col items-center gap-2 px-4 text-center">
                  <div className="flex h-16 w-16 items-center justify-center rounded-full bg-primary/10">
                    {selfieCaptured ? (
                      <CheckCircle2 aria-hidden="true" className="h-8 w-8 text-primary" />
                    ) : (
                      <Camera aria-hidden="true" className="h-8 w-8 text-primary" />
                    )}
                  </div>
                  <p className={`text-sm font-medium text-on-surface-variant ${selfiePending ? "animate-pulse" : ""}`}>
                    {selfieStatus}
                  </p>
                </div>
              </div>
              <div className="pointer-events-none absolute inset-0 flex items-center justify-center opacity-20">
                <div className="h-64 w-48 rounded-[50%] border-2 border-primary" />
              </div>
            </button>

            <div className="mt-6 flex gap-2 rounded-lg bg-secondary-container/30 p-3">
              <Info aria-hidden="true" className="mt-0.5 h-4 w-4 shrink-0 text-secondary" />
              <p className="text-sm text-on-secondary-container">
                Ensure your face is well-lit and not covered by hats, masks, or sunglasses for faster approval.
              </p>
            </div>
          </div>

          <div className="flex items-start gap-4 rounded-xl bg-surface-container p-6">
            <Lock aria-hidden="true" className="mt-0.5 h-5 w-5 shrink-0 text-on-surface-variant" />
            <div>
              <h4 className="text-sm font-semibold text-foreground">Military-Grade Encryption</h4>
              <p className="mt-1 text-sm text-on-surface-variant">
                All uploaded documents are encrypted and stored in secure, compliance-ready servers. We do not share
                your private identity data with third parties.
              </p>
            </div>
          </div>
        </div>

        {error && (
          <p role="alert" className="col-span-full text-sm font-medium text-red-600">
            {error}
          </p>
        )}

        <div className="col-span-full mt-6 flex flex-col items-center justify-between gap-4 border-t border-outline-variant pt-8 md:flex-row">
          <button
            type="button"
            onClick={onBack}
            className="flex items-center gap-1.5 text-sm font-medium text-on-surface-variant transition-colors hover:text-primary"
          >
            <ArrowLeft aria-hidden="true" className="h-4 w-4" />
            Back to Business Profile
          </button>
          <div className="flex w-full gap-4 md:w-auto">
            <button
              type="button"
              className="flex-1 rounded-lg border border-outline px-6 py-2.5 text-sm font-medium text-foreground transition-colors hover:bg-surface-container-low md:flex-none"
            >
              Save Draft
            </button>
            <button
              type="submit"
              className="flex-1 rounded-lg bg-primary px-6 py-2.5 text-sm font-medium text-white shadow-md transition-all hover:opacity-90 active:scale-95 md:flex-none"
            >
              Next: Payout Setup
            </button>
          </div>
        </div>
      </form>
    </div>
  );
}
