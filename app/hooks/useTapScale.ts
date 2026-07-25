"use client";

import { useCallback, useRef } from "react";
import gsap from "gsap";

export function useTapScale<T extends HTMLElement>(scale = 0.94) {
  const cleanup = useRef<() => void>(() => {});

  return useCallback(
    (node: T | null) => {
      cleanup.current();
      cleanup.current = () => {};
      if (!node) return;

      const press = () => {
        if (window.matchMedia("(prefers-reduced-motion: reduce)").matches) return;
        gsap.to(node, { scale, duration: 0.15, ease: "power2.out", overwrite: true });
      };

      const release = () => {
        gsap.to(node, { scale: 1, duration: 0.35, ease: "elastic.out(1, 0.5)", overwrite: true });
      };

      node.addEventListener("pointerdown", press);
      node.addEventListener("pointerup", release);
      node.addEventListener("pointerleave", release);
      node.addEventListener("pointercancel", release);

      cleanup.current = () => {
        node.removeEventListener("pointerdown", press);
        node.removeEventListener("pointerup", release);
        node.removeEventListener("pointerleave", release);
        node.removeEventListener("pointercancel", release);
      };
    },
    [scale]
  );
}
