import { BadgeCheck, Package2, ShieldCheck } from "lucide-react";

const BADGES = [
  { icon: ShieldCheck, label: "Secure Payment" },
  { icon: Package2, label: "Plastic-Free Shipping" },
  { icon: BadgeCheck, label: "B-Corp Certified" },
];

export function TrustBadges() {
  return (
    <div className="flex flex-wrap items-center justify-center gap-6 py-4 sm:justify-start">
      {BADGES.map(({ icon: Icon, label }) => (
        <div
          key={label}
          className="flex items-center gap-1.5 text-xs font-semibold uppercase tracking-wide text-on-surface-variant"
        >
          <Icon aria-hidden="true" className="h-4 w-4 text-primary" />
          {label}
        </div>
      ))}
    </div>
  );
}
