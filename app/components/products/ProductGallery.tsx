"use client";

import { AnimatePresence, motion } from "framer-motion";
import { ChevronLeft, ChevronRight, Expand, Play, X } from "lucide-react";
import Image from "next/image";
import { useRef, useState, type MouseEvent } from "react";

type ProductGalleryProps = {
  images: string[];
  title: string;
  video?: string | null;
};

export function ProductGallery({ images, title, video }: ProductGalleryProps) {
  const [activeIndex, setActiveIndex] = useState(0);
  const [showVideo, setShowVideo] = useState(false);
  const [isFullscreen, setIsFullscreen] = useState(false);
  const [isZooming, setIsZooming] = useState(false);
  const [zoomOrigin, setZoomOrigin] = useState("50% 50%");
  const scrollRef = useRef<HTMLDivElement>(null);

  const selectImage = (index: number) => {
    setShowVideo(false);
    setActiveIndex(index);
  };

  const goToRelative = (delta: number) => {
    setShowVideo(false);
    setActiveIndex((prev) => (prev + delta + images.length) % images.length);
  };

  const handleMouseMove = (event: MouseEvent<HTMLDivElement>) => {
    const rect = event.currentTarget.getBoundingClientRect();
    const x = ((event.clientX - rect.left) / rect.width) * 100;
    const y = ((event.clientY - rect.top) / rect.height) * 100;
    setZoomOrigin(`${x}% ${y}%`);
  };

  const handleScroll = () => {
    const node = scrollRef.current;
    if (!node || node.clientWidth === 0) return;
    const index = Math.round(node.scrollLeft / node.clientWidth);
    setActiveIndex(Math.min(Math.max(index, 0), images.length - 1));
  };

  return (
    <div className="w-full">
      {/* Desktop / tablet main viewer with hover-zoom */}
      <div
        className="group relative hidden aspect-square w-full cursor-zoom-in overflow-hidden rounded-2xl bg-surface sm:block"
        onMouseEnter={() => setIsZooming(true)}
        onMouseLeave={() => setIsZooming(false)}
        onMouseMove={handleMouseMove}
        onClick={() => setIsFullscreen(true)}
      >
        <AnimatePresence mode="wait">
          {showVideo && video ? (
            <motion.video
              key="video"
              src={video}
              controls
              className="h-full w-full object-cover"
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              exit={{ opacity: 0 }}
              transition={{ duration: 0.25 }}
            />
          ) : (
            <motion.div
              key={activeIndex}
              initial={{ opacity: 0 }}
              animate={{ opacity: 1, scale: isZooming ? 1.6 : 1 }}
              exit={{ opacity: 0 }}
              transition={{ duration: 0.25, ease: "easeOut" }}
              style={{ transformOrigin: zoomOrigin }}
              className="relative h-full w-full"
            >
              <Image
                src={images[activeIndex]}
                alt={`${title} — image ${activeIndex + 1} of ${images.length}`}
                fill
                sizes="(min-width: 1024px) 40vw, 90vw"
                priority={activeIndex === 0}
                className="object-cover"
              />
            </motion.div>
          )}
        </AnimatePresence>

        <button
          type="button"
          aria-label="View fullscreen"
          onClick={(event) => {
            event.stopPropagation();
            setIsFullscreen(true);
          }}
          className="absolute right-3 top-3 z-10 flex h-9 w-9 items-center justify-center rounded-full bg-white text-on-surface-variant opacity-0 shadow-md transition-all duration-300 ease-out hover:text-primary group-hover:opacity-100 focus-visible:opacity-100 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-primary"
        >
          <Expand aria-hidden="true" className="h-4 w-4" />
        </button>
      </div>

      {/* Mobile: swipeable slider */}
      <div className="sm:hidden">
        <div
          ref={scrollRef}
          onScroll={handleScroll}
          className="flex w-full snap-x snap-mandatory overflow-x-auto rounded-2xl bg-surface [&::-webkit-scrollbar]:hidden"
        >
          {images.map((src, index) => (
            <button
              key={src + index}
              type="button"
              aria-label={`View image ${index + 1} fullscreen`}
              onClick={() => {
                setActiveIndex(index);
                setIsFullscreen(true);
              }}
              className="relative aspect-square w-full shrink-0 snap-center"
            >
              <Image
                src={src}
                alt={`${title} — image ${index + 1} of ${images.length}`}
                fill
                sizes="100vw"
                priority={index === 0}
                className="object-cover"
              />
            </button>
          ))}
        </div>
        {images.length > 1 && (
          <div className="mt-3 flex items-center justify-center gap-1.5" aria-hidden="true">
            {images.map((_, index) => (
              <span
                key={index}
                className={`h-1.5 rounded-full transition-all duration-300 ${
                  index === activeIndex ? "w-5 bg-primary" : "w-1.5 bg-outline-variant"
                }`}
              />
            ))}
          </div>
        )}
      </div>

      {/* Thumbnails (desktop / tablet only) */}
      {(images.length > 1 || video) && (
        <div className="mt-4 hidden gap-3 overflow-x-auto pb-1 sm:flex">
          {images.map((src, index) => {
            const isActive = !showVideo && index === activeIndex;
            return (
              <button
                key={src + index}
                type="button"
                aria-label={`Show image ${index + 1}`}
                aria-current={isActive}
                onClick={() => selectImage(index)}
                className={`relative h-20 w-20 shrink-0 overflow-hidden rounded-xl border-2 transition-all duration-300 ease-out hover:-translate-y-0.5 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-primary ${
                  isActive ? "border-primary" : "border-transparent"
                }`}
              >
                <Image src={src} alt="" fill sizes="80px" className="object-cover" />
              </button>
            );
          })}
          {video && (
            <button
              type="button"
              aria-label="Play product video"
              aria-current={showVideo}
              onClick={() => setShowVideo(true)}
              className={`relative flex h-20 w-20 shrink-0 items-center justify-center overflow-hidden rounded-xl border-2 bg-foreground/80 transition-all duration-300 ease-out hover:-translate-y-0.5 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-primary ${
                showVideo ? "border-primary" : "border-transparent"
              }`}
            >
              <Play aria-hidden="true" fill="currentColor" className="h-6 w-6 text-white" />
            </button>
          )}
        </div>
      )}

      {/* Fullscreen lightbox */}
      <AnimatePresence>
        {isFullscreen && (
          <motion.div
            role="dialog"
            aria-modal="true"
            aria-label={`${title} image viewer`}
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            transition={{ duration: 0.25 }}
            className="fixed inset-0 z-[100] flex items-center justify-center bg-foreground/90 p-4"
            onClick={() => setIsFullscreen(false)}
          >
            <button
              type="button"
              aria-label="Close fullscreen view"
              onClick={() => setIsFullscreen(false)}
              className="absolute right-4 top-4 flex h-10 w-10 items-center justify-center rounded-full bg-white text-foreground shadow-md transition-transform duration-300 ease-out hover:scale-105"
            >
              <X aria-hidden="true" className="h-5 w-5" />
            </button>

            {images.length > 1 && (
              <>
                <button
                  type="button"
                  aria-label="Previous image"
                  onClick={(event) => {
                    event.stopPropagation();
                    goToRelative(-1);
                  }}
                  className="absolute left-4 top-1/2 flex h-10 w-10 -translate-y-1/2 items-center justify-center rounded-full bg-white text-foreground shadow-md transition-transform duration-300 ease-out hover:scale-105"
                >
                  <ChevronLeft aria-hidden="true" className="h-5 w-5" />
                </button>
                <button
                  type="button"
                  aria-label="Next image"
                  onClick={(event) => {
                    event.stopPropagation();
                    goToRelative(1);
                  }}
                  className="absolute right-4 top-1/2 flex h-10 w-10 -translate-y-1/2 items-center justify-center rounded-full bg-white text-foreground shadow-md transition-transform duration-300 ease-out hover:scale-105"
                >
                  <ChevronRight aria-hidden="true" className="h-5 w-5" />
                </button>
              </>
            )}

            <div className="relative h-full max-h-[85vh] w-full max-w-4xl" onClick={(event) => event.stopPropagation()}>
              <Image
                src={images[activeIndex]}
                alt={`${title} — image ${activeIndex + 1} of ${images.length}`}
                fill
                sizes="90vw"
                className="object-contain"
              />
            </div>
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  );
}
