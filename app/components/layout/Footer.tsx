import Link from "next/link";

const shopLinks = [
  { label: "Groceries", href: "#" },
  { label: "Organic Products", href: "#" },
  { label: "Wholesale", href: "#" },
  { label: "Special Offers", href: "#" },
];

const marketplaceLinks = [
  { label: "About Us", href: "#" },
  { label: "Vendor Terms", href: "#" },
  { label: "Privacy Policy", href: "#" },
  { label: "Customer Support", href: "#" },
];

function FacebookIcon({ className }: { className?: string }) {
  return (
    <svg viewBox="0 0 24 24" fill="currentColor" className={className} aria-hidden="true">
      <path d="M22 12a10 10 0 1 0-11.56 9.88v-6.99H7.9v-2.89h2.54V9.79c0-2.51 1.49-3.89 3.78-3.89 1.1 0 2.24.2 2.24.2v2.46h-1.26c-1.24 0-1.63.77-1.63 1.56v1.87h2.78l-.44 2.89h-2.34v6.99A10 10 0 0 0 22 12Z" />
    </svg>
  );
}

function InstagramIcon({ className }: { className?: string }) {
  return (
    <svg
      viewBox="0 0 24 24"
      fill="none"
      stroke="currentColor"
      strokeWidth="2"
      className={className}
      aria-hidden="true"
    >
      <rect x="3" y="3" width="18" height="18" rx="5" />
      <circle cx="12" cy="12" r="4" />
      <circle cx="17.5" cy="6.5" r="1" fill="currentColor" stroke="none" />
    </svg>
  );
}

function LinkedinIcon({ className }: { className?: string }) {
  return (
    <svg viewBox="0 0 24 24" fill="currentColor" className={className} aria-hidden="true">
      <path d="M6.5 8.98a2 2 0 1 0 0-4 2 2 0 0 0 0 4ZM4.75 10.48h3.5V20.5h-3.5V10.48ZM10.75 10.48h3.36v1.37h.05c.47-.87 1.6-1.6 3.3-1.6 3.53 0 4.18 2.24 4.18 5.16v5.09h-3.5v-4.51c0-1.08-.02-2.46-1.5-2.46-1.5 0-1.74 1.17-1.74 2.38v4.59h-3.15V10.48Z" />
    </svg>
  );
}

const socialLinks = [
  { label: "Facebook", href: "#", Icon: FacebookIcon },
  { label: "Instagram", href: "#", Icon: InstagramIcon },
  { label: "LinkedIn", href: "#", Icon: LinkedinIcon },
];

export default function Footer() {
  const year = new Date().getFullYear();

  return (
    <footer aria-label="Footer" className="w-full border-t border-outline-variant bg-white">
      <div className="mx-auto w-full max-w-7xl px-6 py-10">
        <div className="flex flex-col gap-10 md:flex-row md:justify-between md:gap-12">
          <div className="max-w-xs">
            <Link href="/" className="text-xl font-bold text-foreground">
              EcoMarket
            </Link>
            <p className="mt-3 text-sm text-on-surface-variant">
              Our mission is to build a sustainable global marketplace by
              connecting trusted local vendors with conscious shoppers through
              transparency, quality, and ethical commerce.
            </p>
          </div>

          <div className="grid grid-cols-1 gap-8 sm:grid-cols-2 md:grid-cols-3 md:gap-12 lg:gap-16">
            <div>
              <h3 className="text-sm font-semibold text-foreground">Shop</h3>
              <ul className="mt-3 space-y-2 text-sm text-on-surface-variant">
                {shopLinks.map((link) => (
                  <li key={link.label}>
                    <Link
                      href={link.href}
                      className="inline-block transition-all duration-300 ease-out hover:translate-x-1 hover:text-primary"
                    >
                      {link.label}
                    </Link>
                  </li>
                ))}
              </ul>
            </div>

            <div>
              <h3 className="text-sm font-semibold text-foreground">Marketplace</h3>
              <ul className="mt-3 space-y-2 text-sm text-on-surface-variant">
                {marketplaceLinks.map((link) => (
                  <li key={link.label}>
                    <Link
                      href={link.href}
                      className="inline-block transition-all duration-300 ease-out hover:translate-x-1 hover:text-primary"
                    >
                      {link.label}
                    </Link>
                  </li>
                ))}
              </ul>
            </div>

            <div>
              <h3 className="text-sm font-semibold text-foreground">Follow Us</h3>
              <div className="mt-3 flex items-center gap-3">
                {socialLinks.map(({ label, href, Icon }) => (
                  <Link
                    key={label}
                    href={href}
                    aria-label={label}
                    className="p-1 text-on-surface-variant transition-transform duration-300 ease-out hover:scale-110 hover:text-primary"
                  >
                    <Icon className="h-4 w-4" />
                  </Link>
                ))}
              </div>
            </div>
          </div>
        </div>

        <div className="mt-10 flex flex-col gap-4 border-t border-outline-variant pt-6 sm:flex-row sm:items-center sm:justify-between">
          <p className="text-xs text-on-surface-variant">
            © {year} EcoMarket Marketplace. All Rights Reserved. Created by Tahasin Islam and Masfi.
          </p>
          <div className="flex items-center gap-4 text-xs text-on-surface-variant">
            <span>English (US)</span>
            <span>BDT (৳)</span>
          </div>
        </div>
      </div>
    </footer>
  );
}
