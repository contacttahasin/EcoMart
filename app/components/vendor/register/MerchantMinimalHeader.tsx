import { CircleHelp, X } from "lucide-react";
import Link from "next/link";

type MerchantMinimalHeaderProps = {
  stepLabel: string;
};

export function MerchantMinimalHeader({ stepLabel }: MerchantMinimalHeaderProps) {
  return (
    <header className="sticky top-0 z-50 w-full bg-surface shadow-[0px_12px_32px_rgba(0,0,0,0.12)]">
      <div className="mx-auto flex h-20 w-full max-w-7xl items-center justify-between px-4 sm:px-6">
        <span className="text-2xl font-bold text-primary">EcoMarket</span>

        <span className="hidden text-sm font-medium text-on-surface-variant md:block">{stepLabel}</span>

        <div className="flex items-center gap-2">
          <button
            type="button"
            aria-label="Help"
            className="rounded-full p-2 text-on-surface-variant transition-colors hover:bg-surface-container active:opacity-80"
          >
            <CircleHelp aria-hidden="true" className="h-5 w-5" />
          </button>
          <Link
            href="/"
            aria-label="Close and exit registration"
            className="rounded-full p-2 text-on-surface-variant transition-colors hover:bg-surface-container active:opacity-80"
          >
            <X aria-hidden="true" className="h-5 w-5" />
          </Link>
        </div>
      </div>
    </header>
  );
}
