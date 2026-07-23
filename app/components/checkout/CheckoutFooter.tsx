import Link from "next/link";
import { Leaf } from "lucide-react";

const supportLinks = [
  { label: "Contact Us", href: "#" },
  { label: "Shipping Policy", href: "#" },
  { label: "Return Portal", href: "#" },
];

const legalLinks = [
  { label: "Privacy Policy", href: "#" },
  { label: "Terms of Service", href: "#" },
  { label: "Impact Report", href: "#" },
];

export function CheckoutFooter() {
  const year = new Date().getFullYear();

  return (
    <footer className="w-full border-t border-outline-variant bg-surface py-10">
      <div className="mx-auto grid w-full max-w-7xl grid-cols-1 gap-8 px-4 sm:px-6 md:grid-cols-4">
        <div className="space-y-3 md:col-span-2">
          <div className="flex items-center gap-2">
            <Leaf aria-hidden="true" className="h-5 w-5 text-primary" />
            <span className="text-lg font-bold text-primary">EcoMarket</span>
          </div>
          <p className="max-w-sm text-sm text-on-surface-variant">
            © {year} EcoMarket. Conscious commerce for a better planet. All our shipments are
            carbon-neutral and plastic-free.
          </p>
        </div>

        <div>
          <h4 className="mb-3 font-semibold text-foreground">Support</h4>
          <ul className="space-y-2 text-sm text-on-surface-variant">
            {supportLinks.map((link) => (
              <li key={link.label}>
                <Link href={link.href} className="underline hover:text-primary">
                  {link.label}
                </Link>
              </li>
            ))}
          </ul>
        </div>

        <div>
          <h4 className="mb-3 font-semibold text-foreground">Legal</h4>
          <ul className="space-y-2 text-sm text-on-surface-variant">
            {legalLinks.map((link) => (
              <li key={link.label}>
                <Link href={link.href} className="underline hover:text-primary">
                  {link.label}
                </Link>
              </li>
            ))}
          </ul>
        </div>
      </div>
    </footer>
  );
}
