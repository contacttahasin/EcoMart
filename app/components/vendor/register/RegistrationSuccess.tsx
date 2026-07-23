import { CheckCircle2 } from "lucide-react";
import Link from "next/link";

type RegistrationSuccessProps = {
  shopName: string;
};

export function RegistrationSuccess({ shopName }: RegistrationSuccessProps) {
  return (
    <div className="mx-auto flex max-w-2xl flex-col items-center rounded-xl bg-surface-container-lowest p-12 text-center shadow-[0px_2px_12px_rgba(0,0,0,0.04)]">
      <div className="mb-6 flex h-20 w-20 items-center justify-center rounded-full bg-secondary-container">
        <CheckCircle2 aria-hidden="true" className="h-10 w-10 text-primary" />
      </div>
      <h1 className="mb-2 text-3xl font-bold tracking-tight text-foreground">Application Submitted!</h1>
      <p className="mb-8 max-w-md text-on-surface-variant">
        Thanks for applying, <span className="font-semibold text-foreground">{shopName}</span>. Our team will
        review your details within 48 hours and notify you by email once your store is approved.
      </p>
      <Link
        href="/"
        className="rounded-lg bg-primary px-6 py-3 text-sm font-bold text-white shadow-md transition-all hover:bg-primary-container active:opacity-80"
      >
        Back to Marketplace
      </Link>
    </div>
  );
}
