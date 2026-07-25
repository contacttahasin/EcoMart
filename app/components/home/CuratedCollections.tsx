import { ArrowRight } from "lucide-react";
import Image from "next/image";
import Link from "next/link";

type CollectionCardProps = {
  href: string;
  imageSrc: string;
  imageAlt: string;
  title: string;
  subtitle?: string;
  showButton?: boolean;
  variant?: "large" | "default";
  sizes: string;
  heightClassName: string;
};

function CollectionCard({
  href,
  imageSrc,
  imageAlt,
  title,
  subtitle,
  showButton,
  variant = "default",
  sizes,
  heightClassName,
}: CollectionCardProps) {
  return (
    <Link
      href={href}
      className={`group relative block overflow-hidden rounded-2xl ${heightClassName}`}
    >
      <Image
        src={imageSrc}
        alt={imageAlt}
        fill
        sizes={sizes}
        className="object-cover object-center transition-transform duration-300 ease-out group-hover:scale-105"
      />

      <div
        aria-hidden="true"
        className="absolute inset-0 bg-gradient-to-t from-black/70 via-black/30 to-transparent transition-colors duration-300 ease-out group-hover:from-black/80 group-hover:via-black/40"
      />

      <div
        className={`absolute inset-x-0 bottom-0 flex flex-col items-start gap-1 transition-transform duration-300 ease-out group-hover:-translate-y-1 ${
          variant === "large" ? "p-8" : "p-6"
        }`}
      >
        <h3
          className={
            variant === "large"
              ? "text-2xl font-bold text-white sm:text-3xl"
              : "text-lg font-semibold text-white sm:text-xl"
          }
        >
          {title}
        </h3>

        {subtitle && <p className="text-sm text-white/85">{subtitle}</p>}

        {showButton && (
          <span className="mt-3 inline-flex items-center gap-1.5 rounded-full bg-white px-4 py-2 text-sm font-semibold text-primary">
            Explore
            <ArrowRight className="h-4 w-4 transition-transform duration-300 ease-out group-hover:-rotate-12 group-hover:translate-x-0.5" />
          </span>
        )}
      </div>
    </Link>
  );
}

export default function CuratedCollections() {
  return (
    <section aria-labelledby="curated-collections-heading" className="w-full py-20">
      <div className="mx-auto max-w-7xl px-6">
        <div className="mb-10 flex flex-col items-start justify-between gap-4 sm:flex-row sm:items-end">
          <div>
            <h2
              id="curated-collections-heading"
              className="text-3xl font-bold text-primary sm:text-4xl"
            >
              Curated Collections
            </h2>
            <p className="mt-2 text-base text-on-surface-variant">
              Hand-picked categories for conscious living.
            </p>
          </div>

          <Link
            href="/collections"
            className="group inline-flex items-center gap-1.5 text-base font-semibold text-primary"
          >
            View All Categories
            <ArrowRight className="h-4 w-4 transition-transform duration-300 ease-out group-hover:translate-x-1" />
          </Link>
        </div>

        <div className="grid grid-cols-1 gap-6 lg:grid-cols-2">
          <CollectionCard
            href="/collections/organic-groceries"
            imageSrc="/home/component2-im1.jpg"
            imageAlt="Woven basket filled with fresh bread, kale, tomatoes, and carrots"
            title="Organic Groceries"
            subtitle="Farm-to-table freshness guaranteed."
            showButton
            variant="large"
            sizes="(min-width: 1024px) 50vw, 100vw"
            heightClassName="h-[380px] sm:h-[460px] lg:h-[620px]"
          />

          <div className="flex flex-col gap-6">
            <CollectionCard
              href="/collections/sustainable-home"
              imageSrc="/home/component2-im2.jpg"
              imageAlt="Bright living room with a natural wood sofa and potted plants"
              title="Sustainable Home"
              subtitle="Shop Now"
              sizes="(min-width: 1024px) 50vw, 100vw"
              heightClassName="h-[220px] sm:h-[260px] lg:h-[300px]"
            />

            <div className="grid grid-cols-1 gap-6 sm:grid-cols-2">
              <CollectionCard
                href="/collections/ethical-fashion"
                imageSrc="/home/component2-im3.jpg"
                imageAlt="Folded organic cotton shirt beside an EcoMarket tote bag"
                title="Ethical Fashion"
                sizes="(min-width: 1024px) 25vw, (min-width: 640px) 50vw, 100vw"
                heightClassName="h-[200px] sm:h-[240px] lg:h-[296px]"
              />
              <CollectionCard
                href="/collections/bulk-pantry"
                imageSrc="/home/component2-im4.jpg"
                imageAlt="Glass jars of oats, quinoa, lentils, almonds, and granola on a wooden counter"
                title="Bulk Pantry"
                sizes="(min-width: 1024px) 25vw, (min-width: 640px) 50vw, 100vw"
                heightClassName="h-[200px] sm:h-[240px] lg:h-[296px]"
              />
            </div>
          </div>
        </div>
      </div>
    </section>
  );
}
