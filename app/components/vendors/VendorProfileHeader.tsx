"use client";

import {
  AtSign,
  BadgeCheck,
  CalendarDays,
  ExternalLink,
  Globe,
  MapPin,
  MessageCircle,
  PackageSearch,
  Share2,
  Star,
  UserCheck,
  UserPlus,
} from "lucide-react";
import { useRouter } from "next/navigation";
import { useEffect, useState } from "react";
import { useAuth } from "@/app/context/AuthContext";
import { followVendor, isFollowingVendor, unfollowVendor } from "@/services/vendor-follow.service";
import type { PublicVendorProfile } from "@/services/public-vendor.service";
import { VendorChatPanel } from "./VendorChatPanel";

function formatReviewCount(totalReviews: number) {
  if (totalReviews >= 1000) return `${(totalReviews / 1000).toFixed(1)}k`;
  return `${totalReviews}`;
}

function formatJoinedDate(joinedDate: string) {
  return new Date(joinedDate).toLocaleDateString("en-US", { month: "long", year: "numeric" });
}

type VendorProfileHeaderProps = {
  vendor: PublicVendorProfile;
};

export function VendorProfileHeader({ vendor }: VendorProfileHeaderProps) {
  const { user } = useAuth();
  const router = useRouter();
  const [isFollowing, setIsFollowing] = useState(false);
  const [followerCount, setFollowerCount] = useState(vendor.followerCount);
  const [isBusy, setIsBusy] = useState(false);
  const [shareMessage, setShareMessage] = useState<string | null>(null);
  const [isChatOpen, setIsChatOpen] = useState(false);

  const handleOpenChat = () => {
    if (!user) {
      router.push("/login");
      return;
    }
    setIsChatOpen(true);
  };

  useEffect(() => {
    let active = true;

    (async () => {
      if (!user) {
        setIsFollowing(false);
        return;
      }
      const following = await isFollowingVendor(user.id, vendor.id);
      if (active) setIsFollowing(following);
    })();

    return () => {
      active = false;
    };
  }, [user, vendor.id]);

  const handleToggleFollow = async () => {
    if (!user) {
      router.push("/login");
      return;
    }

    setIsBusy(true);
    if (isFollowing) {
      await unfollowVendor(user.id, vendor.id);
      setIsFollowing(false);
      setFollowerCount((count) => Math.max(0, count - 1));
    } else {
      await followVendor(user.id, vendor.id);
      setIsFollowing(true);
      setFollowerCount((count) => count + 1);
    }
    setIsBusy(false);
  };

  const handleShare = async () => {
    const url = window.location.href;

    if (navigator.share) {
      try {
        await navigator.share({ title: vendor.shopName, url });
      } catch {
        // user dismissed the native share sheet — nothing to do
      }
      return;
    }

    if (navigator.clipboard) {
      await navigator.clipboard.writeText(url);
      setShareMessage("Link copied!");
      setTimeout(() => setShareMessage(null), 2000);
    }
  };

  return (
    <div className="overflow-hidden rounded-2xl bg-white shadow-md">
      <div className="relative h-36 w-full bg-linear-to-br from-primary to-secondary sm:h-52">
        {vendor.coverImageUrl && (
          // eslint-disable-next-line @next/next/no-img-element
          <img src={vendor.coverImageUrl} alt="" className="absolute inset-0 h-full w-full object-cover" />
        )}
      </div>

      <div className="px-4 pb-8 sm:px-8">
        <div className="flex flex-col gap-4 sm:flex-row sm:items-end sm:justify-between">
          <div className="flex flex-col items-start gap-4 sm:flex-row sm:items-end">
            <div className="-mt-6 shrink-0 rounded-full border-4 border-white bg-white shadow-lg sm:-mt-8">
              {vendor.logoUrl ? (
                // eslint-disable-next-line @next/next/no-img-element
                <img
                  src={vendor.logoUrl}
                  alt={`${vendor.shopName}'s logo`}
                  className="h-20 w-20 rounded-full object-cover sm:h-24 sm:w-24"
                />
              ) : (
                <div
                  aria-hidden="true"
                  className="flex h-20 w-20 items-center justify-center rounded-full bg-secondary-container text-2xl font-semibold text-primary sm:h-24 sm:w-24"
                >
                  {vendor.shopName.charAt(0).toUpperCase()}
                </div>
              )}
            </div>

            <div className="min-w-0 pb-1">
              <div className="flex items-center gap-2">
                <h1 className="truncate text-2xl font-bold text-foreground">{vendor.shopName}</h1>
                {vendor.verificationStatus === "approved" && (
                  <BadgeCheck aria-label="Verified vendor" className="h-5 w-5 shrink-0 text-primary" />
                )}
              </div>
              <p className="mt-1 max-w-xl text-sm text-on-surface-variant">{vendor.bio || "EcoMart Vendor"}</p>
            </div>
          </div>

          <div className="flex shrink-0 items-center gap-2">
            {shareMessage && <span className="text-xs font-medium text-primary">{shareMessage}</span>}
            <button
              type="button"
              onClick={handleToggleFollow}
              disabled={isBusy}
              aria-pressed={isFollowing}
              className={`flex items-center gap-2 rounded-full px-5 py-2.5 text-sm font-semibold transition-all duration-300 ease-out disabled:cursor-not-allowed disabled:opacity-60 ${
                isFollowing
                  ? "border border-outline-variant text-foreground hover:bg-surface"
                  : "bg-primary text-white hover:bg-on-surface-variant"
              }`}
            >
              {isFollowing ? (
                <UserCheck aria-hidden="true" className="h-4 w-4" />
              ) : (
                <UserPlus aria-hidden="true" className="h-4 w-4" />
              )}
              {isFollowing ? "Following" : "Follow"}
            </button>
            <button
              type="button"
              onClick={handleOpenChat}
              className="flex items-center gap-2 rounded-full border border-outline-variant px-5 py-2.5 text-sm font-semibold text-foreground transition-colors hover:bg-surface"
            >
              <MessageCircle aria-hidden="true" className="h-4 w-4" />
              Chat
            </button>
            <button
              type="button"
              onClick={handleShare}
              aria-label="Share this vendor's profile"
              className="flex h-10 w-10 shrink-0 items-center justify-center rounded-full border border-outline-variant text-on-surface-variant transition-colors hover:text-primary"
            >
              <Share2 aria-hidden="true" className="h-4 w-4" />
            </button>
          </div>
        </div>

        <div className="mt-6 grid grid-cols-2 gap-4 border-t border-outline-variant pt-6 sm:grid-cols-4">
          <div className="flex items-center gap-2">
            <Star aria-hidden="true" className="h-5 w-5 shrink-0 fill-primary text-primary" />
            {vendor.reviewCount > 0 ? (
              <span className="truncate">
                <span className="font-semibold text-foreground">{vendor.avgRating.toFixed(1)}</span>{" "}
                <span className="text-sm text-on-surface-variant">({formatReviewCount(vendor.reviewCount)})</span>
              </span>
            ) : (
              <span className="truncate text-sm text-on-surface-variant">New Vendor</span>
            )}
          </div>

          <div className="flex items-center gap-2">
            <PackageSearch aria-hidden="true" className="h-5 w-5 shrink-0 text-on-surface-variant" />
            <span className="truncate text-sm text-foreground">{vendor.productCount} Products</span>
          </div>

          <div className="flex items-center gap-2">
            <UserCheck aria-hidden="true" className="h-5 w-5 shrink-0 text-on-surface-variant" />
            <span className="truncate text-sm text-foreground">{followerCount} Followers</span>
          </div>

          <div className="flex items-center gap-2">
            <MapPin aria-hidden="true" className="h-5 w-5 shrink-0 text-on-surface-variant" />
            <span className="truncate text-sm text-foreground">{vendor.location || "—"}</span>
          </div>
        </div>

        <div className="mt-4 flex flex-wrap items-center gap-x-4 gap-y-2">
          <span className="flex items-center gap-1.5 text-sm text-on-surface-variant">
            <CalendarDays aria-hidden="true" className="h-4 w-4" />
            {vendor.joinedDate ? `Joined ${formatJoinedDate(vendor.joinedDate)}` : "Recently joined"}
          </span>

          {vendor.websiteUrl && (
            <a
              href={vendor.websiteUrl}
              target="_blank"
              rel="noopener noreferrer"
              className="flex items-center gap-1.5 text-sm font-medium text-primary hover:underline"
            >
              <Globe aria-hidden="true" className="h-4 w-4" />
              Website
            </a>
          )}
          {vendor.instagramHandle && (
            <a
              href={`https://instagram.com/${vendor.instagramHandle.replace(/^@/, "")}`}
              target="_blank"
              rel="noopener noreferrer"
              className="flex items-center gap-1.5 text-sm font-medium text-primary hover:underline"
            >
              <AtSign aria-hidden="true" className="h-4 w-4" />
              Instagram
            </a>
          )}
          {vendor.linkedinUrl && (
            <a
              href={vendor.linkedinUrl}
              target="_blank"
              rel="noopener noreferrer"
              className="flex items-center gap-1.5 text-sm font-medium text-primary hover:underline"
            >
              <ExternalLink aria-hidden="true" className="h-4 w-4" />
              LinkedIn
            </a>
          )}
        </div>
      </div>

      <VendorChatPanel
        vendorId={vendor.id}
        vendorName={vendor.shopName}
        isOpen={isChatOpen}
        onClose={() => setIsChatOpen(false)}
      />
    </div>
  );
}
