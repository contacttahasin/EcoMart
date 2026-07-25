"use client";

import { Zap } from "lucide-react";
import Image from "next/image";
import Link from "next/link";
import { useMemo, useState } from "react";
import Navbar from "@/app/components/Navbar";
import Footer from "@/app/components/layout/Footer";
import { CountdownTimer } from "@/app/components/deals/CountdownTimer";
import { DealCategoryTabs } from "@/app/components/deals/DealCategoryTabs";
import { FlashDealCard } from "@/app/components/deals/FlashDealCard";
import { PromoCodeBanner } from "@/app/components/deals/PromoCodeBanner";
import { CATEGORIES, products } from "@/data/products";

const ALL_DEALS = "All Deals";
const CATEGORY_TABS = [ALL_DEALS, ...CATEGORIES];

export default function DealsPage() {
  const [activeCategory, setActiveCategory] = useState(ALL_DEALS);

  const dealProducts = useMemo(
    () =>
      products
        .filter((product) => product.status === "active" && product.discount > 0 && product.stock > 0)
        .sort((a, b) => b.discount - a.discount || b.rating - a.rating),
    []
  );

  const visibleDeals = useMemo(
    () =>
      activeCategory === ALL_DEALS
        ? dealProducts
        : dealProducts.filter((product) => product.category === activeCategory),
    [dealProducts, activeCategory]
  );

  return (
    <div className="flex min-h-screen flex-col bg-background">
      <Navbar />

      <main className="grow">
        <section className="relative overflow-hidden bg-surface-container-lowest px-4 py-16 sm:px-6">
          <div
            aria-hidden="true"
            className="pointer-events-none absolute -right-24 -top-24 h-96 w-96 rounded-full bg-secondary-container/40 blur-3xl"
          />
          <div className="relative z-10 mx-auto grid max-w-7xl items-center gap-8 lg:grid-cols-2">
            <div className="space-y-6">
              <span className="inline-flex items-center rounded-full bg-secondary-container px-4 py-1.5 text-xs font-semibold uppercase tracking-wider text-on-secondary-container">
                Limited Time Only
              </span>
              <h1 className="text-4xl font-bold leading-tight text-foreground sm:text-5xl">
                Mega Deals &amp; Discounts - <span className="text-primary">Up to 70% OFF</span>
              </h1>
              <p className="max-w-md text-lg text-on-surface-variant">
                Unbeatable prices on your eco-friendly favorites. Sustainability meets savings this season.
              </p>
              <div className="flex flex-wrap items-center gap-4 pt-4">
                <Link
                  href="/"
                  className="rounded-xl bg-primary px-8 py-4 text-sm font-medium text-white shadow-lg transition-all hover:bg-primary-container active:scale-95"
                >
                  Shop Now
                </Link>
                <CountdownTimer />
              </div>
            </div>

            <div className="relative h-100 overflow-hidden rounded-3xl shadow-2xl lg:h-125">
              <Image
                src="/home/component4-im1.jpg"
                alt="Eco-friendly home products on display"
                fill
                sizes="(min-width: 1024px) 50vw, 100vw"
                className="object-cover"
                priority
              />
              <div className="absolute inset-0 bg-linear-to-t from-black/20 to-transparent" />
            </div>
          </div>
        </section>

        <section className="mx-auto max-w-7xl overflow-x-auto px-4 py-12 sm:px-6">
          <DealCategoryTabs categories={CATEGORY_TABS} active={activeCategory} onSelect={setActiveCategory} />
        </section>

        <section className="mx-auto mb-16 max-w-7xl px-4 sm:px-6">
          <PromoCodeBanner />
        </section>

        <section className="mx-auto mb-20 max-w-7xl px-4 sm:px-6">
          <div className="mb-8 flex items-center justify-between">
            <div className="flex items-center gap-3">
              <Zap aria-hidden="true" className="h-6 w-6 fill-error text-error" />
              <h2 className="text-2xl font-bold text-foreground sm:text-3xl">Flash Sales</h2>
            </div>
            <Link href="/" className="text-sm font-medium text-primary hover:underline">
              View All Flash Sales
            </Link>
          </div>

          {visibleDeals.length === 0 ? (
            <p className="rounded-2xl border border-dashed border-outline-variant bg-white px-6 py-16 text-center text-on-surface-variant">
              No active deals in this category right now — check back soon.
            </p>
          ) : (
            <div className="grid grid-cols-1 gap-6 sm:grid-cols-2 lg:grid-cols-4">
              {visibleDeals.map((product) => (
                <FlashDealCard key={product.id} product={product} />
              ))}
            </div>
          )}
        </section>
      </main>

      <Footer />
    </div>
  );
}
