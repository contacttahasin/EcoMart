import { BadgeCheck, CalendarDays, MapPin, Star, Store } from "lucide-react";
import Link from "next/link";
import { notFound } from "next/navigation";
import Navbar from "@/app/components/Navbar";
import Footer from "@/app/components/layout/Footer";
import { vendors } from "@/data/vendors";

function formatReviewCount(totalReviews: number) {
  if (totalReviews >= 1000) {
    return `${(totalReviews / 1000).toFixed(1)}k`;
  }
  return `${totalReviews}`;
}

function formatJoinedDate(joinedDate: string) {
  return new Date(joinedDate).toLocaleDateString("en-US", {
    month: "long",
    year: "numeric",
  });
}

export function generateStaticParams() {
  return vendors.map((vendor) => ({ slug: vendor.slug }));
}

export default async function VendorProfilePage({
  params,
}: {
  params: Promise<{ slug: string }>;
}) {
  const { slug } = await params;
  const vendor = vendors.find((candidate) => candidate.slug === slug);

  if (!vendor) {
    notFound();
  }

  return (
    <>
      <Navbar />
      <main className="w-full bg-surface py-12">
        <div className="mx-auto max-w-4xl px-6">
          <div className="rounded-2xl bg-white p-8 shadow-md">
            <div className="flex flex-col items-start gap-6 sm:flex-row sm:items-center">
              <div
                aria-hidden="true"
                className="flex h-20 w-20 shrink-0 items-center justify-center rounded-full bg-secondary-container text-2xl font-semibold text-primary"
              >
                {vendor.name.charAt(0).toUpperCase()}
              </div>

              <div className="min-w-0 flex-1">
                <div className="flex items-center gap-2">
                  <h1 className="truncate text-2xl font-bold text-foreground">{vendor.name}</h1>
                  {vendor.verified && (
                    <BadgeCheck aria-label="Verified vendor" className="h-5 w-5 shrink-0 text-primary" />
                  )}
                </div>
                <p className="mt-1 flex items-center gap-1.5 text-sm text-on-surface-variant">
                  <Store aria-hidden="true" className="h-4 w-4" />
                  {vendor.storeName}
                </p>
              </div>
            </div>

            <div className="mt-8 grid grid-cols-1 gap-4 border-t border-outline-variant pt-6 sm:grid-cols-3">
              <div className="flex items-center gap-2">
                <Star aria-hidden="true" className="h-5 w-5 fill-primary text-primary" />
                <span>
                  <span className="font-semibold text-foreground">{vendor.rating.toFixed(1)}</span>{" "}
                  <span className="text-sm text-on-surface-variant">
                    ({formatReviewCount(vendor.totalReviews)} reviews)
                  </span>
                </span>
              </div>

              <div className="flex items-center gap-2">
                <MapPin aria-hidden="true" className="h-5 w-5 text-on-surface-variant" />
                <span className="text-sm text-foreground">{vendor.location}</span>
              </div>

              <div className="flex items-center gap-2">
                <CalendarDays aria-hidden="true" className="h-5 w-5 text-on-surface-variant" />
                <span className="text-sm text-foreground">
                  Joined {formatJoinedDate(vendor.joinedDate)}
                </span>
              </div>
            </div>

            <div className="mt-6">
              <Link
                href="/marketplace"
                className="inline-flex rounded-full bg-primary px-6 py-3 text-sm font-semibold text-white transition-transform duration-200 ease-out hover:scale-105 active:scale-95"
              >
                View {vendor.name}&apos;s products
              </Link>
            </div>
          </div>
        </div>
      </main>
      <Footer />
    </>
  );
}
