"use client";

import { useState } from "react";
import { useVendorAuth } from "@/app/context/VendorAuthContext";
import { useVendors } from "@/app/context/VendorContext";
import { MerchantMinimalHeader } from "@/app/components/vendor/register/MerchantMinimalHeader";
import { MerchantPortalHeader } from "@/app/components/vendor/register/MerchantPortalHeader";
import { RegistrationSuccess } from "@/app/components/vendor/register/RegistrationSuccess";
import { StepIndicator } from "@/app/components/vendor/register/StepIndicator";
import { Step1 } from "@/app/components/vendor/register/Step1";
import { Step2 } from "@/app/components/vendor/register/Step2";
import { Step3 } from "@/app/components/vendor/register/Step3";
import { Step4 } from "@/app/components/vendor/register/Step4";
import type { Vendor } from "@/data/vendors";
import type { VendorRegistrationData } from "@/app/types/vendor";

export default function VendorRegisterPage() {
  const [step, setStep] = useState(1);
  const [data, setData] = useState<Partial<VendorRegistrationData>>({});
  const [submittedVendor, setSubmittedVendor] = useState<Vendor | null>(null);
  const { addVendor } = useVendors();
  const { signup } = useVendorAuth();
  const year = new Date().getFullYear();

  const handleSubmitApplication = async (
    payout: VendorRegistrationData["payout"]
  ): Promise<{ success: true } | { success: false; error: string }> => {
    setData((prev) => ({ ...prev, payout }));

    await new Promise((resolve) => setTimeout(resolve, 2000));

    if (!data.personal || !data.business) {
      return { success: false, error: "Something went wrong — please restart your application." };
    }

    const signupResult = signup({
      fullName: data.personal.fullLegalName,
      businessName: data.personal.businessName,
      email: data.personal.email,
      phone: data.personal.phone,
      password: data.personal.password,
    });

    if (!signupResult.success) {
      return signupResult;
    }

    const vendor = addVendor({ personal: data.personal, business: data.business });
    setSubmittedVendor(vendor);
    return { success: true };
  };

  return (
    <div className="flex min-h-screen flex-col bg-surface text-on-surface">
      {step === 4 || submittedVendor ? (
        <MerchantMinimalHeader stepLabel={submittedVendor ? "Application Submitted" : "Step 4 of 4: Payout Details"} />
      ) : (
        <MerchantPortalHeader />
      )}

      <main className="w-full grow px-4 py-12 sm:px-6 sm:py-20">
        {!submittedVendor && <StepIndicator currentStep={step} />}

        {submittedVendor ? (
          <RegistrationSuccess shopName={submittedVendor.name} />
        ) : (
          <>
            {step === 1 && (
              <Step1
                initialData={data.personal}
                onNext={(personal) => {
                  setData((prev) => ({ ...prev, personal }));
                  setStep(2);
                }}
              />
            )}

            {step === 2 && (
              <Step2
                initialData={data.business}
                onBack={() => setStep(1)}
                onNext={(business) => {
                  setData((prev) => ({ ...prev, business }));
                  setStep(3);
                }}
              />
            )}

            {step === 3 && (
              <Step3
                initialData={data.verification}
                onBack={() => setStep(2)}
                onNext={(verification) => {
                  setData((prev) => ({ ...prev, verification }));
                  setStep(4);
                }}
              />
            )}

            {step === 4 && data.personal && data.business && data.verification && (
              <Step4
                registrationData={{ personal: data.personal, business: data.business, verification: data.verification }}
                initialData={data.payout}
                onSubmit={handleSubmitApplication}
              />
            )}
          </>
        )}
      </main>

      <footer className="w-full border-t border-outline-variant bg-surface-container-low px-4 py-8 sm:px-6">
        <div className="mx-auto flex w-full max-w-7xl flex-col items-center justify-between gap-4 md:flex-row">
          <span className="text-lg font-bold text-primary">EcoMarket</span>
          <div className="flex flex-wrap justify-center gap-6">
            <a href="#" className="text-sm text-on-surface-variant transition-colors hover:text-primary">
              Privacy Policy
            </a>
            <a href="#" className="text-sm text-on-surface-variant transition-colors hover:text-primary">
              Terms of Service
            </a>
            <a href="#" className="text-sm text-on-surface-variant transition-colors hover:text-primary">
              Compliance
            </a>
            <a href="#" className="text-sm text-on-surface-variant transition-colors hover:text-primary">
              Security Documentation
            </a>
          </div>
          <p className="text-sm text-on-surface-variant">
            © {year} EcoMarket Merchant Portal. All rights reserved.
          </p>
        </div>
      </footer>
    </div>
  );
}
