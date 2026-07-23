import Link from "next/link";
import { ArrowLeft, Leaf } from "lucide-react";

export function AuthHeader() {
  return (
    <header className="sticky top-0 z-50 flex w-full items-center justify-between bg-surface/80 px-4 py-4 backdrop-blur-sm sm:px-6">
      <Link href="/" className="flex items-center gap-2">
        <Leaf aria-hidden="true" className="h-7 w-7 text-primary" />
        <span className="text-xl font-bold text-primary sm:text-2xl">EcoMarket</span>
      </Link>
      <Link
        href="/"
        className="flex items-center gap-1.5 text-sm font-medium text-primary transition-opacity hover:opacity-70"
      >
        <ArrowLeft aria-hidden="true" className="h-4 w-4" />
        Back to Home
      </Link>
    </header>
  );
}
