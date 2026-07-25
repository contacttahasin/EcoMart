"use client";

import { useEffect, useRef } from "react";
import gsap from "gsap";
import Image from "next/image";
import Link from "next/link";
import { useTapScale } from "@/app/hooks/useTapScale";

export default function Hero() {
  const contentRef = useRef<HTMLDivElement>(null);
  const marketplaceTapRef = useTapScale<HTMLAnchorElement>();
  const sellerTapRef = useTapScale<HTMLAnchorElement>();

  useEffect(() => {
    if (!contentRef.current) return;
    if (window.matchMedia("(prefers-reduced-motion: reduce)").matches) return;

    const targets = contentRef.current.children;
    gsap.fromTo(
      targets,
      { opacity: 0, y: 24 },
      { opacity: 1, y: 0, duration: 0.8, ease: "power2.out", stagger: 0.15 }
    );
  }, []);

  return (
    <section
      aria-label="Hero"
      className="relative flex min-h-140 w-full items-center overflow-hidden py-16 sm:h-150 sm:py-0 lg:h-175"
    >
      <div
        aria-hidden="true"
        className="absolute inset-0 bg-[url('/home/component1-mobile.png')] bg-cover bg-center bg-no-repeat sm:hidden"
      />

      <div aria-hidden="true" className="absolute inset-0 hidden grid-cols-3 grid-rows-2 sm:grid">
        {Array.from({ length: 6 }).map((_, i) => (
          <div key={i} className="relative overflow-hidden">
            <Image
              src="/home/component1.png"
              alt=""
              fill
              preload={i === 0}
              sizes="34vw"
              className="animate-hero-zoom object-cover object-center motion-reduce:animate-none"
            />
          </div>
        ))}
      </div>

      <div
        aria-hidden="true"
        className="absolute inset-0 z-10 bg-gradient-to-t from-black/70 via-black/30 to-transparent"
      />

      <div
        ref={contentRef}
        className="relative z-20 mx-auto flex w-full max-w-7xl flex-col items-start gap-4 px-6 sm:gap-6"
      >
        <span className="inline-flex items-center rounded-full bg-primary px-4 py-1.5 text-sm font-semibold text-white">
          Verified Eco-Sellers
        </span>

        <h1 className="max-w-2xl text-4xl font-bold leading-tight text-white sm:text-5xl lg:text-6xl">
          Shop Sustainably for a Greener Tomorrow
        </h1>

        <p className="max-w-xl text-base text-white/90 sm:text-lg">
          Discover ethical brands and high-quality organic products delivered
          directly from local vendors to your doorstep.
        </p>

        <div className="mt-2 flex w-full flex-col gap-4 sm:w-auto sm:flex-row sm:items-center">
          <Link
            href="/marketplace"
            ref={marketplaceTapRef}
            className="w-full touch-manipulation rounded-full bg-primary px-6 py-3 text-center text-base font-semibold text-white transition-transform duration-200 ease-out hover:scale-105 sm:w-auto"
          >
            Browse Marketplace
          </Link>
          <Link
            href="/vendor"
            ref={sellerTapRef}
            className="w-full touch-manipulation rounded-full border border-white/40 bg-white/15 px-6 py-3 text-center text-base font-semibold text-white backdrop-blur-md transition-transform duration-200 ease-out hover:scale-105 hover:bg-white/25 sm:w-auto"
          >
            Become a Seller
          </Link>
        </div>
      </div>
    </section>
  );
}
