import { BadgeCheck, Star, Store, UserPlus } from "lucide-react";
import Image from "next/image";
import Link from "next/link";
import type { Vendor } from "@/data/vendors";

type VendorCardProps = {
  vendor: Vendor;
};

export function VendorCard({ vendor }: VendorCardProps) {
  return (
    <div className="flex flex-col gap-4 rounded-2xl bg-white p-5 shadow-md">
      <div className="flex items-center gap-3">
        {vendor.profileImage ? (
          <Image
            src={vendor.profileImage}
            alt={`${vendor.name}'s logo`}
            width={48}
            height={48}
            className="h-12 w-12 shrink-0 rounded-full object-cover"
          />
        ) : (
          <div
            aria-hidden="true"
            className="flex h-12 w-12 shrink-0 items-center justify-center rounded-full bg-secondary-container text-lg font-semibold text-primary"
          >
            {vendor.name.charAt(0).toUpperCase()}
          </div>
        )}
        <div className="min-w-0 flex-1">
          <div className="flex items-center gap-1.5">
            <span className="truncate text-base font-semibold text-foreground">{vendor.name}</span>
            {vendor.verified && (
              <BadgeCheck aria-label="Verified vendor" className="h-4 w-4 shrink-0 text-primary" />
            )}
          </div>
          <p className="truncate text-sm text-on-surface-variant">{vendor.storeName}</p>
        </div>
      </div>

      <div className="flex items-center gap-1.5 text-sm">
        <Star aria-hidden="true" className="h-4 w-4 fill-primary text-primary" />
        <span className="font-semibold text-foreground">{vendor.rating.toFixed(1)}</span>
        <span className="text-on-surface-variant">({vendor.totalReviews} reviews)</span>
      </div>

      <div className="flex items-center gap-2">
        <Link
          href={vendor.profileUrl}
          className="flex flex-1 items-center justify-center gap-2 rounded-full bg-primary px-4 py-2.5 text-sm font-semibold text-white transition-all duration-300 ease-out hover:scale-[1.02] hover:bg-on-surface-variant focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-primary"
        >
          <Store aria-hidden="true" className="h-4 w-4" />
          Visit Store
        </Link>
        <button
          type="button"
          disabled
          aria-label="Follow vendor — coming soon"
          title="Coming soon"
          className="flex h-10 w-10 shrink-0 items-center justify-center rounded-full border border-outline-variant text-on-surface-variant opacity-50"
        >
          <UserPlus aria-hidden="true" className="h-4 w-4" />
        </button>
      </div>
    </div>
  );
}
