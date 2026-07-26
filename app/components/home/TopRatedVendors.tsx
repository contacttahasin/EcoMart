import { ArrowRight, BadgeCheck, Sparkles, Star, Store } from "lucide-react";
import Link from "next/link";
import { fetchTopVendors, type TopVendor } from "@/services/public-vendor.service";

function formatReviewCount(totalReviews: number) {
  if (totalReviews >= 1000) {
    return `${(totalReviews / 1000).toFixed(1)}k`;
  }
  return `${totalReviews}`;
}

function VendorAvatar({ vendor }: { vendor: TopVendor }) {
  const imageUrl = vendor.logoUrl ?? vendor.coverImageUrl;

  if (imageUrl) {
    return (
      // eslint-disable-next-line @next/next/no-img-element
      <img
        src={imageUrl}
        alt={`${vendor.shopName}'s profile photo`}
        width={56}
        height={56}
        className="h-14 w-14 shrink-0 rounded-full object-cover"
      />
    );
  }

  return (
    <div
      aria-hidden="true"
      className="flex h-14 w-14 shrink-0 items-center justify-center rounded-full bg-secondary-container text-lg font-semibold text-primary"
    >
      {vendor.shopName.charAt(0).toUpperCase()}
    </div>
  );
}

function VendorCard({ vendor }: { vendor: TopVendor }) {
  return (
    <Link
      href={`/vendors/${vendor.slug}`}
      aria-label={`View ${vendor.shopName}'s profile`}
      className="group flex flex-col gap-4 rounded-2xl bg-white p-6 shadow-md transition-all duration-300 ease-out hover:-translate-y-1 hover:shadow-xl focus-visible:-translate-y-1 focus-visible:shadow-xl focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-primary"
    >
      <div className="flex items-start gap-4">
        <VendorAvatar vendor={vendor} />

        <div className="min-w-0 flex-1">
          <div className="flex items-center gap-1.5">
            <h3 className="truncate text-base font-semibold text-foreground">{vendor.shopName}</h3>
            {vendor.verificationStatus === "approved" && (
              <BadgeCheck aria-label="Verified vendor" className="h-4 w-4 shrink-0 text-primary" />
            )}
          </div>
          <p className="truncate text-sm text-on-surface-variant">{vendor.bio || "EcoMart Vendor"}</p>
        </div>

        <ArrowRight
          aria-hidden="true"
          className="h-5 w-5 shrink-0 text-on-surface-variant transition-transform duration-300 ease-out group-hover:translate-x-1"
        />
      </div>

      {vendor.reviewCount > 0 ? (
        <div className="flex items-center gap-1.5 text-sm">
          <Star aria-hidden="true" className="h-4 w-4 fill-primary text-primary" />
          <span className="font-semibold text-foreground">{vendor.avgRating.toFixed(1)}</span>
          <span className="text-on-surface-variant">({formatReviewCount(vendor.reviewCount)} reviews)</span>
        </div>
      ) : (
        <div className="flex items-center gap-1.5 text-sm text-on-surface-variant">
          <Sparkles aria-hidden="true" className="h-4 w-4 text-primary" />
          <span>New Vendor</span>
        </div>
      )}
    </Link>
  );
}

export default async function TopRatedVendors() {
  const topVendors = await fetchTopVendors(6);

  return (
    <section aria-labelledby="top-rated-vendors-heading" className="w-full bg-surface py-20">
      <div className="mx-auto max-w-7xl px-6">
        <div className="mx-auto mb-12 max-w-2xl text-center">
          <h2 id="top-rated-vendors-heading" className="text-3xl font-bold text-primary sm:text-4xl">
            Top Rated Vendors
          </h2>
          <p className="mt-2 text-base text-on-surface-variant">
            Meet the artisans and farmers committed to transparency and quality.
          </p>
        </div>

        {topVendors.length > 0 ? (
          <div className="grid grid-cols-1 gap-6 sm:grid-cols-2 lg:grid-cols-3">
            {topVendors.map((vendor) => (
              <VendorCard key={vendor.id} vendor={vendor} />
            ))}
          </div>
        ) : (
          <div className="flex flex-col items-center gap-4 rounded-2xl border border-dashed border-outline-variant bg-white px-6 py-16 text-center">
            <div
              aria-hidden="true"
              className="flex h-16 w-16 items-center justify-center rounded-full bg-secondary-container"
            >
              <Store className="h-8 w-8 text-primary" />
            </div>
            <p className="text-base font-medium text-on-surface-variant">
              No featured vendors available yet.
            </p>
          </div>
        )}
      </div>
    </section>
  );
}
