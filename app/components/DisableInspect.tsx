"use client";

import { useEffect } from "react";

/** Blocks right-click context menu and common devtools shortcuts site-wide. */
export function DisableInspect() {
  useEffect(() => {
    function blockContextMenu(e: MouseEvent) {
      e.preventDefault();
    }

    function blockKeys(e: KeyboardEvent) {
      const key = e.key.toUpperCase();
      const blockedCombo =
        key === "F12" ||
        (e.ctrlKey && e.shiftKey && (key === "I" || key === "J" || key === "C")) ||
        (e.metaKey && e.altKey && (key === "I" || key === "J" || key === "C")) ||
        (e.ctrlKey && key === "U");

      if (blockedCombo) e.preventDefault();
    }

    document.addEventListener("contextmenu", blockContextMenu);
    document.addEventListener("keydown", blockKeys);

    return () => {
      document.removeEventListener("contextmenu", blockContextMenu);
      document.removeEventListener("keydown", blockKeys);
    };
  }, []);

  return null;
}
